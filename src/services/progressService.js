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
import { allLessons } from '../data/lessons/index.js'
import { trails as staticCourses } from '../data/trails.js'
import { getModuleData } from '../data/trails.js'
import { withRetry } from '../utils/retry.js'
import { XP_COURSE, XP_EXERCISE, XP_LESSON, XP_MODULE, XP_PROJECT } from '../utils/xp.js'
import {
  addCompletedCourse,
  addCompletedLesson,
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

function isModuleComplete(completedLessons, moduleId) {
  const mod = getModuleData(moduleId)
  if (!mod || !mod.lessons || !mod.lessons.length) return false
  return mod.lessons.every((lessonId) => completedLessons.includes(lessonId))
}

function isCourseComplete(completedLessons, courseId) {
  const course = staticCourses.find((item) => item.id === courseId)
  if (!course) return false
  const allCourseLessons = allLessons.filter((l) => l.courseId === courseId)
  return allCourseLessons.every((lesson) => completedLessons.includes(lesson.id))
}

export async function visitLesson(userId, lesson) {
  await updateCurrentLesson(userId, {
    courseId: lesson.courseId,
    lessonId: lesson.id,
  })
}

export async function completeLesson(userId, lessonId) {
  return withRetry(async () => {
    const lesson = allLessons.find((item) => item.id === lessonId)
    if (!lesson) throw new Error('Aula não encontrada.')

    const user = await getUserProfile(userId)

    const existing = await getLessonProgress(userId, lessonId)
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

    let xpEarned = XP_LESSON
    await addXpToUser(userId, XP_LESSON)
    await addStudyTime(userId, lesson.duration || 15)
    const streakResult = await updateUserStreak(userId)
    if (streakResult?.bonusXp) xpEarned += streakResult.bonusXp

    const completedLessons = await addCompletedLesson(userId, lessonId)
    await visitLesson(userId, lesson)

    let moduleComplete = false
    if (lesson.moduleId) {
      moduleComplete = isModuleComplete(completedLessons, lesson.moduleId)
      if (moduleComplete) {
        xpEarned += XP_MODULE
        await addXpToUser(userId, XP_MODULE)
      }
    }

    const courseComplete = isCourseComplete(completedLessons, lesson.courseId)
    if (courseComplete) {
      xpEarned += XP_COURSE
      await addXpToUser(userId, XP_COURSE)
      const course = staticCourses.find((item) => item.id === lesson.courseId)
      await addCompletedCourse(userId, lesson.courseId, course?.title || lesson.courseId)
    }

    const newlyUnlocked = await checkAndUnlockAchievements(userId)
    const updatedUser = await getUserProfile(userId)

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

export function getCourseProgressPercent(completedLessons, courseId) {
  const courseLessons = allLessons.filter((l) => l.courseId === courseId)
  if (!courseLessons.length) return 0

  const done = courseLessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  return Math.round((done / courseLessons.length) * 100)
}

export function isLessonCompleted(completedLessons, lessonId) {
  return completedLessons.includes(lessonId)
}
