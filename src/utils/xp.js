export const XP_LESSON = 50
export const XP_LAB = 50
export const XP_EXERCISE = 120
export const XP_PROJECT = 300
export const XP_MODULE = 200
export const XP_COURSE = 1000
export const XP_PER_LEVEL = 1000

export function getLevelFromXp(xp = 0) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function getXpForNextLevel(xp = 0) {
  const level = getLevelFromXp(xp)
  const currentLevelXp = (level - 1) * XP_PER_LEVEL
  const nextLevelXp = level * XP_PER_LEVEL

  return {
    level,
    current: xp - currentLevelXp,
    needed: nextLevelXp - currentLevelXp,
    percent: Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  }
}
