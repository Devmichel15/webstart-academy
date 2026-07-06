const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { logger } = require('firebase-functions/v2')
const admin = require('firebase-admin')

admin.initializeApp()

const db = admin.firestore()
const auth = admin.auth()

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
    certificates: [],
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
    certificates: [],
    isPublic: false,
    _fromAuth: true,
  }
}

exports.listAllUsers = onCall(async (request) => {
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
})

exports.syncAuthUser = onDocumentCreated('users/{userId}', async (event) => {
  const snap = event.data
  if (!snap) return
  logger.info(`syncAuthUser: user document created for ${event.params.userId}`)
})
