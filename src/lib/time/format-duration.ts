export function formatDurationHM(totalSeconds: number | null | undefined) {
  const sec = Math.max(0, Math.floor(totalSeconds ?? 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);

  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// 👇 alias для існуючих імпортів у компонентах
export function formatDuration(totalSeconds: number | null | undefined) {
  return formatDurationHM(totalSeconds);
}
