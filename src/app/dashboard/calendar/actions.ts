"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  htmlLink?: string;
  completed?: boolean;
};

export type CalendarListItem = {
  id: string;
  name: string;
  primary: boolean;
};

function toIsoOrFallback(
  v?: { dateTime?: string; date?: string },
  fallbackIso?: string
) {
  if (v?.dateTime) return v.dateTime;
  if (v?.date) return new Date(v.date).toISOString();
  return fallbackIso ?? new Date().toISOString();
}

function isAllDay(e: GoogleEvent) {
  return Boolean(e.start?.date && !e.start?.dateTime);
}

async function getUserIdOrThrow() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function getUserTimezone(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return u?.timezone ?? "Europe/Kyiv";
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh token: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type?: string;
  };

  return json;
}

async function getGoogleAccountOrThrow(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      token_type: true,
      scope: true,
    },
  });

  if (!account) throw new Error("Google account is not linked.");

  if (!account.refresh_token) {
    throw new Error(
      "Missing refresh_token. Sign out, remove Neuron access in Google permissions, then sign in again (offline access)."
    );
  }

  return account;
}

async function forceRefreshAndStore(userId: string) {
  const account = await getGoogleAccountOrThrow(userId);

  const nowSec = Math.floor(Date.now() / 1000);
  const refreshed = await refreshGoogleAccessToken(account.refresh_token!);
  const newExpiresAt = nowSec + refreshed.expires_in;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      scope: refreshed.scope ?? account.scope,
      token_type: refreshed.token_type ?? account.token_type,
    },
  });

  return refreshed.access_token;
}

async function getValidGoogleAccessToken(userId: string) {
  const account = await getGoogleAccountOrThrow(userId);

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = account.expires_at ?? 0;

  // якщо access_token є і ще не протух — ок
  if (account.access_token && exp > nowSec + 60) {
    return account.access_token;
  }

  // інакше робимо refresh
  return forceRefreshAndStore(userId);
}

async function googleFetch(userId: string, url: string, init?: RequestInit) {
  // 1) пробуємо з валідним токеном
  let accessToken = await getValidGoogleAccessToken(userId);

  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  // 2) якщо 401 — робимо force refresh і повторюємо 1 раз
  if (res.status === 401) {
    accessToken = await forceRefreshAndStore(userId);

    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  }

  return res;
}

export async function listCalendars() {
  const userId = await getUserIdOrThrow();

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  });

  if (!account?.scope?.includes("calendar")) {
    return { calendars: [] };
  }

  const res = await googleFetch(
    userId,
    "https://www.googleapis.com/calendar/v3/users/me/calendarList"
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; primary?: boolean }>;
  };

  const calendars: CalendarListItem[] = (json.items ?? []).map((c) => ({
    id: c.id,
    name: c.summary ?? c.id,
    primary: Boolean(c.primary),
  }));

  calendars.sort((a, b) => Number(b.primary) - Number(a.primary));

  return { calendars };
}

export async function getCalendarEvents(input: {
  timeMinIso: string;
  timeMaxIso: string;
  calendarId?: string;
}) {
  const userId = await getUserIdOrThrow();
  const timeZone = await getUserTimezone(userId);

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  });

  if (!account?.scope?.includes("calendar")) {
    return { events: [], timeZone };
  }

  const calendarId = input.calendarId ?? "primary";
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events`;

  let pageToken: string | undefined;
  const allItems: GoogleEvent[] = [];

  do {
    const url = new URL(baseUrl);

    url.searchParams.set("timeMin", input.timeMinIso);
    url.searchParams.set("timeMax", input.timeMaxIso);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("timeZone", timeZone);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await googleFetch(userId, url.toString());

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Calendar API error: ${res.status} ${text}`);
    }

    const json = (await res.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
    };

    allItems.push(...(json.items ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  const events: CalendarEvent[] = allItems.map((e) => {
    const allDay = isAllDay(e);
    const startIso = toIsoOrFallback(e.start);
    const endIso = toIsoOrFallback(e.end, startIso);

    return {
      id: e.id,
      title: e.summary ?? "(Без назви)",
      start: startIso,
      end: endIso,
      allDay,
      htmlLink: e.htmlLink,
    };
  });

  // Fetch Google Tasks (tasks are global to the account)
  try {
    const listsRes = await googleFetch(
      userId,
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists"
    );

    if (listsRes.ok) {
      const listsJson = await listsRes.json();
      const pLists = (listsJson.items ?? []).map(async (list: { id: string }) => {
        const url = new URL(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`);
        url.searchParams.set("showCompleted", "true");
        url.searchParams.set("showHidden", "true");

        const tRes = await googleFetch(userId, url.toString());
        if (!tRes.ok) {
          const errText = await tRes.text();
          console.error(`Google Tasks API error (${tRes.status}):`, errText);
          events.push({
            id: "err-task-" + list.id,
            title: `[Error: Tasks API ${tRes.status}]`,
            start: input.timeMinIso,
            end: input.timeMinIso,
            allDay: true,
          });
          return [];
        }
        const tJson = await tRes.json();
        return tJson.items ?? [];
      });

      const allTasksLists = await Promise.all(pLists);
      const allTasksItems = allTasksLists.flat();

      allTasksItems.forEach((t: { id: string; title?: string; due?: string; status?: string; links?: { link?: string }[] }) => {
        if (t.due) {
          const isCompleted = t.status === "completed";
          events.push({
            id: t.id,
            title: `🗓 ${t.title || "(Без назви)"}`,
            start: t.due, // e.g., "2023-10-12T00:00:00.000Z"
            end: t.due,
            allDay: true,
            htmlLink: t.links?.[0]?.link ?? "",
            completed: isCompleted,
          });
        }
      });
    } else {
      const errText = await listsRes.text();
      console.error(`Google Tasks API error (${listsRes.status}):`, errText);
      events.push({
        id: "err-task-lists",
        title: `[Error: Tasks Lists API ${listsRes.status}]`,
        start: input.timeMinIso,
        end: input.timeMinIso,
        allDay: true,
      });
    }
  } catch (e) {
    console.error("Failed to fetch Google Tasks:", e);
  }

  return { events, timeZone };
}

// ===============================
// CREATE EVENT
// ===============================

function toDateOnly(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function createCalendarEvent(input: {
  calendarId?: string;
  title: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startIso: string;
  endIso: string;
}) {
  const userId = await getUserIdOrThrow();
  const timeZone = await getUserTimezone(userId);

  const calendarId = input.calendarId ?? "primary";

  const start = new Date(input.startIso);
  const end = new Date(input.endIso);

  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
  };

  if (input.allDay) {
    const startDate = toDateOnly(start);
    const endPlus1 = new Date(start);
    endPlus1.setDate(endPlus1.getDate() + 1);

    body.start = { date: startDate };
    body.end = { date: toDateOnly(endPlus1) };
  } else {
    body.start = { dateTime: start.toISOString(), timeZone };
    body.end = { dateTime: end.toISOString(), timeZone };
  }

  const res = await googleFetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();

    if (res.status === 403) {
      throw new Error(
        "Немає прав на створення подій. Перелогінься через Google (потрібні scope calendar.readonly + calendar.events)."
      );
    }

    throw new Error(`Google Calendar API error: ${res.status} ${text}`);
  }

  const created = (await res.json()) as GoogleEvent;

  return {
    event: {
      id: created.id,
      title: created.summary ?? input.title,
      start: toIsoOrFallback(created.start, input.startIso),
      end: toIsoOrFallback(created.end, input.endIso),
      allDay: Boolean(created.start?.date && !created.start?.dateTime),
      htmlLink: created.htmlLink,
    } satisfies CalendarEvent,
  };
}

export async function updateCalendarEvent(input: {
  calendarId?: string;
  eventId: string;
  title: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startIso: string;
  endIso: string;
}) {
  const userId = await getUserIdOrThrow();
  const timeZone = await getUserTimezone(userId);
  const calendarId = input.calendarId ?? "primary";

  const start = new Date(input.startIso);
  const end = new Date(input.endIso);

  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
  };

  if (input.allDay) {
    const startDate = toDateOnly(start);
    const endPlus1 = new Date(start);
    endPlus1.setDate(endPlus1.getDate() + 1);

    body.start = { date: startDate };
    body.end = { date: toDateOnly(endPlus1) };
  } else {
    body.start = { dateTime: start.toISOString(), timeZone };
    body.end = { dateTime: end.toISOString(), timeZone };
  }

  const res = await googleFetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      throw new Error("Немає прав на редагування подій. Перелогінься через Google.");
    }
    throw new Error(`Google Calendar API error: ${res.status} ${text}`);
  }

  const updated = (await res.json()) as GoogleEvent;
  return { success: true, eventId: updated.id };
}

export async function deleteCalendarEvent(input: {
  calendarId?: string;
  eventId: string;
}) {
  const userId = await getUserIdOrThrow();
  const calendarId = input.calendarId ?? "primary";

  const res = await googleFetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 || res.status === 404) {
      return { success: false, error: `Не знайдено або немає прав (${res.status})` };
    }
    throw new Error(`Google Calendar API error: ${res.status} ${text}`);
  }

  return { success: true };
}
