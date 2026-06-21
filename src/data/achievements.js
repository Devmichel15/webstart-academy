export const achievements = [
  {
    id: 'first-lesson',
    title: 'Primeiro Passo',
    description: 'Concluiu a primeira aula.',
    icon: 'sparkles',
    type: 'lessons',
    target: 1,
  },
  {
    id: 'html-hero',
    title: 'Herói HTML',
    description: 'Completou o curso de HTML5.',
    icon: 'code',
    type: 'course',
    courseId: 'html',
  },
  {
    id: 'css-master',
    title: 'Mestre CSS',
    description: 'Completou o curso de CSS3.',
    icon: 'palette',
    type: 'course',
    courseId: 'css',
  },
  {
    id: 'streak-3',
    title: 'Consistente',
    description: 'Estudou 3 dias seguidos.',
    icon: 'flame',
    type: 'streak',
    target: 3,
  },
  {
    id: 'xp-500',
    title: 'Explorador',
    description: 'Acumulou 500 XP.',
    icon: 'trophy',
    type: 'xp',
    target: 500,
  },
  {
    id: 'graduate',
    title: 'WebStart Graduate',
    description: 'Concluiu todos os módulos.',
    icon: 'award',
    type: 'lessons',
    target: 23,
  },
]

export function getLevelFromXp(xp) {
  return Math.floor(xp / 150) + 1
}

export function getXpForNextLevel(xp) {
  const level = getLevelFromXp(xp)
  const currentLevelXp = (level - 1) * 150
  const nextLevelXp = level * 150
  return {
    level,
    current: xp - currentLevelXp,
    needed: nextLevelXp - currentLevelXp,
    percent: Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  }
}
