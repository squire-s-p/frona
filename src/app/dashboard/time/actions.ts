"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { getUtcDayRange, getZonedParts } from "@/lib/time/day-range";
import { revalidatePath } from "next/cache";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/dashboard/calendar/actions";

const MIN_ENTRY_SECONDS = 60;
const MERGE_TOLERANCE_MS = 60_000;

function now() {
  return new Date();
}

function secondsBetween(a: Date, b: Date) {
  const diffMs = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

function normalizeId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function validateNotInFuture(date: Date, label: string = "Час") {
  if (date.getTime() > now().getTime() + MERGE_TOLERANCE_MS) {
    throw new Error(`${label} не може бути у майбутньому`);
  }
}

async function requireUser() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, timezone: true, dailyTargetHours: true },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * ✅ CRITICAL: parse a local ISO like "2026-01-22T14:05" as time in `timeZone`,
 * and convert it to a real UTC Date.
 *
 * Without this, Node will interpret the string in server timezone (often UTC),
 * causing "segment shifts" after refresh.
 */
function parseLocalISOInTimeZoneToUtcDate(localISO: string, timeZone: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localISO);
  if (!m) throw new Error("Invalid ISO (expected YYYY-MM-DDTHH:mm)");

  const year = Number(m[1]);
  const month = Number(m[2]); // 1-12
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  // initial guess: interpret components as UTC
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const partsToObj = (ms: number) => {
    const parts = dtf.formatToParts(new Date(ms));
    const out: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== "literal") out[p.type] = p.value;
    }
    return {
      y: Number(out.year),
      mo: Number(out.month),
      d: Number(out.day),
      h: Number(out.hour),
      mi: Number(out.minute),
      s: Number(out.second),
    };
  };

  const calcOffsetMs = (ms: number) => {
    const p = partsToObj(ms);
    const asUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
    return asUTC - ms;
  };

  // do it twice for DST boundaries stability: T = L - offset(T)
  let ms = utcGuessMs;
  for (let i = 0; i < 2; i++) {
    ms = utcGuessMs - calcOffsetMs(ms);
  }

  const result = new Date(ms);
  if (isNaN(result.getTime())) throw new Error("Invalid date");
  return result;
}

export async function getActiveTimer() {
  const user = await requireUser();
  const active = await prisma.activeTimer.findUnique({
    where: { userId: user.id },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });
  return active;
}

export async function getTimezone() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  if (!user) throw new Error("Unauthorized");
  return user.timezone || "Europe/Kyiv";
}

export async function getTimeDayData(dateISO: string) {

  const user = await requireUser();
  const { start, end } = getUtcDayRange(dateISO, user.timezone);

  const [activeTimer, entries, projects, tags] = await Promise.all([
    prisma.activeTimer.findUnique({
      where: { userId: user.id },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        OR: [
          { startAt: { gte: start, lt: end } },
          { endAt: { gt: start, lte: end }, startAt: { lt: start } },
        ],
      },
      orderBy: { startAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.project.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { activeTimer, entries, projects, tags, timezone: user.timezone, dailyTargetHours: user.dailyTargetHours };
}



export async function getTasksForProject(projectId: string) {
  const user = await requireUser();
  const pid = normalizeId(projectId);
  if (!pid) return [];

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, projectId: pid },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, status: true },
  });

  return tasks;
}

// ✅ no required fields
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MINUTE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const startWorkSchema = z.object({
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

/**
 * Закриває activeTimer у TimeEntry з cutoff < 60s
 * ✅ тепер break теж зберігаємо як TimeEntry (бо треба в списку),
 * але break НЕ показуємо на timeline (це вже на клієнті)
 * ✅ NEW: Merge logic - об'єднує з попереднім записом якщо той самий проєкт/задача і час стикається
 */
async function finalizeActiveToEntry(userId: string) {
  const active = await prisma.activeTimer.findUnique({ where: { userId } });
  if (!active) return null;

  const endedAt = now();
  const durationSec = secondsBetween(active.startedAt, endedAt);

  // ✅ cutoff: нічого < 60s не пишемо (і work, і break)
  if (durationSec < MIN_ENTRY_SECONDS) {
    await prisma.activeTimer.delete({ where: { userId } });
    return { created: false, reason: "too_short" as const, durationSec };
  }

  const activeProjectId = active.mode === 'work' ? active.projectId : null;
  const activeTaskId = active.mode === 'work' ? active.taskId : null;
  const activeType = active.mode === 'break' ? 'break' : 'work';

  // Use transaction to prevent concurrent finalization races
  const result = await prisma.$transaction(async (tx) => {
    // Re-read active timer inside transaction to get fresh state
    const fresh = await tx.activeTimer.findUnique({ where: { userId } });
    if (!fresh) return null;

    const freshDuration = secondsBetween(fresh.startedAt, endedAt);
    if (freshDuration < MIN_ENTRY_SECONDS) {
      await tx.activeTimer.delete({ where: { userId } });
      return { created: false, reason: "too_short" as const, durationSec: freshDuration };
    }

    const freshProjectId = fresh.mode === 'work' ? fresh.projectId : null;
    const freshTaskId = fresh.mode === 'work' ? fresh.taskId : null;
    const freshType = fresh.mode === 'break' ? 'break' : 'work';

    // Try to merge with previous entry
    const previousEntry = await tx.timeEntry.findFirst({
      where: { userId },
      orderBy: { endAt: 'desc' },
      take: 1,
    });

    const canMerge = previousEntry &&
      previousEntry.endAt &&
      previousEntry.type === freshType &&
      previousEntry.projectId === freshProjectId &&
      previousEntry.taskId === freshTaskId &&
      Math.abs(previousEntry.endAt.getTime() - fresh.startedAt.getTime()) <= MERGE_TOLERANCE_MS &&
      // Don't merge across day boundaries (same calendar day in UTC)
      previousEntry.startAt.toISOString().slice(0, 10) === fresh.startedAt.toISOString().slice(0, 10);

    if (canMerge && previousEntry.endAt) {
      const newDuration = secondsBetween(previousEntry.startAt, endedAt);
      const mergedEntry = await tx.timeEntry.update({
        where: { id: previousEntry.id },
        data: { endAt: endedAt, durationSec: newDuration },
        include: { project: true, task: true }
      });
      await tx.activeTimer.delete({ where: { userId } });
      return { created: false, merged: true, durationSec: newDuration, mergedEntry, freshType, fresh, endedAt };
    }

    // Create new entry
    const createdEntry = await tx.timeEntry.create({
      data: {
        userId,
        type: freshType,
        projectId: freshProjectId,
        taskId: freshTaskId,
        note: fresh.note ?? null,
        startAt: fresh.startedAt,
        endAt: endedAt,
        durationSec: freshDuration,
      },
      include: { project: true, task: true }
    });

    await tx.activeTimer.delete({ where: { userId } });
    return { created: true, durationSec: freshDuration, createdEntry, freshType, fresh, endedAt };
  });

  if (!result) return null;
  if (result.reason === "too_short") return { created: false, reason: "too_short", durationSec: result.durationSec };

  // Calendar sync outside transaction (external API)
  if (result.merged && result.mergedEntry?.calendarEventId) {
    try {
      const title = result.mergedEntry.task?.title || result.mergedEntry.project?.name || "Робота";
      await updateCalendarEvent({
        eventId: result.mergedEntry.calendarEventId,
        title,
        allDay: false,
        startIso: result.mergedEntry.startAt.toISOString(),
        endIso: result.endedAt.toISOString(),
      });
    } catch (e) { console.error("Failed to sync merge to calendar:", e); }
  }

  if (result.created && result.freshType === "work" && result.createdEntry) {
    try {
      const title = result.createdEntry.task?.title || result.createdEntry.project?.name || "Робота";
      const calRes = await createCalendarEvent({
        title,
        allDay: false,
        startIso: result.fresh.startedAt.toISOString(),
        endIso: result.endedAt.toISOString(),
      });
      if (calRes.event.id) {
        await prisma.timeEntry.update({
          where: { id: result.createdEntry.id },
          data: { calendarEventId: calRes.event.id }
        });
      }
    } catch (e) { console.error("Failed to sync to calendar:", e); }
  }

  return result.merged
    ? { created: false, merged: true, durationSec: result.durationSec }
    : { created: true, durationSec: result.durationSec };
}

/**
 * Start: завжди запускає WORK.
 * Якщо була активна перерва — вона закриється в history (cutoff < 60s).
 * ✅ NEW: Якщо попередній запис - той самий проєкт/задача і нещодавно закінчився (≤60s),
 * то продовжуємо його замість створення нового таймера
 */
export async function startWork(input: z.infer<typeof startWorkSchema> = {}) {
  const user = await requireUser();
  const v = startWorkSchema.parse(input);

  const projectId = normalizeId(v.projectId);
  const taskId = projectId ? normalizeId(v.taskId) : null;
  const note = v.note?.trim() ? v.note.trim() : null;

  const finalizeResult = await finalizeActiveToEntry(user.id);

  const result = await prisma.$transaction(async (tx) => {
    const previousEntry = await tx.timeEntry.findFirst({
      where: { userId: user.id, type: 'work' },
      orderBy: { endAt: 'desc' },
      take: 1,
    });

    const canResume = previousEntry &&
      previousEntry.endAt &&
      previousEntry.projectId === projectId &&
      previousEntry.taskId === taskId &&
      (now().getTime() - previousEntry.endAt.getTime()) <= MERGE_TOLERANCE_MS;

    if (canResume && previousEntry.endAt) {
      const previousStart = previousEntry.startAt;
      const previousNote = previousEntry.note;
      const previousCalEventId = previousEntry.calendarEventId;

      await tx.timeEntry.delete({ where: { id: previousEntry.id } });
      await tx.activeTimer.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          mode: 'work',
          projectId,
          taskId,
          note: note ?? previousNote,
          startedAt: previousStart,
        },
        update: {
          mode: 'work',
          projectId,
          taskId,
          note: note ?? previousNote,
          startedAt: previousStart,
        },
      });

      return { ok: true as const, resumed: true as const, calEventId: previousCalEventId };
    }

    await tx.activeTimer.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mode: "work",
        projectId,
        taskId,
        note,
        startedAt: now(),
      },
      update: {
        mode: "work",
        projectId,
        taskId,
        note,
        startedAt: now(),
      },
    });

    return { ok: true as const, resumed: false as const, calEventId: null };
  });

  if (result.resumed && result.calEventId) {
    try { await deleteCalendarEvent({ eventId: result.calEventId }); } catch {}
  }

  revalidatePath("/dashboard/time");
  return { ok: true, resumed: result.resumed, tooShort: finalizeResult?.reason === "too_short" ? finalizeResult.durationSec : undefined };
}

/**
 * ✅ STOP (toggle):
 * Просто закриваємо поточний активний таймер (якщо він є).
 * Більше не запускаємо BREAK як активний стан.
 */
export async function stopActive() {
  const user = await requireUser();

  const active = await prisma.activeTimer.findUnique({
    where: { userId: user.id },
  });
  if (!active) return { ok: true, state: "none" as const };

  await finalizeActiveToEntry(user.id);
  revalidatePath("/dashboard/time");
  return { ok: true, state: "none" as const };
}


async function punchThroughOverlaps(tx: Prisma.TransactionClient, userId: string, startAt: Date, endAt: Date) {
  const overlaps = await tx.timeEntry.findMany({
    where: {
      userId,
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
  });

  for (const entry of overlaps) {
    const eStart = entry.startAt.getTime();
    const eEnd = entry.endAt?.getTime() ?? eStart;

    const nStart = startAt.getTime();
    const nEnd = endAt.getTime();

    // Helper to sync update to cal
    const syncUpdateToCal = async (id: string, newStart: Date, newEnd: Date) => {
      const full = await tx.timeEntry.findUnique({ where: { id }, include: { project: true, task: true } });
      if (full?.calendarEventId) {
        try {
          const title = full.task?.title || full.project?.name || "Робота";
          await updateCalendarEvent({ eventId: full.calendarEventId, title, allDay: false, startIso: newStart.toISOString(), endIso: newEnd.toISOString() });
        } catch {}
      }
    };

    if (eStart >= nStart && eEnd <= nEnd) {
      if (entry.calendarEventId) {
        try { await deleteCalendarEvent({ eventId: entry.calendarEventId }); } catch{}
      }
      await tx.timeEntry.delete({ where: { id: entry.id } });
    } else if (eStart < nStart && eEnd > nEnd) {
      // Split
      await tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          endAt: startAt,
          durationSec: Math.max(0, Math.floor((startAt.getTime() - entry.startAt.getTime()) / 1000)),
        },
      });
      await syncUpdateToCal(entry.id, entry.startAt, startAt);

      const createdSplit = await tx.timeEntry.create({
        data: {
          userId: entry.userId,
          type: entry.type,
          projectId: entry.projectId,
          taskId: entry.taskId,
          note: entry.note,
          startAt: endAt,
          endAt: new Date(eEnd),
          durationSec: Math.max(0, Math.floor((eEnd - endAt.getTime()) / 1000)),
        },
        include: { project: true, task: true }
      });
      // create for the second half
      if (createdSplit.type === "work") {
        try {
          const t = createdSplit.task?.title || createdSplit.project?.name || "Робота";
          const res = await createCalendarEvent({ title: t, allDay: false, startIso: endAt.toISOString(), endIso: new Date(eEnd).toISOString() });
          if (res.event.id) {
            await tx.timeEntry.update({ where: { id: createdSplit.id }, data: { calendarEventId: res.event.id } });
          }
        } catch {}      }

    } else if (eStart < nStart) {
      await tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          endAt: startAt,
          durationSec: Math.max(0, Math.floor((startAt.getTime() - entry.startAt.getTime()) / 1000)),
        },
      });
      await syncUpdateToCal(entry.id, entry.startAt, startAt);
    } else {
      await tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          startAt: endAt,
          durationSec: Math.max(0, Math.floor((eEnd - endAt.getTime()) / 1000)),
        },
      });
      await syncUpdateToCal(entry.id, endAt, new Date(eEnd));
    }
  }
}

/**
 * manual work: no required fields
 */
const manualWorkSchema = z.object({
  dateISO: z.string().regex(ISO_DATE_RE, "Невірний формат дати"),
  startISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),
  endISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  billable: z.boolean().optional().default(true),
});

export async function createManualWorkEntry(input: z.infer<typeof manualWorkSchema>) {
  const user = await requireUser();
  const v = manualWorkSchema.parse(input);

  const startAt = parseLocalISOInTimeZoneToUtcDate(v.startISO, user.timezone);
  const endAt = parseLocalISOInTimeZoneToUtcDate(v.endISO, user.timezone);

  if (endAt <= startAt) throw new Error("End must be after start");

  const durationSec = secondsBetween(startAt, endAt);

  // ✅ cutoff для manual теж
  if (durationSec < MIN_ENTRY_SECONDS) return { ok: true, skipped: true };

  const projectId = normalizeId(v.projectId);
  const taskId = projectId ? normalizeId(v.taskId) : null;
  const note = v.note?.trim() ? v.note.trim() : null;
  const billable = v.billable ?? true;

  let createdEntryId: string | null = null;
  let syncStart: Date | null = null;
  let syncEnd: Date | null = null;
  let syncTitle: string = "Робота";

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await punchThroughOverlaps(tx, user.id, startAt, endAt);

    const created = await tx.timeEntry.create({
      data: {
        userId: user.id,
        type: "work",
        projectId,
        taskId,
        note,
        billable,
        startAt,
        endAt,
        durationSec,
      },
      include: { project: true, task: true }
    });
    
    createdEntryId = created.id;
    syncStart = startAt;
    syncEnd = endAt;
    syncTitle = created.task?.title || created.project?.name || "Робота";
  });

  // Sync to calendar outside the transaction
  if (createdEntryId && syncStart && syncEnd) {
    try {
      const calRes = await createCalendarEvent({
        title: syncTitle,
        allDay: false,
        startIso: (syncStart as Date).toISOString(),
        endIso: (syncEnd as Date).toISOString(),
      });
      if (calRes.event.id) {
        await prisma.timeEntry.update({
          where: { id: createdEntryId },
          data: { calendarEventId: calRes.event.id }
        });
      }
    } catch (e) {
      console.error("Failed to sync manual entry to calendar:", e);
    }
  }

  revalidatePath("/dashboard/time");
  return { ok: true };
}



/**
 * manual break: тепер теж пишемо у history (бо треба в списку), але cutoff < 60s
 */
const manualBreakSchema = z.object({
  dateISO: z.string().regex(ISO_DATE_RE, "Невірний формат дати"),
  startISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),
  endISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),
});

export async function createManualBreakEntry(input: z.infer<typeof manualBreakSchema>) {
  const user = await requireUser();
  const v = manualBreakSchema.parse(input);

  const startAt = parseLocalISOInTimeZoneToUtcDate(v.startISO, user.timezone);
  const endAt = parseLocalISOInTimeZoneToUtcDate(v.endISO, user.timezone);

  if (endAt <= startAt) throw new Error("End must be after start");

  const durationSec = secondsBetween(startAt, endAt);
  if (durationSec < MIN_ENTRY_SECONDS) return { ok: true, skipped: true };

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await punchThroughOverlaps(tx, user.id, startAt, endAt);

    await tx.timeEntry.create({
      data: {
        userId: user.id,
        type: "break",
        projectId: null,
        taskId: null,
        note: null,
        startAt,
        endAt,
        durationSec,
      },
    });
  });

  revalidatePath("/dashboard/time");
  return { ok: true };
}


/**
 * patch meta for active timer (work only)
 */
const patchActiveTimerSchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  startedAt: z.coerce.date().optional(),
});

export async function patchActiveTimer(input: z.infer<typeof patchActiveTimerSchema>) {
  const user = await requireUser();
  const v = patchActiveTimerSchema.parse(input);

  const active = await prisma.activeTimer.findUnique({ where: { userId: user.id } });
  if (!active) return { ok: false, reason: "no_active" as const };

  // редагуємо метадані тільки для work (для break вони не потрібні)
  if (active.mode !== "work") return { ok: true, skipped: true as const };

  const nextProjectId = v.projectId === undefined ? active.projectId : normalizeId(v.projectId);

  let nextTaskId: string | null;
  if (nextProjectId == null) {
    nextTaskId = null;
  } else {
    const rawTask = v.taskId === undefined ? active.taskId : normalizeId(v.taskId);
    nextTaskId = rawTask;
  }

  const nextNote =
    v.note === undefined ? active.note : v.note?.trim() ? v.note.trim() : null;

  // validate task belongs to project (if mismatch -> drop task)
  if (nextTaskId && nextProjectId) {
    const ok = await prisma.task.findFirst({
      where: { id: nextTaskId, userId: user.id, projectId: nextProjectId },
      select: { id: true },
    });
    if (!ok) nextTaskId = null;
  } else {
    nextTaskId = null;
  }

  if (v.startedAt) {
    validateNotInFuture(v.startedAt, "Час початку");
  }

  await prisma.activeTimer.update({
    where: { userId: user.id },
    data: {
      projectId: nextProjectId,
      taskId: nextTaskId,
      note: nextNote,
      startedAt: v.startedAt,
    },
  });

  return { ok: true };
}

/**
 * ✅ Update existing WORK entry (used by timeline resize)
 */
const updateWorkEntrySchema = z.object({
  entryId: z.string().min(1),
  startISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),
  endISO: z.string().regex(ISO_MINUTE_RE, "Невірний формат часу"),

  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  billable: z.boolean().optional(),
});

export async function updateWorkEntry(input: z.infer<typeof updateWorkEntrySchema>) {
  const user = await requireUser();
  const v = updateWorkEntrySchema.parse(input);

  const entry = await prisma.timeEntry.findFirst({
    where: { id: v.entryId, userId: user.id },
    select: { id: true, type: true, projectId: true, taskId: true, note: true, billable: true, calendarEventId: true },
  });
  if (!entry) throw new Error("Not found");
  if (entry.type !== "work") throw new Error("Only work entries can be updated");

  const startAt = parseLocalISOInTimeZoneToUtcDate(v.startISO, user.timezone);
  const endAt = parseLocalISOInTimeZoneToUtcDate(v.endISO, user.timezone);

  validateNotInFuture(startAt, "Час початку");
  validateNotInFuture(endAt, "Час закінчення");

  if (endAt <= startAt) throw new Error("End must be after start");

  const durationSec = secondsBetween(startAt, endAt);

  // ✅ keep consistent cutoff (delete if too short)
  if (durationSec < MIN_ENTRY_SECONDS) {
    if (entry.calendarEventId) {
      try { await deleteCalendarEvent({ eventId: entry.calendarEventId }); } 
      catch {}
    }
    await prisma.timeEntry.delete({ where: { id: entry.id } });
    return { ok: true, deleted: true as const };
  }

  const nextProjectId =
    v.projectId === undefined ? entry.projectId : normalizeId(v.projectId);

  let nextTaskId: string | null;
  if (nextProjectId == null) {
    nextTaskId = null;
  } else {
    const rawTask = v.taskId === undefined ? entry.taskId : normalizeId(v.taskId);
    nextTaskId = rawTask;
  }

  const nextNote =
    v.note === undefined ? entry.note : v.note?.trim() ? v.note.trim() : null;

  const nextBillable = v.billable === undefined ? entry.billable : v.billable;

  // validate task belongs to project
  if (nextTaskId && nextProjectId) {
    const ok = await prisma.task.findFirst({
      where: { id: nextTaskId, userId: user.id, projectId: nextProjectId },
      select: { id: true },
    });
    if (!ok) nextTaskId = null;
  } else {
    nextTaskId = null;
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: {
      startAt,
      endAt,
      durationSec,
      projectId: nextProjectId,
      taskId: nextTaskId,
      note: nextNote,
      billable: nextBillable,
    },
    include: { project: true, task: true }
  });

  if (entry.calendarEventId) {
    try {
      const title = updated.task?.title || updated.project?.name || "Робота";
      await updateCalendarEvent({
        eventId: entry.calendarEventId,
        title,
        allDay: false,
        startIso: startAt.toISOString(),
        endIso: endAt.toISOString(),
      });
    } catch (e) {
      console.error("Calendar sync update failed:", e);
    }
  }

  return { ok: true };
}

export async function deleteTimeEntry(entryId: string) {
  const user = await requireUser();
  const entry = await prisma.timeEntry.findFirst({ where: { id: entryId, userId: user.id } });
  if (!entry) return { ok: false, error: "Запис не знайдено" };
  
  if (entry.calendarEventId) {
    try {
      await deleteCalendarEvent({ eventId: entry.calendarEventId });
    } catch(e) { console.error("Calendar sync delete failed:", e) }
  }

  await prisma.timeEntry.delete({
    where: { id: entryId },
  });
  
  revalidatePath("/dashboard/time");
  return { ok: true };
}

export async function bulkDeleteTimeEntries(ids: string[]) {
  const user = await requireUser();
  if (!ids.length) return { ok: true };

  const entries = await prisma.timeEntry.findMany({ where: { id: { in: ids }, userId: user.id } });
  for (const entry of entries) {
    if (entry.calendarEventId) {
      try { await deleteCalendarEvent({ eventId: entry.calendarEventId }); } 
      catch {}
    }
  }

  await prisma.timeEntry.deleteMany({
    where: {
      userId: user.id,
      id: { in: ids },
    },
  });

  revalidatePath("/dashboard/time");
  return { ok: true };
}

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  projectId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function bulkUpdateTimeEntries(input: z.infer<typeof bulkUpdateSchema>) {
  const user = await requireUser();
  const v = bulkUpdateSchema.parse(input);

  if (!v.ids.length) return { ok: true };

  const projectId = normalizeId(v.projectId);
  let taskId = projectId ? normalizeId(v.taskId) : null;

  // Validate task belongs to project
  if (taskId && projectId) {
    const ok = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id, projectId },
      select: { id: true },
    });
    if (!ok) taskId = null;
  } else {
    taskId = null;
  }

  const data: { projectId?: string | null; taskId?: string | null; note?: string | null } = {};
  if (v.projectId !== undefined) data.projectId = projectId;
  if (v.taskId !== undefined) data.taskId = taskId;
  if (v.note !== undefined) data.note = v.note?.trim() || null;

  await prisma.timeEntry.updateMany({
    where: {
      userId: user.id,
      id: { in: v.ids },
    },
    data,
  });

  revalidatePath("/dashboard/time");
  return { ok: true };
}


export async function getRelevantTasks() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const tz = user?.timezone || "Europe/Kyiv";

  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now());
  const { start: startOfToday } = getUtcDayRange(todayISO, tz);
  const tomorrowDate = new Date(startOfToday);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const startOfTomorrow = tomorrowDate;
  const dayAfterTomorrow = new Date(startOfTomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const endOfTomorrow = dayAfterTomorrow;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["todo", "doing"] },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { status: "asc" }, // todo -> doing
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: 30,
  });

  const mapped = tasks.map((t) => {
    const taskDate = t.startAt || t.dueAt;
    let group: "overdue" | "today" | "tomorrow" | "later" | "no-date" = "no-date";
    if (taskDate) {
      if (taskDate.getTime() < startOfToday.getTime()) group = "overdue";
      else if (taskDate.getTime() < startOfTomorrow.getTime()) group = "today";
      else if (taskDate.getTime() < endOfTomorrow.getTime()) group = "tomorrow";
      else group = "later";
    }

    return {
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      projectName: t.project?.name ?? null,
      group,
      dueAt: taskDate,
      priority: t.priority,
    };
  });

  return mapped.sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
}

/**
 * Returns work seconds for each of the last 7 days (including today)
 */
export async function getWeeklySummary(targetDateISO?: string) {
  const user = await requireUser();
  const tz = user.timezone || "Europe/Kyiv";

  const todayParts = getZonedParts(now(), tz);
  const todayISO = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;
  const anchorISO = targetDateISO || todayISO;

  const [anchorY, anchorM, anchorD] = anchorISO.split("-").map(Number);

  const dayBuckets: Array<{ dateISO: string; start: Date; end: Date; workSec: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchorY, anchorM - 1, anchorD - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { start, end } = getUtcDayRange(iso, tz);
    dayBuckets.push({ dateISO: iso, start, end, workSec: 0 });
  }

  const overallStart = dayBuckets[0].start;

  const [entries, active] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        type: "work",
        startAt: { gte: overallStart },
      },
      select: {
        startAt: true,
        durationSec: true,
      },
    }),
    prisma.activeTimer.findUnique({
      where: { userId: user.id },
    })
  ]);

  for (const entry of entries) {
    const t = entry.startAt.getTime();
    for (const b of dayBuckets) {
      if (t >= b.start.getTime() && t < b.end.getTime()) {
        b.workSec += entry.durationSec ?? 0;
        break;
      }
    }
  }

  // Also include active timer if any
  if (active && active.mode === "work") {
    const t = active.startedAt.getTime();
    const currentNow = now();
    for (const b of dayBuckets) {
      if (t >= b.start.getTime() && t < b.end.getTime()) {
        b.workSec += secondsBetween(active.startedAt, currentNow);
        break;
      }
    }
  }

  return dayBuckets.map(b => ({ dateISO: b.dateISO, workSec: b.workSec }));
}

export async function updateDailyTarget(hours: number) {
  const user = await requireUser();
  const clamped = Math.max(1, Math.min(24, Math.floor(hours)));
  await prisma.user.update({
    where: { id: user.id },
    data: { dailyTargetHours: clamped },
  });
  revalidatePath("/dashboard/time");
  return { ok: true, dailyTargetHours: clamped };
}

export async function exportTimeCSV(dateISO: string, fromISO?: string, toISO?: string) {
  const user = await requireUser();
  const tz = user.timezone || "Europe/Kyiv";

  let start: Date;
  let end: Date;

  if (fromISO && toISO) {
    const fromDate = new Date(`${fromISO}T12:00:00Z`);
    const toDate = new Date(`${toISO}T12:00:00Z`);
    const s = getUtcDayRange(new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(fromDate), tz);
    const e = getUtcDayRange(new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(toDate), tz);
    start = s.start;
    end = e.end;

    if (end.getTime() - start.getTime() > 90 * 24 * 3600 * 1000) {
      throw new Error("Діапазон не може перевищувати 90 днів");
    }
  } else {
    const range = getUtcDayRange(dateISO, tz);
    start = range.start;
    end = range.end;
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: "asc" },
    take: 5000,
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  const fmtDate = (d: Date) => {
    const p = getZonedParts(d, tz);
    const dd = String(p.day).padStart(2, "0");
    const mm = String(p.month).padStart(2, "0");
    const yyyy = p.year;
    const hh = String(p.hour).padStart(2, "0");
    const mi = String(p.minute).padStart(2, "0");
    return `${dd}.${yyyy} ${hh}:${mi}`;
  };

  const fmtDateHeader = (d: Date) => {
    const p = getZonedParts(d, tz);
    const dd = String(p.day).padStart(2, "0");
    const mm = String(p.month).padStart(2, "0");
    const yyyy = p.year;
    return `${dd}.${yyyy}`;
  };

  const typeLabel = (t: string) => t === "work" ? "Робота" : "Перерва";

  const header = "Дата,Проєкт,Задача,Тип,Початок,Кінець,Тривалість (хв),Примітка";
  const rows = entries.map((e) => {
    const durMin = e.durationSec ? (e.durationSec / 60).toFixed(1).replace(".", ",") : "0";
    const project = e.project?.name ?? "";
    const task = e.task?.title ?? "";
    const startStr = fmtDate(e.startAt);
    const endStr = e.endAt ? fmtDate(e.endAt) : "";
    const note = e.note ?? "";
    return `${fmtDateHeader(e.startAt)},"${project}","${task}",${typeLabel(e.type)},${startStr},${endStr},${durMin},"${note}"`;
  });

  return [header, ...rows].join("\n");
}

export async function getWeekViewData(targetDateISO?: string) {
  const user = await requireUser();
  const tz = user.timezone || "Europe/Kyiv";

  const todayParts = getZonedParts(now(), tz);
  const todayISO = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;
  const anchorISO = targetDateISO || todayISO;

  const [anchorY, anchorM, anchorD] = anchorISO.split("-").map(Number);

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const dayBuckets: Array<{
    dateISO: string;
    dayName: string;
    start: Date;
    end: Date;
    workSec: number;
    breakSec: number;
    projects: Record<string, number>;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchorY, anchorM - 1, anchorD - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { start, end } = getUtcDayRange(iso, tz);
    const dayOfWeek = (d.getDay() + 6) % 7;
    dayBuckets.push({
      dateISO: iso,
      dayName: dayNames[dayOfWeek],
      start,
      end,
      workSec: 0,
      breakSec: 0,
      projects: {},
    });
  }

  const overallStart = dayBuckets[0].start;

  const [entries, active] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        startAt: { gte: overallStart },
      },
      select: {
        startAt: true,
        durationSec: true,
        type: true,
        projectId: true,
        project: { select: { name: true } },
      },
    }),
    prisma.activeTimer.findUnique({
      where: { userId: user.id },
    }),
  ]);

  for (const entry of entries) {
    const t = entry.startAt.getTime();
    for (const b of dayBuckets) {
      if (t >= b.start.getTime() && t < b.end.getTime()) {
        const sec = entry.durationSec ?? 0;
        if (entry.type === "work") {
          b.workSec += sec;
          const pName = entry.project?.name ?? "Без проєкту";
          b.projects[pName] = (b.projects[pName] ?? 0) + sec;
        } else {
          b.breakSec += sec;
        }
        break;
      }
    }
  }

  if (active && active.mode === "work") {
    const t = active.startedAt.getTime();
    const currentNow = now();
    for (const b of dayBuckets) {
      if (t >= b.start.getTime() && t < b.end.getTime()) {
        b.workSec += secondsBetween(active.startedAt, currentNow);
        break;
      }
    }
  }

  return dayBuckets.map(b => ({
    dateISO: b.dateISO,
    dayName: b.dayName,
    workSec: b.workSec,
    breakSec: b.breakSec,
    projects: b.projects,
  }));
}

