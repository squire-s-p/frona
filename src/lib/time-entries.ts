type Entry = { startAt: Date; endAt: Date | null };

export type TimeBucket = {
  date: string; // YYYY-MM-DD
  minutes: number;
};

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bucketsFromEntries(entries: Entry[], days: number): TimeBucket[] {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const map = new Map<string, number>();

  // ініціалізуємо всі дні нулями, щоб графік був рівний
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(toYMD(d), 0);
  }

  for (const e of entries) {
    const s = new Date(e.startAt);
    const end = e.endAt ? new Date(e.endAt) : new Date(); // якщо таймер активний

    // відсікаємо повністю “поза періодом”
    if (end < start) continue;

    // clamp start/end до меж періоду
    const sClamped = s < start ? new Date(start) : s;
    const endClamped = end;

    // розбиваємо по днях
    let cur = new Date(sClamped);
    while (cur < endClamped) {
      const dayStart = new Date(cur);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const sliceStart = cur;
      const sliceEnd = endClamped < dayEnd ? endClamped : dayEnd;

      const minutes = Math.max(0, Math.round((sliceEnd.getTime() - sliceStart.getTime()) / 60000));
      const key = toYMD(dayStart);

      if (map.has(key)) map.set(key, (map.get(key) || 0) + minutes);

      cur = sliceEnd;
    }
  }

  return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }));
}
