export function getZonedParts(date: Date, timeZone: string) {
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

function findOffsetMs(utcMs: number, timeZone: string): number {
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

  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const localISO = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;

  const asUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );

  return asUTC - utcMs;
}

/**
 * Беремо "локальний" день YYYY-MM-DD у заданому timeZone
 * і повертаємо UTC start/end для запитів в БД.
 */
export function getUtcDayRange(dateISO: string, timeZone: string = "Europe/Kyiv") {
  const [y, m, d] = dateISO.split("-").map(Number);
  const tz = timeZone || "Europe/Kyiv";

  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const offset = findOffsetMs(noonUtc, tz);

  const start = new Date(noonUtc - offset - 12 * 3600 * 1000);
  const end = new Date(start.getTime() + 24 * 3600 * 1000 - 1);

  return { start, end };
}

function _todayISO(timeZone: string) {
  const p = getZonedParts(new Date(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function getUtcTodayRange(timeZone: string = "Europe/Kyiv") {
  const tz = timeZone || "Europe/Kyiv";
  return getUtcDayRange(_todayISO(tz), tz);
}

export function getUtcMonthRange(timeZone: string = "Europe/Kyiv") {
  const tz = timeZone || "Europe/Kyiv";
  const p = getZonedParts(new Date(), tz);
  const firstDayISO = `${p.year}-${String(p.month).padStart(2, "0")}-01`;
  return getUtcMonthRangeFromISO(firstDayISO, tz);
}

export function getUtcMonthRangeFromISO(firstDayISO: string, timeZone: string = "Europe/Kyiv") {
  const tz = timeZone || "Europe/Kyiv";
  const [y, m] = firstDayISO.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lastDayISO = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  return { start: getUtcDayRange(firstDayISO, tz).start, end: getUtcDayRange(lastDayISO, tz).end };
}

export function getUtcWeekRange(timeZone: string = "Europe/Kyiv") {
  const tz = timeZone || "Europe/Kyiv";
  const p = getZonedParts(new Date(), tz);
  const localDate = new Date(p.year, p.month - 1, p.day);
  const dow = localDate.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(p.year, p.month - 1, p.day + mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const fmtISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: getUtcDayRange(fmtISO(monday), tz).start, end: getUtcDayRange(fmtISO(sunday), tz).end };
}

export function getLocalDayOfWeek(utcDate: Date, timeZone: string): number {
  const p = getZonedParts(utcDate, timeZone);
  return new Date(p.year, p.month - 1, p.day).getDay();
}
