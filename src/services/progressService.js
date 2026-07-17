import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { trails as staticCourses } from '../data/trails.js'
import { getModuleData } from '../data/trails.js'
import { withRetry } from '../utils/retry.js'
import { XP_COURSE, XP_EXERCISE, XP_LESSON, XP_MODULE, XP_PROJECT } from '../utils/xp.js'
import {
  addCompletedCourse,
  addCompletedLesson,
  addCompletedQuiz,
  addStudyTime,
  addXpToUser,
  getUserProfile,
  incrementCompletedExercises,
  incrementCompletedProjects,
  updateCurrentLesson,
  updateUserStreak,
} from './userService.js'
import { checkAndUnlockAchievements } from './achievementService.js'

function progressDocId(userId, lessonId) {
  return `${userId}_${lessonId}`
}

export async function getLessonProgress(userId, lessonId) {
  const snap = await getDoc(doc(db, 'user_progress', progressDocId(userId, lessonId)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserProgress(userId) {
  return withRetry(async () => {
    const q = query(collection(db, 'user_progress'), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
  })
}

export function subscribeToUserProgress(userId, callback, onError) {
  const q = query(collection(db, 'user_progress'), where('userId', '==', userId))

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })))
    },
    onError,
  )
}

export function isModuleComplete(completedLessons, completedQuizzes, moduleId) {
  const mod = getModuleData(moduleId)
  if (!mod) return false

  if (!mod.lessons || mod.lessons.length === 0) {
    return !mod.quiz
  }

  const allLessonsDone = mod.lessons.every((lessonId) => completedLessons.includes(lessonId))
  if (!allLessonsDone) return false
  if (mod.quiz && !completedQuizzes.includes(moduleId)) return false
  return true
}

function isCourseComplete(completedLessons, completedQuizzes, courseId) {
  const course = staticCourses.find((item) => item.id === courseId)
  if (!course) return false
  const modules = course.modules || []
  if (modules.length === 0) {
    const allCourseLessons = allLessons.filter((l) => l.courseId === courseId)
    return allCourseLessons.every((lesson) => completedLessons.includes(lesson.id))
  }
  return modules.every((moduleId) => isModuleComplete(completedLessons, completedQuizzes, moduleId))
}

export async function visitLesson(userId, lesson) {
  await updateCurrentLesson(userId, {
    courseId: lesson.courseId,
    lessonId: lesson.id,
  })
}

export async function completeLesson(userId, lessonId) {
  return withRetry(async () => {
    const allAvailable = [...allLessons, ...allVideoLessons]
    const lesson = allAvailable.find((item) => item.id === lessonId)
    if (!lesson) throw new Error('Aula não encontrada.')

    const user = await getUserProfile(userId)
    console.log('[completeLesson] getUserProfile OK')

    const existing = await getLessonProgress(userId, lessonId)
    console.log('[completeLesson] getLessonProgress OK', existing)
    if (existing?.completed) {
      await visitLesson(userId, lesson)
      return { alreadyCompleted: true, xpEarned: 0 }
    }

    const progressRef = doc(db, 'user_progress', progressDocId(userId, lessonId))
    await setDoc(progressRef, {
      userId,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId || `${lesson.courseId}-main`,
      lessonId,
      completed: true,
      completedAt: serverTimestamp(),
      progressPercentage: 100,
      timeSpent: lesson.duration || 15,
    })
    console.log('[completeLesson] setDoc user_progress OK')

    let xpEarned = XP_LESSON
    await addXpToUser(userId, XP_LESSON)
    console.log('[completeLesson] addXpToUser OK')
    await addStudyTime(userId, lesson.duration || 15)
    console.log('[completeLesson] addStudyTime OK')
    const streakResult = await updateUserStreak(userId)
    console.log('[completeLesson] updateUserStreak OK')
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp

    const completedLessons = await addCompletedLesson(userId, lessonId)
    console.log('[completeLesson] addCompletedLesson OK, completedCount:', completedLessons?.length)
    await visitLesson(userId, lesson)
    console.log('[completeLesson] visitLesson OK')

    const userAfterLesson = await getUserProfile(userId)
    const completedQuizzes = userAfterLesson?.completedQuizzes || []

    let moduleComplete = false
    if (lesson.moduleId) {
      moduleComplete = isModuleComplete(completedLessons, completedQuizzes, lesson.moduleId)
      if (moduleComplete) {
        xpEarned += XP_MODULE
        await addXpToUser(userId, XP_MODULE)
        console.log('[completeLesson] module bonus XP OK')
      }
    }

    const courseComplete = isCourseComplete(completedLessons, completedQuizzes, lesson.courseId)
    if (courseComplete) {
      xpEarned += XP_COURSE
      await addXpToUser(userId, XP_COURSE)
      const course = staticCourses.find((item) => item.id === lesson.courseId)
      await addCompletedCourse(userId, lesson.courseId, course?.title || lesson.courseId)
      console.log('[completeLesson] course bonus XP OK')
    }

    const newlyUnlocked = await checkAndUnlockAchievements(userId)
    console.log('[completeLesson] checkAndUnlockAchievements OK', newlyUnlocked.length, 'unlocked')
    const updatedUser = await getUserProfile(userId)
    console.log('[completeLesson] final getUserProfile OK')

    return {
      alreadyCompleted: false,
      xpEarned,
      moduleComplete,
      courseComplete,
      streakResult,
      newlyUnlocked,
      shareData: {
        name: updatedUser?.name || user?.name || 'Aluno',
        title: `Aula: ${lesson.title}`,
        xpEarned,
        streak: updatedUser?.streak || streakResult?.streak || 0,
        level: updatedUser?.level || 1,
        badge: newlyUnlocked[0]?.title || null,
        tagline: 'Aprendendo a estruturar a Web como um dev real',
      },
    }
  })
}

export async function completeExercise(userId, exerciseTitle) {
  return withRetry(async () => {
    const user = await getUserProfile(userId)
    let xpEarned = XP_EXERCISE
    await addXpToUser(userId, XP_EXERCISE)
    const streakResult = await updateUserStreak(userId)
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp
    await incrementCompletedExercises(userId)
    const newlyUnlocked = await checkAndUnlockAchievements(userId)
    const updatedUser = await getUserProfile(userId)

    return {
      xpEarned,
      newlyUnlocked,
      shareData: {
        name: updatedUser?.name || user?.name || 'Aluno',
        title: `Exercício: ${exerciseTitle}`,
        xpEarned,
        streak: updatedUser?.streak || 0,
        level: updatedUser?.level || 1,
        badge: newlyUnlocked[0]?.title || 'Estruturador de Conteúdo',
        tagline: 'Aprendendo a estruturar a Web como um dev real',
      },
    }
  })
}

export async function completeProject(userId, projectTitle) {
  return withRetry(async () => {
    const user = await getUserProfile(userId)
    let xpEarned = XP_PROJECT
    await addXpToUser(userId, XP_PROJECT)
    const streakResult = await updateUserStreak(userId)
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp
    await incrementCompletedProjects(userId)
    const newlyUnlocked = await checkAndUnlockAchievements(userId)
    const updatedUser = await getUserProfile(userId)

    return {
      xpEarned,
      newlyUnlocked,
      shareData: {
        name: updatedUser?.name || user?.name || 'Aluno',
        title: `Projeto: ${projectTitle}`,
        xpEarned,
        streak: updatedUser?.streak || 0,
        level: updatedUser?.level || 1,
        badge: newlyUnlocked[0]?.title || 'Construtor de Projetos',
        tagline: 'Construindo projetos reais na WebStart',
      },
    }
  })
}

export async function completeQuiz(userId, moduleId, score, totalQuestions) {
  return withRetry(async () => {
    const user = await getUserProfile(userId)
    const completedQuizzes = await addCompletedQuiz(userId, moduleId)

    const completedLessons = user?.completedLessons || []
    const moduleComplete = isModuleComplete(completedLessons, completedQuizzes, moduleId)

    let xpEarned = 0
    if (moduleComplete) {
      xpEarned += XP_MODULE
      await addXpToUser(userId, XP_MODULE)
    }

    const course = staticCourses.find((c) => c.modules?.includes(moduleId))
    let courseComplete = false
    if (course) {
      courseComplete = isCourseComplete(completedLessons, completedQuizzes, course.id)
      if (courseComplete) {
        xpEarned += XP_COURSE
        await addXpToUser(userId, XP_COURSE)
        await addCompletedCourse(userId, course.id, course.title)
      }
    }

    return {
      xpEarned,
      moduleComplete,
      courseComplete,
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
    }
  })
}

export function getModuleProgressPercent(completedLessons, completedQuizzes, moduleId) {
  const mod = getModuleData(moduleId)
  if (!mod) return 0

  if (!mod.lessons || mod.lessons.length === 0) {
    return mod.quiz && !completedQuizzes.includes(moduleId) ? 0 : 100
  }

  const lessonsDone = mod.lessons.filter((l) => completedLessons.includes(l)).length
  const lessonsPercent = (lessonsDone / mod.lessons.length) * 100
  if (mod.quiz) {
    const quizDone = completedQuizzes.includes(moduleId) ? 1 : 0
    return Math.round(lessonsPercent * 0.7 + quizDone * 30)
  }
  return Math.round(lessonsPercent)
}

export function getCourseProgressPercent(completedLessons, completedQuizzes, courseId) {
  const course = staticCourses.find((item) => item.id === courseId)
  if (!course) return 0
  const modules = course.modules || []
  if (modules.length === 0) {
    const courseLessons = allLessons.filter((l) => l.courseId === courseId)
    if (!courseLessons.length) return 0
    const done = courseLessons.filter((lesson) => completedLessons.includes(lesson.id)).length
    return Math.round((done / courseLessons.length) * 100)
  }
  const total = modules.length
  const done = modules.filter((m) => isModuleComplete(completedLessons, completedQuizzes, m)).length
  return Math.round((done / total) * 100)
}

export function isLessonCompleted(completedLessons, lessonId) {
  return completedLessons.includes(lessonId)
}
