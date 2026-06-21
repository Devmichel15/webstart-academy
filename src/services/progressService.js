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
import { allLessons, courses as staticCourses } from '../data/courses.js'
import { withRetry } from '../utils/retry.js'
import { XP_COURSE, XP_LESSON, XP_MODULE } from '../utils/xp.js'
import {
  addCompletedCourse,
  addCompletedLesson,
  addStudyTime,
  addXpToUser,
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

function getModuleLessons(courseId) {
  return allLessons.filter((lesson) => lesson.courseId === courseId)
}

function isModuleComplete(completedLessons, courseId) {
  const moduleLessons = getModuleLessons(courseId)
  return moduleLessons.length > 0 && moduleLessons.every((lesson) => completedLessons.includes(lesson.id))
}

function isCourseComplete(completedLessons, courseId) {
  const course = staticCourses.find((item) => item.id === courseId)
  if (!course) return false
  return course.lessons.every((lesson) => completedLessons.includes(lesson.id))
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

    const existing = await getLessonProgress(userId, lessonId)
    if (existing?.completed) {
      await visitLesson(userId, lesson)
      return { alreadyCompleted: true, xpEarned: 0 }
    }

    const progressRef = doc(db, 'user_progress', progressDocId(userId, lessonId))
    await setDoc(progressRef, {
      userId,
      courseId: lesson.courseId,
      moduleId: `${lesson.courseId}-main`,
      lessonId,
      completed: true,
      completedAt: serverTimestamp(),
      progressPercentage: 100,
      timeSpent: lesson.duration || 15,
    })

    let xpEarned = XP_LESSON
    await addXpToUser(userId, XP_LESSON)
    await addStudyTime(userId, lesson.duration || 15)
    await updateUserStreak(userId)

    const completedLessons = await addCompletedLesson(userId, lessonId)
    await visitLesson(userId, lesson)

    const moduleComplete = isModuleComplete(completedLessons, lesson.courseId)
    if (moduleComplete) {
      xpEarned += XP_MODULE
      await addXpToUser(userId, XP_MODULE)
    }

    const courseComplete = isCourseComplete(completedLessons, lesson.courseId)
    if (courseComplete) {
      xpEarned += XP_COURSE
      await addXpToUser(userId, XP_COURSE)
      const course = staticCourses.find((item) => item.id === lesson.courseId)
      await addCompletedCourse(userId, lesson.courseId, course?.title || lesson.courseId)
    }

    await checkAndUnlockAchievements(userId)

    return {
      alreadyCompleted: false,
      xpEarned,
      moduleComplete,
      courseComplete,
    }
  })
}

export function getCourseProgressPercent(completedLessons, courseId) {
  const course = staticCourses.find((item) => item.id === courseId)
  if (!course || !course.lessons.length) return 0

  const done = course.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  return Math.round((done / course.lessons.length) * 100)
}

export function isLessonCompleted(completedLessons, lessonId) {
  return completedLessons.includes(lessonId)
}
