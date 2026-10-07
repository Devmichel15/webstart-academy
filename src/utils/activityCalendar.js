const LUANDA_TIME_ZONE = "Africa/Luanda";
const SIX_MONTHS_IN_CALENDAR_MONTHS = 6;

function getDatePartsInLuanda(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LUANDA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value: part }) => [type, part]),
  );
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

export function getLuandaDayKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parts = getDatePartsInLuanda(value);
  if (!parts) return null;
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getDayNumber(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function getDayKeyFromNumber(dayNumber) {
  const date = new Date(dayNumber * 86400000);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getSixMonthStartKey(todayKey) {
  const [year, month, day] = todayKey.split("-").map(Number);
  const targetMonthIndex = year * 12 + month - 1 - SIX_MONTHS_IN_CALENDAR_MONTHS;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const lastTargetDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return [
    targetYear,
    String(targetMonth).padStart(2, "0"),
    String(Math.min(day, lastTargetDay)).padStart(2, "0"),
  ].join("-");
}

export function formatActivityMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-PT", {
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(".", "");
}

export function formatActivityDay(dayKey) {
  const [, month, day] = dayKey.split("-");
  return `${day}/${month}/${dayKey.slice(0, 4)}`;
}

export function buildSixMonthActivityGraph(data = [], now = new Date()) {
  const todayKey = getLuandaDayKey(now);
  if (!todayKey) return { weeks: [], monthLabels: [], startDay: null, todayKey: null };

  const startKey = getSixMonthStartKey(todayKey);
  const firstDayNumber = getDayNumber(startKey);
  const todayDayNumber = getDayNumber(todayKey);
  const gridStartNumber = firstDayNumber - new Date(firstDayNumber * 86400000).getUTCDay();
  const weekCount = Math.ceil((todayDayNumber - gridStartNumber + 1) / 7);
  const activityCounts = new Map();

  for (const record of data || []) {
    const dayKey = getLuandaDayKey(record?.day);
    if (!dayKey || dayKey < startKey || dayKey > todayKey) continue;
    activityCounts.set(
      dayKey,
      (activityCounts.get(dayKey) || 0) + (Number(record.count) || 0),
    );
  }

  const weeks = Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const dayNumber = gridStartNumber + weekIndex * 7 + weekday;
      if (dayNumber < firstDayNumber || dayNumber > todayDayNumber) return null;

      const dayKey = getDayKeyFromNumber(dayNumber);
      return {
        dayKey,
        count: activityCounts.get(dayKey) || 0,
        isToday: dayKey === todayKey,
      };
    }),
  );

  const monthLabels = [];
  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
    const week = weeks[weekIndex];
    const firstWeekDayIndex = week.findIndex(Boolean);
    const monthStart = week.find((cell) => cell?.dayKey.endsWith("-01"));
    if (monthStart) {
      const monthKey = monthStart.dayKey.slice(0, 7);
      monthLabels.push({
        weekIndex,
        monthKey,
        label: formatActivityMonth(monthKey),
      });
    } else if (weekIndex === 0 && firstWeekDayIndex >= 0) {
      const firstDay = week[firstWeekDayIndex];
      const monthKey = firstDay.dayKey.slice(0, 7);
      monthLabels.push({
        weekIndex,
        monthKey,
        label: formatActivityMonth(monthKey),
      });
    }
  }

  return { weeks, monthLabels, startDay: startKey, todayKey };
}

export function getActivityTotalForSixMonths(data = [], now = new Date()) {
  const todayKey = getLuandaDayKey(now);
  if (!todayKey) return 0;

  const startKey = getSixMonthStartKey(todayKey);
  return (data || []).reduce((total, record) => {
    const dayKey = getLuandaDayKey(record?.day);
    if (!dayKey || dayKey < startKey || dayKey > todayKey) return total;
    return total + (Number(record.count) || 0);
  }, 0);
}
