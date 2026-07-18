const { logger } = require('firebase-functions/v2')
const admin = require('firebase-admin')
const crypto = require('crypto')

const db = admin.firestore()

const BATCH_SIZE = 50
const DELAY_BETWEEN_BATCHES_MS = 1000

async function getCourseEnrolledUsers(courseId) {
  const snapshot = await db.collection('users').get()
  const users = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    const prefs = data.emailPreferences || {}
    if (prefs.notificationsOptOut === true) return
    if (!data.email || data.email.trim() === '') return

    const isEnrolled =
      data.currentCourse === courseId ||
      (data.completedCourses || []).includes(courseId) ||
      (data.completedLessons || []).some((lId) => typeof lId === 'string' && lId.startsWith(courseId + '-'))

    if (isEnrolled) {
      users.push({
        uid: doc.id,
        email: data.email,
        name: data.name || 'Aluno',
      })
    }
  })

  return users
}

async function getCourseName(courseId) {
  if (!courseId) return 'WebStart Academy'
  try {
    const doc = await db.collection('courses').doc(courseId).get()
    return doc.exists ? doc.data().title : courseId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return courseId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateUnsubscribeUrl(uid) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.BREVO_API_KEY || 'webstart-default-secret'
  const token = crypto.createHmac('sha256', secret).update(uid).digest('hex').slice(0, 32)
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  return `${appUrl}/email-preferences?uid=${encodeURIComponent(uid)}&token=${token}`
}

async function sendNewLessonNotifications(lessonData, buildEmailFn, sendEmailFn) {
  const startTime = Date.now()
  const { id: lessonId, courseId, title: lessonTitle } = lessonData

  logger.info(`[newLesson] Processing lesson: "${lessonTitle}" (${lessonId})`)

  const courseName = await getCourseName(courseId)
  logger.info(`[newLesson] Course: "${courseName}" (${courseId})`)

  const users = await getCourseEnrolledUsers(courseId)
  logger.info(`[newLesson] Found ${users.length} users enrolled in course "${courseId}"`)

  if (users.length === 0) {
    logger.info('[newLesson] No eligible users, skipping')
    return { sent: 0, errors: 0, total: 0 }
  }

  let sentCount = 0
  let errorCount = 0

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(users.length / BATCH_SIZE)

    logger.info(`[newLesson] Sending batch ${batchNumber}/${totalBatches} (${batch.length} users)`)

    for (const user of batch) {
      try {
        user._unsubscribeUrl = generateUnsubscribeUrl(user.uid)
        const html = buildEmailFn(user, courseName, lessonTitle, lessonId)

        await sendEmailFn({
          to: user.email,
          toName: user.name,
          subject: `Nova aula: ${lessonTitle}`,
          htmlContent: html,
        })

        sentCount++
      } catch (error) {
        errorCount++
        logger.error(`[newLesson] Failed to send to ${user.email}:`, error.message)
      }
    }

    if (i + BATCH_SIZE < users.length) {
      await delay(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  logger.info(`[newLesson] Completed in ${elapsed}s — ${sentCount} sent, ${errorCount} errors, ${users.length} total`)

  return { sent: sentCount, errors: errorCount, total: users.length }
}

module.exports = { sendNewLessonNotifications, getCourseEnrolledUsers, getCourseName }
