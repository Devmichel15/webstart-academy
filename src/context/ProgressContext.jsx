import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { achievements, getLevelFromXp } from '../data/achievements'
import { allLessons, courses } from '../data/courses'

const STORAGE_KEY = 'webstart-progress'

const defaultState = {
  completedLessons: [],
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  unlockedAchievements: [],
  lastLessonId: null,
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState
  } catch {
    return defaultState
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(lastStudyDate, currentStreak) {
  if (!lastStudyDate) return 1

  const today = new Date()
  const last = new Date(lastStudyDate)
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return currentStreak || 1
  if (diffDays === 1) return (currentStreak || 0) + 1
  return 1
}

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const totalLessons = allLessons.length
  const completedCount = state.completedLessons.length
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0
  const level = getLevelFromXp(state.xp)

  const remainingMinutes = allLessons
    .filter((lesson) => !state.completedLessons.includes(lesson.id))
    .reduce((sum, lesson) => sum + lesson.duration, 0)

  const recommendedLesson = allLessons.find((lesson) => !state.completedLessons.includes(lesson.id))

  const lastLesson = state.lastLessonId
    ? allLessons.find((lesson) => lesson.id === state.lastLessonId)
    : null

  const completeLesson = useCallback((lessonId) => {
    const lesson = allLessons.find((item) => item.id === lessonId)
    if (!lesson) return

    setState((current) => {
      if (current.completedLessons.includes(lessonId)) {
        return { ...current, lastLessonId: lessonId }
      }

      const today = getTodayKey()
      const streak = computeStreak(current.lastStudyDate, current.streak)
      const xp = current.xp + lesson.xp
      const completedLessons = [...current.completedLessons, lessonId]

      const unlockedAchievements = achievements
        .filter((achievement) => {
          if (current.unlockedAchievements.includes(achievement.id)) return false
          if (achievement.type === 'lessons') return completedLessons.length >= achievement.target
          if (achievement.type === 'xp') return xp >= achievement.target
          if (achievement.type === 'streak') return streak >= achievement.target
          if (achievement.type === 'course') {
            const course = courses.find((item) => item.id === achievement.courseId)
            if (!course) return false
            return course.lessons.every((item) => completedLessons.includes(item.id))
          }
          return false
        })
        .map((achievement) => achievement.id)

      return {
        ...current,
        completedLessons,
        xp,
        streak,
        lastStudyDate: today,
        lastLessonId: lessonId,
        unlockedAchievements: [...current.unlockedAchievements, ...unlockedAchievements],
      }
    })
  }, [])

  const isLessonCompleted = (lessonId) => state.completedLessons.includes(lessonId)

  const visitLesson = useCallback((lessonId) => {
    setState((current) => ({ ...current, lastLessonId: lessonId }))
  }, [])

  const getCourseProgress = (courseId) => {
    const course = courses.find((item) => item.id === courseId)
    if (!course) return 0
    const done = course.lessons.filter((lesson) => state.completedLessons.includes(lesson.id)).length
    return Math.round((done / course.lessons.length) * 100)
  }

  const value = useMemo(
    () => ({
      ...state,
      level,
      totalLessons,
      completedCount,
      progressPercent,
      remainingMinutes,
      recommendedLesson,
      lastLesson,
      completeLesson,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      achievements: achievements.map((achievement) => ({
        ...achievement,
        unlocked: state.unlockedAchievements.includes(achievement.id),
      })),
    }),
    [state, level, totalLessons, completedCount, progressPercent, remainingMinutes, recommendedLesson, lastLesson],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used within ProgressProvider')
  return context
}
