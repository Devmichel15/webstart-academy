import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { trails } from '../data/trails.js'
import { useAuthContext } from './AuthContext.jsx'
import {
  completeLesson as completeLessonService,
  completeExercise as completeExerciseService,
  completeProject as completeProjectService,
  completeQuiz as completeQuizService,
  getCourseProgressPercent,
  isLessonCompleted as isLessonCompletedService,
  subscribeToUserProgress,
  visitLesson as visitLessonService,
} from '../services/progressService.js'
import { subscribeToUser, ensureUsername } from '../services/userService.js'
import {
  computeTrailStatus,
  getAccessibleTrails,
  getJourneyProgress,
  getRecommendedTrail,
} from '../services/trailProgressService.js'
import { getLevelFromXp, XP_LESSON } from '../utils/xp.js'
import {
  calculateTrailCompletionRate,
  calculateAverageStartedTrailProgress,
  getStartedTrailsCount,
} from '../utils/progressMetrics.js'
import { useToast } from './ToastContext.jsx'
import {
  getLegacyUidFromAuth,
  isLegacyReadEnabled,
  mergeCompletions,
  readLegacyCompletions,
} from '../lib/data/legacyMerge.js'

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
  name: '',
  photoURL: '',
  email: '',
}

export function ProgressProvider({ children }) {
  const { user } = useAuthContext()
  const { showSuccess, showError } = useToast()
  const [profile, setProfile] = useState(defaultProfile)
  const [progressRecords, setProgressRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [legacyCompletions, setLegacyCompletions] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile)
      setProgressRecords([])
      setLoading(false)
      return undefined
    }

    setLoading(true)

    const unsubUser = subscribeToUser(
      user.id,
      async (data) => {
        try {
          if (data && !data.username) {
            ensureUsername(user.id).catch((err) =>
              console.error('[ProgressContext] ensureUsername error:', err),
            )
          }
          setProfile(data || defaultProfile)
        } catch (err) {
          setError(err.message)
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
      user.id,
      setProgressRecords,
      (err) => setError(err.message),
    )

    return () => {
      unsubUser()
      unsubProgress()
    }
  }, [user])

  useEffect(() => {
    if (!user || !isLegacyReadEnabled()) return undefined

    const legacyUid = getLegacyUidFromAuth(user)
    if (!legacyUid) return undefined

    let cancelled = false
    readLegacyCompletions(legacyUid)
      .then((data) => {
        if (!cancelled && data) setLegacyCompletions({ forUid: user.id, completions: data })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [user])

  const effectiveLegacy = user && legacyCompletions?.forUid === user.id ? legacyCompletions.completions : null
  const mergedCompletions = mergeCompletions(
    {
      completedLessons: profile.completedLessons || [],
      completedCourses: profile.completedCourses || [],
      completedQuizzes: profile.completedQuizzes || [],
    },
    effectiveLegacy,
  )
  const completedLessons = mergedCompletions.completedLessons
  const completedCourses = mergedCompletions.completedCourses
  const completedQuizzes = mergedCompletions.completedQuizzes
  const allCombinedLessons = [...allLessons, ...allVideoLessons]
  const accessibleIds = new Set(getAccessibleTrails().map((t) => t.id))
  const accessibleLessons = allCombinedLessons.filter((l) => accessibleIds.has(l.courseId))
  const totalLessons = accessibleLessons.length
  const completedCount = accessibleLessons.filter((l) => completedLessons.includes(l.id)).length
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0
  const level = profile.level || getLevelFromXp(profile.xp || 0)

  const remainingMinutes = accessibleLessons
    .filter((lesson) => !completedLessons.includes(lesson.id))
    .reduce((sum, lesson) => sum + (lesson.duration || 0), 0)

  const recommendedLesson = accessibleLessons.find((lesson) => !completedLessons.includes(lesson.id))

  const lastLesson = profile.currentLesson
    ? allCombinedLessons.find((lesson) => lesson.id === profile.currentLesson)
    : null

  const completeLesson = useCallback(async (lessonId) => {
    if (!user) return null

    try {
      const result = await completeLessonService(user.id, lessonId)
      if (result.alreadyCompleted) return result

      showSuccess(`Aula concluída! +${result.xpEarned || XP_LESSON} XP`)
      if (result.streakResult?.bonusXp) {
        showSuccess(`Bónus de streak! +${result.streakResult.bonusXp} XP`)
      }
      if (result.streakResult?.broke) {
        showError(`Streak reiniciado. -${result.streakResult.penaltyXp} XP`)
      }
      if (result.moduleComplete) {
        showSuccess('Módulo concluído! +200 XP de bónus')
      }
      if (result.courseComplete) {
        showSuccess('Curso concluído! +1000 XP de bónus!')
      }
      return result
    } catch (err) {
      console.error('[completeLesson error]', err.code, err.message, err)
      showError(err.message || 'Erro ao salvar progresso.')
      return null
    }
  }, [user, showSuccess, showError])

  const completeExercise = useCallback(async (exerciseTitle) => {
    if (!user) return null
    try {
      const result = await completeExerciseService(user.id, exerciseTitle)
      showSuccess(`Exercício concluído! +${result.xpEarned} XP`)
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar exercício.')
      return null
    }
  }, [user, showSuccess, showError])

  const completeProject = useCallback(async (projectTitle) => {
    if (!user) return null
    try {
      const result = await completeProjectService(user.id, projectTitle)
      showSuccess(`Projeto concluído! +${result.xpEarned} XP`)
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar projeto.')
      return null
    }
  }, [user, showSuccess, showError])

  const completeQuiz = useCallback(async (moduleId, score, totalQuestions) => {
    if (!user) return null
    try {
      const result = await completeQuizService(user.id, moduleId, score, totalQuestions)
      showSuccess('Quiz concluído!')
      if (result.moduleComplete) {
        showSuccess('Módulo concluído! +200 XP de bónus')
      }
      if (result.courseComplete) {
        showSuccess('Curso concluído! +1000 XP de bónus!')
      }
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar quiz.')
      return null
    }
  }, [user, showSuccess, showError])

  const visitLesson = useCallback(async (lessonId) => {
    if (!user) return
    const lesson = allCombinedLessons.find((item) => item.id === lessonId)
    if (!lesson) return

    try {
      await visitLessonService(user.id, lesson)
    } catch (err) {
      showError(err.message || 'Erro ao registrar acesso à aula.')
    }
  }, [user, showError])

  const isLessonCompleted = useCallback(
    (lessonId) => isLessonCompletedService(completedLessons, lessonId),
    [completedLessons],
  )

  const getCourseProgress = useCallback(
    (courseId) => getCourseProgressPercent(completedLessons, completedQuizzes, courseId),
    [completedLessons, completedQuizzes],
  )

  const studyHours = Math.round(((profile.totalStudyTime || 0) / 60) * 10) / 10

  const journeyProgress = useMemo(
    () => getJourneyProgress(completedCourses, completedLessons, completedQuizzes),
    [completedCourses, completedLessons, completedQuizzes],
  )

  const trailCompletionRate = useMemo(
    () => calculateTrailCompletionRate(completedCourses),
    [completedCourses],
  )

  const averageStartedTrailProgress = useMemo(
    () => calculateAverageStartedTrailProgress(completedLessons, completedQuizzes),
    [completedLessons, completedQuizzes],
  )

  const startedTrailsCount = useMemo(
    () => getStartedTrailsCount(completedLessons, completedQuizzes),
    [completedLessons, completedQuizzes],
  )

  const trailStatuses = useMemo(() => {
    const map = {}
    for (const trail of trails) {
      map[trail.id] = computeTrailStatus(trail.id, completedLessons, completedCourses, completedQuizzes)
    }
    return map
  }, [completedLessons, completedCourses, completedQuizzes])

  const getTrailStatus = useCallback(
    (trailId) => trailStatuses[trailId] || 'available',
    [trailStatuses],
  )

  const recommendedTrail = useMemo(
    () => getRecommendedTrail(completedCourses, completedLessons),
    [completedCourses, completedLessons],
  )

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
      completedCourses,
      completedQuizzes,
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      completeExercise,
      completeProject,
      completeQuiz,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      journeyProgress,
      getTrailStatus,
      recommendedTrail,
      trails,
      trailCompletionRate,
      averageStartedTrailProgress,
      startedTrailsCount,
    }),
    [
      profile,
      legacyCompletions,
      level,
      totalLessons,
      completedCount,
      progressPercent,
      remainingMinutes,
      recommendedLesson,
      lastLesson,
      completedCourses,
      completedQuizzes,
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      completeExercise,
      completeProject,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      journeyProgress,
      getTrailStatus,
      recommendedTrail,
      trailCompletionRate,
      averageStartedTrailProgress,
      startedTrailsCount,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgressContext() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgressContext must be used within ProgressProvider')
  return context
}
