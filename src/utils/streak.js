export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getStreakBonusXp(streak = 0) {
  if (streak >= 14) return 75
  if (streak >= 7) return 50
  if (streak >= 3) return 25
  return 0
}

export const STREAK_BREAK_PENALTY = 10

export function computeStreak(lastStudyDate, currentStreak = 0) {
  return computeStreakUpdate(lastStudyDate, currentStreak).streak
}

export function computeStreakUpdate(lastStudyDate, currentStreak = 0) {
  if (!lastStudyDate) {
    return { streak: 1, broke: false, bonusXp: 0, penaltyXp: 0 }
  }

  const today = new Date()
  const last = new Date(`${lastStudyDate}T00:00:00`)
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const streak = currentStreak || 1
    return { streak, broke: false, bonusXp: 0, penaltyXp: 0 }
  }

  if (diffDays === 1) {
    const streak = (currentStreak || 0) + 1
    return { streak, broke: false, bonusXp: getStreakBonusXp(streak), penaltyXp: 0 }
  }

  return { streak: 1, broke: true, bonusXp: 0, penaltyXp: STREAK_BREAK_PENALTY }
}
