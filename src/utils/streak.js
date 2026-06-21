export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function computeStreak(lastStudyDate, currentStreak = 0) {
  if (!lastStudyDate) return 1

  const today = new Date()
  const last = new Date(`${lastStudyDate}T00:00:00`)
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return currentStreak || 1
  if (diffDays === 1) return (currentStreak || 0) + 1
  return 1
}
