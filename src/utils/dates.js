/**
 * Datas: UMA única definição de "dia civil" em todo o produto.
 *
 * O que went wrong antes (bug #16): o produto tinha duas implementações de "hoje".
 *
 *   userService.getTodayKey()    -> new Date().toISOString().slice(0,10)   // UTC
 *   adminService.getStartOfDay() -> d.setHours(0,0,0,0)                   // local do browser
 *
 * Em Luanda (UTC+1, sem DST) o dia civil começa às 23:00 UTC do dia anterior.
 * Com essas duas implementações, "Novos hoje" no painel admin dependia do fuso
 * da máquina de quem administration o painel: um registo às 00:30 de Luanda
 * contava como ontem para um admin em UTC, e contava como hoje para um admin
 * em Luanda. O streak tinha o problema simétrico (contava o dia civil errado).
 *
 * Decisão (produto): o dia civil é sempre o de Africa/Luanda, independente do
 * fuso do browser. Todos os limites de dia passam por aqui.
 *
 * Nota sobre DST: Luanda é WAT (UTC+1) o ano inteiro, sem hora de Verão, por isso
 * `getStartOfLocalDay` é estável. O offset é calculado por `Intl` em vez de
 * assumido para que o helper não parta se um dia vier a ser usado noutro fuso.
 */

export const APP_TIME_ZONE = "Africa/Luanda";

/** Partes de data/hora de `date` tal como vistas em `timeZone`. */
function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const out = {};
  for (const part of parts) {
    if (part.type !== "literal") out[part.type] = part.value;
  }
  return out;
}

/**
 * Deslocamento do fuso, em ms, para o instante `date`: `local - utc`.
 * Africa/Luanda → 3600000 (UTC+1).
 */
function zoneOffsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asIfUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  // `date` pode ter ms; zonedParts não as inclui, por isso arredondamos o input.
  return asIfUtc - (date.getTime() - (date.getTime() % 1000));
}

/** O mesmo instante, deslocado para que `getUTC*` leia a hora civil local. */
function toZoned(date, timeZone) {
  return new Date(date.getTime() + zoneOffsetMs(date, timeZone));
}

/**
 * Chave do dia civil: "YYYY-MM-DD" no fuso do produto.
 *
 * Substitui o `toISOString().split("T")[0]` (UTC) de `getTodayKey`.
 */
export function getLocalDayKey(date = new Date(), timeZone = APP_TIME_ZONE) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Instante inicial do dia civil que contém `date`.
 * Em Africa/Luanda, `new Date()` às 00:30 locais dá 23:30Z do dia anterior:
 * o retorno é 23:00Z do dia anterior, e 23:30Z >= 23:00Z → conta como hoje.
 */
export function getStartOfLocalDay(date = new Date(), timeZone = APP_TIME_ZONE) {
  const zoned = toZoned(date, timeZone);
  const startAsUtc = Date.UTC(
    zoned.getUTCFullYear(),
    zoned.getUTCMonth(),
    zoned.getUTCDate(),
  );
  return new Date(startAsUtc - zoneOffsetMs(date, timeZone));
}

/** Instante inicial da semana civil (segunda-feira) que contém `date`. */
export function getStartOfLocalWeek(date = new Date(), timeZone = APP_TIME_ZONE) {
  const dayStart = getStartOfLocalDay(date, timeZone);
  const zoned = toZoned(dayStart, timeZone);
  const weekday = zoned.getUTCDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  return new Date(dayStart.getTime() - back * 86400000);
}

/** Instante inicial do mês civil que contém `date`. */
export function getStartOfLocalMonth(date = new Date(), timeZone = APP_TIME_ZONE) {
  const zoned = toZoned(date, timeZone);
  const startAsUtc = Date.UTC(zoned.getUTCFullYear(), zoned.getUTCMonth(), 1);
  return new Date(startAsUtc - zoneOffsetMs(date, timeZone));
}

/**
 * Distância em dias civis entre duas datas, contada em Africa/Luanda.
 * Usada pelo streak: "ontem" é o dia civil anterior, não `now - 24h` em UTC.
 */
export function daysBetweenCivilDays(from, to, timeZone = APP_TIME_ZONE) {
  const [fy, fm, fd] = getLocalDayKey(from, timeZone).split("-").map(Number);
  const [ty, tm, td] = getLocalDayKey(to, timeZone).split("-").map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000,
  );
}