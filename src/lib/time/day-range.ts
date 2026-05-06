function _getZonedParts(date: Date, timeZone: string) {
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

function _minutesFromParts(p: { hour: number; minute: number }) {
  return p.hour * 60 + p.minute;
}

/**
 * Беремо "локальний" день YYYY-MM-DD у заданому timeZone
 * і повертаємо UTC start/end для запитів в БД.
 */
export function getUtcDayRange(dateISO: string, timeZone: string = "Europe/Kyiv") {
  const [y, m, d] = dateISO.split("-").map(Number);
  
  // 1. Створюємо дату в UTC, яка відповідає 00:00:00 цього дня в локальному часі
  // Ми використовуємо Intl для зворотного розрахунку
  const tz = timeZone || "Europe/Kyiv";
  
  // guess start: 00:00 UTC
  let start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  
  // Ітеративно підганяємо, щоб знайти момент UTC, коли в локальному часі 00:00
  for (let i = 0; i < 2; i++) {
    const local = new Date(start.toLocaleString("en-US", { timeZone: tz }));
    const desired = new Date(y, m - 1, d, 0, 0, 0);
    const diff = local.getTime() - desired.getTime();
    start = new Date(start.getTime() - diff);
  }

  // 2. Те саме для кінця дня (23:59:59.999)
  const end = new Date(start.getTime() + 24 * 3600 * 1000 - 1);
  
  return { start, end };
}
