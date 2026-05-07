export function formatDurationHM(totalSeconds: number | null | undefined) {
  const sec = Math.max(0, Math.floor(totalSeconds ?? 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);

  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDuration(totalSeconds: number | null | undefined) {
  return formatDurationHM(totalSeconds);
}

export function formatDurationUa(sec: number) {
  const safe = Math.max(0, Math.floor(sec));
  if (safe === 0) return "—";
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);

  if (h <= 0) return `${m} хв`;
  if (m <= 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatElapsed(startedAt: string | Date) {
  const startMs = new Date(startedAt).getTime();
  const diffMs = Date.now() - startMs;
  const total = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h,
    m,
    s,
    display: `${pad2(h)}:${pad2(m)}:${pad2(s)}`,
  };
}
