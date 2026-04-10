function getZonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function minutesFromParts(p: { hour: number; minute: number }) {
  return p.hour * 60 + p.minute;
}

/**
 * Беремо "локальний" день YYYY-MM-DD у заданому timeZone
 * і повертаємо UTC start/end для запитів в БД.
 */
export function getUtcDayRange(dateISO: string, timeZone: string) {
  // Початковий guess: UTC midnight цього дня
  let guess = new Date(`${dateISO}T00:00:00.000Z`);

  // Ітеративно “підганяємо” guess до локального 00:00 у timeZone
  for (let i = 0; i < 2; i++) {
    const parts = getZonedParts(guess, timeZone);
    const localMinutes = minutesFromParts(parts);
    const diffMinutes = localMinutes; // нам треба 00:00, тобто відняти поточні хвилини
    guess = new Date(guess.getTime() - diffMinutes * 60_000);
  }

  const start = guess;
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { start, end };
}
