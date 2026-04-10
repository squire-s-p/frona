"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { getUtcDayRange } from "@/lib/time/day-range";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/dashboard/calendar/actions";

const MIN_ENTRY_SECONDS = 60;

function now() {
  return new Date();
}

function secondsBetween(a: Date, b: Date) {
  const diffMs = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

function startOfDayUtc(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normalizeId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function validateNotInFuture(date: Date, label: string = "Час") {
  // Allow 1 minute buffer for clock skew
  const now = new Date();
  if (date.getTime() > now.getTime() + 60000) {
    throw new Error(`${label} не може бути у майбутньому`);
  }
}

async function requireUser() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, timezone: true },
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
        startAt: { gte: start, lt: end },
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

  return { activeTimer, entries, projects, tags, timezone: user.timezone };
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
const startWorkSchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
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

  // ✅ NEW: Try to merge with previous entry
  const previousEntry = await prisma.timeEntry.findFirst({
    where: { userId },
    orderBy: { endAt: 'desc' },
    take: 1,
  });

  const activeProjectId = active.mode === 'work' ? active.projectId : null;
  const activeTaskId = active.mode === 'work' ? active.taskId : null;
  const activeType = active.mode === 'break' ? 'break' : 'work';
  const canMerge = previousEntry &&
    previousEntry.endAt &&
    previousEntry.type === activeType &&
    previousEntry.projectId === activeProjectId &&
    previousEntry.taskId === activeTaskId &&
    // Gap between entries <= 60 seconds (1 minute tolerance)
    Math.abs(previousEntry.endAt.getTime() - active.startedAt.getTime()) <= 60000;

  if (canMerge && previousEntry.endAt) {
    // Merge: extend previous entry to new end time
    const newDuration = secondsBetween(previousEntry.startAt, endedAt);
    const mergedEntry = await prisma.timeEntry.update({
      where: { id: previousEntry.id },
      data: {
        endAt: endedAt,
        durationSec: newDuration,
      },
      include: { project: true, task: true }
    });
    await prisma.activeTimer.delete({ where: { userId } });

    // Sync merge to calendar
    if (activeType === "work" && mergedEntry.calendarEventId) {
      try {
        const title = mergedEntry.task?.title || mergedEntry.project?.name || "Робота";
        await updateCalendarEvent({
          eventId: mergedEntry.calendarEventId,
          title,
          allDay: false,
          startIso: mergedEntry.startAt.toISOString(),
          endIso: endedAt.toISOString(),
        });
      } catch (e) {
        console.error("Failed to sync merge to calendar:", e);
      }
    }

    return { created: false, merged: true, durationSec: newDuration };
  }

  // Create new entry
  const createdEntry = await prisma.timeEntry.create({
    data: {
      userId,
      type: activeType,
      projectId: activeProjectId,
      taskId: activeTaskId,
      note: active.note ?? null,
      startAt: active.startedAt,
      endAt: endedAt,
      durationSec,
    },
    include: { project: true, task: true }
  });

  await prisma.activeTimer.delete({ where: { userId } });

  // Sync to calendar
  if (activeType === "work") {
    try {
      const title = createdEntry.task?.title || createdEntry.project?.name || "Робота";
      const calRes = await createCalendarEvent({
        title,
        allDay: false,
        startIso: active.startedAt.toISOString(),
        endIso: endedAt.toISOString(),
      });
      if (calRes.event.id) {
        await prisma.timeEntry.update({
          where: { id: createdEntry.id },
          data: { calendarEventId: calRes.event.id }
        });
      }
    } catch (e) {
      console.error("Failed to sync to calendar:", e);
    }
  }

  return { created: true, durationSec };
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
  const taskId = projectId ? normalizeId(v.taskId) : null; // task без project не має сенсу
  const note = v.note?.trim() ? v.note.trim() : null;

  // якщо щось вже тече (work або break) — закриваємо в history/skip
  await finalizeActiveToEntry(user.id);

  // ✅ NEW: Check if we can resume previous entry
  const previousEntry = await prisma.timeEntry.findFirst({
    where: {
      userId: user.id,
      type: 'work',
    },
    orderBy: { endAt: 'desc' },
    take: 1,
  });

  const canResume = previousEntry &&
    previousEntry.endAt &&
    previousEntry.projectId === projectId &&
    previousEntry.taskId === taskId &&
    // Stopped recently (≤ 60 seconds ago)
    (now().getTime() - previousEntry.endAt.getTime()) <= 60000;

  if (canResume && previousEntry.endAt) {
    // Resume: convert previous entry back to active timer
    // Delete the entry and recreate as active timer starting from original start time
    await prisma.timeEntry.delete({ where: { id: previousEntry.id } });

    await prisma.activeTimer.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mode: 'work',
        projectId,
        taskId,
        note: note ?? previousEntry.note,
        startedAt: previousEntry.startAt, // Continue from original start!
      },
      update: {
        mode: 'work',
        projectId,
        taskId,
        note: note ?? previousEntry.note,
        startedAt: previousEntry.startAt,
      },
    });

    return { ok: true, resumed: true };
  }

  // Normal flow: create new timer
  await prisma.activeTimer.upsert({
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

  return { ok: true };
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
  return { ok: true, state: "none" as const };
}


async function punchThroughOverlaps(tx: any, userId: string, startAt: Date, endAt: Date) {
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
        } catch(e) {}
      }
    };

    if (eStart >= nStart && eEnd <= nEnd) {
      if (entry.calendarEventId) {
        try { await deleteCalendarEvent({ eventId: entry.calendarEventId }); } catch(e){}
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
          ...entry,
          id: undefined,
          calendarEventId: null, // Wipe it, it's a new DB entry
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
        } catch(e) {}
      }

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
  dateISO: z.string().min(10), // YYYY-MM-DD
  startISO: z.string().min(16), // YYYY-MM-DDTHH:mm
  endISO: z.string().min(16),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
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

  let createdEntryId: string | null = null;
  let syncStart: Date | null = null;
  let syncEnd: Date | null = null;
  let syncTitle: string = "Робота";

  await prisma.$transaction(async (tx) => {
    await punchThroughOverlaps(tx, user.id, startAt, endAt);

    const created = await tx.timeEntry.create({
      data: {
        userId: user.id,
        type: "work",
        projectId,
        taskId,
        note,
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

  return { ok: true };
}



/**
 * manual break: тепер теж пишемо у history (бо треба в списку), але cutoff < 60s
 */
const manualBreakSchema = z.object({
  startISO: z.string().min(16),
  endISO: z.string().min(16),
});

export async function createManualBreakEntry(input: z.infer<typeof manualBreakSchema>) {
  const user = await requireUser();
  const v = manualBreakSchema.parse(input);

  const startAt = parseLocalISOInTimeZoneToUtcDate(v.startISO, user.timezone);
  const endAt = parseLocalISOInTimeZoneToUtcDate(v.endISO, user.timezone);

  if (endAt <= startAt) throw new Error("End must be after start");

  const durationSec = secondsBetween(startAt, endAt);
  if (durationSec < MIN_ENTRY_SECONDS) return { ok: true, skipped: true };

  await prisma.$transaction(async (tx) => {
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

  return { ok: true };
}


/**
 * patch meta for active timer (work only)
 */
const patchActiveTimerSchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  startedAt: z.date().optional(), // New field
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

  await prisma.activeTimer.update({
    where: { userId: user.id },
    data: {
      projectId: nextProjectId,
      taskId: nextTaskId,
      note: nextNote,
      startedAt: v.startedAt,
    },
  });

  if (v.startedAt) {
    validateNotInFuture(v.startedAt, "Час початку");
  }

  return { ok: true };
}

/**
 * ✅ Update existing WORK entry (used by timeline resize)
 */
const updateWorkEntrySchema = z.object({
  entryId: z.string().min(1),
  startISO: z.string().min(16), // YYYY-MM-DDTHH:mm
  endISO: z.string().min(16),

  // optional meta patch: undefined => keep, null => clear
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function updateWorkEntry(input: z.infer<typeof updateWorkEntrySchema>) {
  const user = await requireUser();
  const v = updateWorkEntrySchema.parse(input);

  const entry = await prisma.timeEntry.findFirst({
    where: { id: v.entryId, userId: user.id },
    select: { id: true, type: true, projectId: true, taskId: true, note: true, calendarEventId: true },
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
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  
  if (entry?.calendarEventId) {
    try {
      await deleteCalendarEvent({ eventId: entry.calendarEventId });
    } catch(e) { console.error("Calendar sync delete failed:", e) }
  }

  await prisma.timeEntry.delete({
    where: {
      userId: user.id,
      id: entryId,
    },
  });
  return { ok: true };
}

export async function bulkDeleteTimeEntries(ids: string[]) {
  const user = await requireUser();
  if (!ids.length) return { ok: true };

  const entries = await prisma.timeEntry.findMany({ where: { id: { in: ids } } });
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

  return { ok: true };
}

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function bulkUpdateTimeEntries(input: z.infer<typeof bulkUpdateSchema>) {
  const user = await requireUser();
  const v = bulkUpdateSchema.parse(input);

  if (!v.ids.length) return { ok: true };

  const data: any = {};
  if (v.projectId !== undefined) data.projectId = v.projectId;
  if (v.taskId !== undefined) data.taskId = v.taskId;
  if (v.note !== undefined) data.note = v.note;

  await prisma.timeEntry.updateMany({
    where: {
      userId: user.id,
      id: { in: v.ids },
    },
    data,
  });

  return { ok: true };
}


export async function stopTimer(_timerId?: string) {
  return stopActive();
}

export async function startTimer(projectId?: string | null, taskId?: string | null) {
  await startWork({ projectId, taskId });
  return getActiveTimer();
}

export async function getRelevantTasks() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);
  const endOfTomorrow = new Date(startOfTomorrow);
  endOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

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

  const mapped = tasks.map(t => {
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

  // Sort by date: overdue first, then today, tomorrow, etc. 
  // Tasks without date at the very end.
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
export async function getWeeklySummary() {
  const user = await requireUser();
  const now = new Date();

  // Last 7 days in user's timezone (approximate by UTC days for the summary)
  const days: Array<{ dateISO: string; workSec: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const iso = d.toISOString().split("T")[0];
    days.push({ dateISO: iso, workSec: 0 });
  }

  const startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  startDate.setUTCHours(0, 0, 0, 0);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      type: "work",
      startAt: { gte: startDate },
    },
    select: {
      startAt: true,
      durationSec: true,
    },
  });

  for (const entry of entries) {
    const iso = entry.startAt.toISOString().split("T")[0];
    const day = days.find((d) => d.dateISO === iso);
    if (day) {
      day.workSec += entry.durationSec ?? 0;
    }
  }

  // Also include active timer if any
  const active = await prisma.activeTimer.findUnique({
    where: { userId: user.id },
  });

  if (active && active.mode === "work") {
    const iso = now.toISOString().split("T")[0];
    const day = days.find((d) => d.dateISO === iso);
    if (day) {
      day.workSec += secondsBetween(active.startedAt, now);
    }
  }

  return days;
}

