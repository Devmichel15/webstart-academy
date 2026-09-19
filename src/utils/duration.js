const DURATION_RE = /^\d+(:\d+)*$/

// Converte a duração de uma aula para minutos inteiros.
// As durações das aulas vêm em "mm:ss" (ex: "2:25"), por vezes "hh:mm:ss",
// ou já em número de minutos. As colunas Postgres que as recebem
// (lesson_progress.time_spent, profiles.total_study_time) são integer.
export function durationToMinutes(duration, fallback = 0) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return Math.round(duration)
  }

  if (typeof duration !== 'string') return fallback

  const value = duration.trim()
  if (!value || !DURATION_RE.test(value)) return fallback

  const seconds = value
    .split(':')
    .map((part) => Number(part))
    .reduce((acc, part) => acc * 60 + part, 0)

  if (!Number.isFinite(seconds)) return fallback

  return Math.round(seconds / 60)
}
