const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { logger } = require('firebase-functions/v2')
const admin = require('firebase-admin')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

admin.initializeApp()

const db = admin.firestore()
const auth = admin.auth()

const { sendEmail } = require('./services/brevo')
const { findReactivationUsers, getCourseTitle } = require('./services/users')
const { buildReactivationEmail } = require('./templates/reactivation')

function buildDefaultUser(userRecord) {
  const now = admin.firestore.FieldValue.serverTimestamp()
  return {
    uid: userRecord.uid,
    name: userRecord.displayName || 'Aluno WebStart',
    email: userRecord.email || '',
    provider: userRecord.providerData?.[0]?.providerId || 'email',
    role: 'student',
    createdAt: now,
    lastLogin: now,
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    completedLessons: [],
    completedCourses: [],
    completedExercises: 0,
    completedProjects: 0,
    currentCourse: null,
    currentLesson: null,
    totalStudyTime: 0,
    isPublic: true,
  }
}

function userRecordToProfile(userRecord) {
  const u = userRecord.toJSON()
  return {
    id: u.uid,
    uid: u.uid,
    name: u.displayName || 'Aluno WebStart',
    email: u.email || u.providerData?.[0]?.email || '',
    provider: u.providerData?.[0]?.providerId || 'email',
    role: 'student',
    phone: u.phoneNumber || '',
    photoURL: u.photoURL || '',
    disabled: u.disabled || false,
    createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
    lastLogin: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    completedLessons: [],
    completedCourses: [],
    completedExercises: 0,
    completedProjects: 0,
    currentCourse: null,
    currentLesson: null,
    totalStudyTime: 0,
    isPublic: false,
    _fromAuth: true,
  }
}

exports.listAllUsers = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.')
    }

    const callerDoc = await db.collection('users').doc(request.auth.uid).get()
    const callerData = callerDoc.data()
    const isAdmin = callerData?.role === 'admin'
    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'Only admins can list all users.')
    }

    const firestoreProfiles = {}
    const firestoreSnap = await db.collection('users').get()
    firestoreSnap.forEach((doc) => {
      firestoreProfiles[doc.id] = { id: doc.id, ...doc.data() }
    })

    const allAuthUsers = []
    let nextPageToken
    do {
      const result = await auth.listUsers(1000, nextPageToken)
      allAuthUsers.push(...result.users)
      nextPageToken = result.pageToken
    } while (nextPageToken)

    const mergedUsers = []
    const seenUids = new Set()

    for (const userRecord of allAuthUsers) {
      const uid = userRecord.uid
      seenUids.add(uid)
      if (firestoreProfiles[uid]) {
        mergedUsers.push(firestoreProfiles[uid])
      } else {
        const profile = userRecordToProfile(userRecord)
        mergedUsers.push(profile)
      }
    }

    for (const [uid, profile] of Object.entries(firestoreProfiles)) {
      if (!seenUids.has(uid)) {
        mergedUsers.push(profile)
        seenUids.add(uid)
      }
    }

    logger.info(`listAllUsers: returned ${mergedUsers.length} users (${allAuthUsers.length} auth, ${Object.keys(firestoreProfiles).length} firestore)`)

    return { users: mergedUsers }
  } catch (error) {
    logger.error('listAllUsers error:', error)
    if (error instanceof HttpsError) {
      throw error
    }
    throw new HttpsError('internal', error.message || 'An unexpected error occurred.')
  }
})

exports.syncAuthUser = onDocumentCreated('users/{userId}', async (event) => {
  const snap = event.data
  if (!snap) return
  logger.info(`syncAuthUser: user document created for ${event.params.userId}`)
})

// ─── REACTIVATION EMAILS (BREVO) ────────────────────────────────────────────

exports.sendReactivationEmails = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'Africa/Luanda',
    retryConfig: { retryCount: 2 },
  },
  async () => {
    logger.info('sendReactivationEmails: starting...')

    const eligible = await findReactivationUsers()
    logger.info(`sendReactivationEmails: ${eligible.length} users eligible`)

    if (eligible.length === 0) return

    let sentCount = 0
    let errorCount = 0
    const now = admin.firestore.FieldValue.serverTimestamp()

    for (const user of eligible) {
      try {
        const courseName =
          (await getCourseTitle(user.currentCourse)) ||
          (user.currentCourse || 'web')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())

        const html = buildReactivationEmail(user, courseName, user.currentLesson)

        await sendEmail({
          to: user.email,
          toName: user.name,
          subject: `${user.name}, a tua trilha está te esperando! 🚀`,
          htmlContent: html,
        })

        await db.collection('users').doc(user.uid).update({
          lastReactivationEmail: now,
        })

        sentCount++
        logger.info(`sendReactivationEmails: email sent to ${user.email}`)
      } catch (error) {
        errorCount++
        logger.error(`sendReactivationEmails: failed for ${user.email}`, error)
      }
    }

    logger.info(`sendReactivationEmails: completed — ${sentCount} sent, ${errorCount} errors`)
  },
)

exports.getReactivationUsers = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.')

  const callerDoc = await db.collection('users').doc(request.auth.uid).get()
  if (callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only.')
  }

  const eligible = await findReactivationUsers()
  return { users: eligible, count: eligible.length }
})
