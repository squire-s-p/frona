type CalculableEntry = {
  type: "work" | "break";
  startAt: Date;
  endAt: Date | null;
  durationSec?: number | null;
};

const GAP_THRESHOLD_SEC = 30 * 60;

export function calculateBreakAndWork(entries: CalculableEntry[]): {
  breakSec: number;
  workSec: number;
} {
  let workSec = 0;
  let breakSec = 0;

  for (const e of entries) {
    const d =
      typeof e.durationSec === "number"
        ? e.durationSec
        : e.endAt
          ? Math.max(0, Math.floor((e.endAt.getTime() - e.startAt.getTime()) / 1000))
          : 0;

    if (e.type === "work") {
      workSec += d;
    } else {
      breakSec += d;
    }
  }

  const sorted = [...entries]
    .filter((e) => e.type === "work" && e.endAt)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (!cur.endAt) continue;
    const gapSec = Math.floor(
      (next.startAt.getTime() - cur.endAt.getTime()) / 1000
    );
    if (gapSec > 0) {
      breakSec += gapSec;
    }
  }

  return { breakSec, workSec };
}
