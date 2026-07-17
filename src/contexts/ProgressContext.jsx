import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { trails } from '../data/trails.js'
import { useAuthContext } from './AuthContext.jsx'
import { getAchievementsWithStatus } from '../services/achievementService.js'
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
  getAccessibleLessonsCount,
  getJourneyProgress,
  getRecommendedTrail,
  isTrailUnlocked,
} from '../services/trailProgressService.js'
import { getLevelFromXp, XP_LESSON } from '../utils/xp.js'
import { useToast } from './ToastContext.jsx'
import { AchievementCelebration } from '../components/gamification/AchievementCelebration.jsx'

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
  const [celebration, setCelebration] = useState(null)

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
          if (data && !data.username) {
            await ensureUsername(user.uid)
            return
          }
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
  const completedCourses = profile.completedCourses || []
  const completedQuizzes = profile.completedQuizzes || []
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
      const result = await completeLessonService(user.uid, lessonId)
      if (result.alreadyCompleted) return result

      showSuccess(`Aula concluída! +${result.xpEarned || XP_LESSON} XP`)
      if (result.streakResult?.bonusXp) {
        showSuccess(`Bónus de streak! +${result.streakResult.bonusXp} XP`)
      }
      if (result.streakResult?.broke) {
        showError(`Streak reiniciado. -${result.streakResult.penaltyXp} XP`)
      }
      if (result.courseComplete) {
        showSuccess('Curso concluído! +1000 XP e certificado desbloqueado!')
      }
      if (result.shareData) setCelebration(result.shareData)
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
      const result = await completeExerciseService(user.uid, exerciseTitle)
      showSuccess(`Exercício concluído! +${result.xpEarned} XP`)
      if (result.shareData) setCelebration(result.shareData)
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar exercício.')
      return null
    }
  }, [user, showSuccess, showError])

  const completeProject = useCallback(async (projectTitle) => {
    if (!user) return null
    try {
      const result = await completeProjectService(user.uid, projectTitle)
      showSuccess(`Projeto concluído! +${result.xpEarned} XP`)
      if (result.shareData) setCelebration(result.shareData)
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar projeto.')
      return null
    }
  }, [user, showSuccess, showError])

  const completeQuiz = useCallback(async (moduleId, score, totalQuestions) => {
    if (!user) return null
    try {
      const result = await completeQuizService(user.uid, moduleId, score, totalQuestions)
      showSuccess('Quiz concluído!')
      return result
    } catch (err) {
      showError(err.message || 'Erro ao salvar quiz.')
      return null
    }
  }, [user, showSuccess, showError])

  const dismissCelebration = useCallback(() => setCelebration(null), [])

  const visitLesson = useCallback(async (lessonId) => {
    if (!user) return
    const lesson = allCombinedLessons.find((item) => item.id === lessonId)
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
    (courseId) => getCourseProgressPercent(completedLessons, completedQuizzes, courseId),
    [completedLessons, completedQuizzes],
  )

  const studyHours = Math.round(((profile.totalStudyTime || 0) / 60) * 10) / 10

  const journeyProgress = useMemo(
    () => getJourneyProgress(completedCourses, completedLessons, completedQuizzes),
    [completedCourses, completedLessons, completedQuizzes],
  )

  const trailStatuses = useMemo(() => {
    const map = {}
    for (const trail of trails) {
      map[trail.id] = computeTrailStatus(trail.id, completedLessons, completedCourses, completedQuizzes)
    }
    return map
  }, [completedLessons, completedCourses, completedQuizzes])

  const getTrailStatus = useCallback(
    (trailId) => trailStatuses[trailId] || 'locked',
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
      certificates: profile.certificates || [],
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      completeExercise,
      completeProject,
      completeQuiz,
      dismissCelebration,
      celebration,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      achievements,
      journeyProgress,
      getTrailStatus,
      recommendedTrail,
      trails,
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
      completedCourses,
      completedQuizzes,
      studyHours,
      progressRecords,
      loading,
      error,
      completeLesson,
      completeExercise,
      completeProject,
      dismissCelebration,
      celebration,
      visitLesson,
      isLessonCompleted,
      getCourseProgress,
      achievements,
      journeyProgress,
      getTrailStatus,
      recommendedTrail,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
      <AchievementCelebration
        open={Boolean(celebration)}
        onClose={dismissCelebration}
        shareData={celebration}
      />
    </ProgressContext.Provider>
  )
}

export function useProgressContext() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgressContext must be used within ProgressProvider')
  return context
}
