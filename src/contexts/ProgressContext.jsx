import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { allLessons } from '../data/courses.js'
import { useAuthContext } from './AuthContext.jsx'
import { getAchievementsWithStatus } from '../services/achievementService.js'
import {
  completeLesson as completeLessonService,
  getCourseProgressPercent,
  isLessonCompleted as isLessonCompletedService,
  subscribeToUserProgress,
  visitLesson as visitLessonService,
} from '../services/progressService.js'
import { subscribeToUser } from '../services/userService.js'
import { getLevelFromXp, XP_LESSON } from '../utils/xp.js'
import { useToast } from './ToastContext.jsx'

const ProgressContext = createContext(null)

const defaultProfile = {
  xp: 0,
  level: 1,
  streak: 0,
  completedLessons: [],
  completedCourses: [],
  currentLesson: null,
  currentCourse: null,
  totalStudyTime: 0,
  certificates: [],
  name: '',
  photoURL: '',
  email: '',
}

export function ProgressProvider({ children }) {
  const { user } = useAuthContext()
  const { showSuccess, showError } = useToast()
  const [profile, setProfile] = useState(defaultProfile)
  const [progressRecords, setProgressRecords] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile)
      setProgressRecords([])
      setAchievements([])
      setLoading(false)
      return undefined
    }

    setLoading(true)

    const unsubUser = subscribeToUser(
      user.uid,
      async (data) => {
        try {
          setProfile(data || defaultProfile)
          if (data) {
            const items = await getAchievementsWithStatus(user.uid, data)
            setAchievements(items)
          } else {
            setAchievements([])
          }
        } catch (err) {
          setError(err.message)
          setAchievements([])
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    const unsubProgress = subscribeToUserProgress(
      user.uid,
      setProgressRecords,
      (err) => setError(err.message),
    )

    return () => {
      unsubUser()
      unsubProgress()
    }
  }, [user])

  const completedLessons = profile.completedLessons || []
  const totalLessons = allLessons.length
  const completedCount = completedLessons.length
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0
  const level = profile.level || getLevelFromXp(profile.xp || 0)

  const remainingMinutes = allLessons
    .filter((lesson) => !completedLessons.includes(lesson.id))
    .reduce((sum, lesson) => sum + lesson.duration, 0)

  const recommendedLesson = allLessons.find((lesson) => !completedLessons.includes(lesson.id))

  const lastLesson = profile.currentLesson
    ? allLessons.find((lesson) => lesson.id === profile.currentLesson)
    : null

  const completeLesson = useCallback(async (lessonId) => {
    if (!user) return

    try {
      const result = await completeLessonService(user.uid, lessonId)
      if (result.alreadyCompleted) return

      showSuccess(`Aula concluída! +${result.xpEarned || XP_LESSON} XP`)
      if (result.courseComplete) {
        showSuccess('Curso concluído! +1000 XP e certificado desbloqueado!')
      }
    } catch (err) {
      showError(err.message || 'Erro ao salvar progresso.')
    }
  }, [user, showSuccess, showError])

  const visitLesson = useCallback(async (lessonId) => {
    if (!user) return
    const lesson = allLessons.find((item) => item.id === lessonId)
    if (!lesson) return

    try {
      await visitLessonService(user.uid, lesson)
    } catch (err) {
      showError(err.message || 'Erro ao registrar acesso à aula.')
    }
  }, [user, showError])

  const isLessonCompleted = useCallback(
    (lessonId) => isLessonCompletedService(completedLessons, lessonId),
    [completedLessons],
  )

  const getCourseProgress = useCallback(
    (courseId) => getCourseProgressPercent(completedLessons, courseId),
    [completedLessons],
  )

  const studyHours = Math.round(((profile.totalStudyTime || 0) / 60) * 10) / 10

  const value = useMemo(
    () => ({
      ...profile,
      xp: profile.xp || 0,
      streak: profile.streak || 0,
      level,
      totalLessons,
      completedCount,
      progressPercent,
      remainingMinutes,
      recommendedLesson,
      lastLesson,
      completedCourses: profile.completedCourses || [],
      certificates: profile.certificates || [],
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      achievements,
    }),
    [
      profile,
      level,
      totalLessons,
      completedCount,
      progressPercent,
      remainingMinutes,
      recommendedLesson,
      lastLesson,
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      achievements,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgressContext() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgressContext must be used within ProgressProvider')
  return context
}
