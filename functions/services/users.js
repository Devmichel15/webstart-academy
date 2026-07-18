const admin = require('firebase-admin')
const { logger } = require('firebase-functions/v2')

const db = admin.firestore()

function daysSince(date) {
  if (!date) return Infinity
  const d = date.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor((startOfToday - startOfD) / (1000 * 60 * 60 * 24))
}

async function findReactivationUsers() {
  const usersSnap = await db.collection('users').get()
  const eligible = []

  for (const doc of usersSnap.docs) {
    const user = doc.data()
    const uid = doc.id

    const prefs = user.emailPreferences || {}
    if (prefs.marketingOptOut === true) continue

    const completed = user.completedLessons || []
    if (completed.length < 1) continue

    const days = daysSince(user.lastStudyDate)
    if (days !== 1 && days !== 3) continue

    const lastSent = user.lastReactivationEmail
    if (lastSent && daysSince(lastSent) < 7) continue

    eligible.push({
      uid,
      email: user.email,
      name: user.name || 'Aluno',
      xp: user.xp || 0,
      streak: user.streak || 0,
      completedLessons: completed.length,
      currentCourse: user.currentCourse || null,
      currentLesson: user.currentLesson || completed[completed.length - 1] || null,
      daysInactive: days,
    })
  }

  logger.info(`findReactivationUsers: ${eligible.length} eligible out of ${usersSnap.size} total`)
  return eligible
}

async function getCourseTitle(courseId) {
  if (!courseId) return null
  try {
    const courseDoc = await db.collection('courses').doc(courseId).get()
    return courseDoc.exists ? courseDoc.data().title : null
  } catch {
    return null
  }
}

module.exports = { findReactivationUsers, getCourseTitle, daysSince }
