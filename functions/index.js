const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onRequest } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions/v2')
const crypto = require('crypto')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const { firebaseAdmin: admin, db, auth } = require('./services/firebase')

const { sendEmail } = require('./services/brevo')
const { findReactivationUsers, getCourseTitle } = require('./services/users')
const { buildReactivationEmail } = require('./templates/reactivation')
const { buildNewLessonEmail } = require('./templates/newLesson')
const { buildWelcomeEmail } = require('./templates/welcome')
const { sendNewLessonNotifications } = require('./services/notifications')
const { parseWebhookBatch, processWebhookEvent } = require('./services/webhookHandler')

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
    emailPreferences: {
      marketingOptOut: false,
      notificationsOptOut: false,
    },
    welcomeEmailSent: false,
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
    emailPreferences: {
      marketingOptOut: false,
      notificationsOptOut: false,
    },
    welcomeEmailSent: false,
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

  const uid = event.params.userId
  const userData = snap.data()

  if (userData.welcomeEmailSent) {
    logger.info(`[welcome] uid=${uid} already notified, skipping`)
    return
  }

  if (!userData.email || userData.email.trim() === '') {
    logger.info(`[welcome] uid=${uid} has no email, skipping`)
    return
  }

  const prefs = userData.emailPreferences || {}
  if (prefs.notificationsOptOut === true) {
    logger.info(`[welcome] uid=${uid} opted out, skipping`)
    return
  }

  try {
    const userObj = { uid, name: userData.name || 'Aluno' }
    userObj._unsubscribeUrl = buildUnsubscribeUrl(uid)

    const html = buildWelcomeEmail(userObj)

    await sendEmail({
      to: userData.email,
      toName: userData.name || 'Aluno',
      subject: `Bem-vindo(a) à WebStart Academy, ${(userData.name || 'Aluno').split(' ')[0]}! 🎉`,
      htmlContent: html,
    })

    await snap.ref.update({
      welcomeEmailSent: true,
      welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    logger.info(`[welcome] email sent to ${userData.email}`)
  } catch (error) {
    logger.error(`[welcome] failed for uid=${uid}:`, error)
  }
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

        user._unsubscribeUrl = buildUnsubscribeUrl(user.uid)
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

// ─── NEW LESSON NOTIFICATIONS (BREVO) ───────────────────────────────────────

exports.onNewLessonPublished = onDocumentCreated('lessons/{lessonId}', async (event) => {
  const snap = event.data
  if (!snap) return

  const lessonId = event.params.lessonId
  const lessonData = snap.data()

  if (lessonData.notificationSent) {
    logger.info(`[newLesson] Lesson ${lessonId} already notified, skipping`)
    return
  }

  if (!lessonData.title) {
    logger.warn(`[newLesson] Lesson ${lessonId} has no title, skipping`)
    return
  }

  try {
    const result = await sendNewLessonNotifications(
      { id: lessonId, ...lessonData },
      buildNewLessonEmail,
      sendEmail,
    )

    await snap.ref.update({
      notificationSent: true,
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationStats: {
        sent: result.sent,
        errors: result.errors,
        total: result.total,
      },
    })

    logger.info(`[newLesson] Lesson ${lessonId} marked as notified (${result.sent}/${result.total})`)
  } catch (error) {
    logger.error(`[newLesson] Fatal error processing lesson ${lessonId}:`, error)
  }
})

// ─── EMAIL PREFERENCES / UNSUBSCRIBE ──────────────────────────────────────────

function generateUnsubscribeToken(uid) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.BREVO_API_KEY || 'webstart-default-secret'
  return crypto.createHmac('sha256', secret).update(uid).digest('hex').slice(0, 32)
}

function buildUnsubscribeUrl(uid) {
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  const token = generateUnsubscribeToken(uid)
  return `${appUrl}/email-preferences?uid=${encodeURIComponent(uid)}&token=${token}`
}

exports.handleEmailPreferences = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { uid, token } = req.query
      if (!uid || !token) {
        return res.status(400).send('Parâmetros inválidos.')
      }

      const expectedToken = generateUnsubscribeToken(uid)
      if (token !== expectedToken) {
        return res.status(403).send('Token inválido.')
      }

      const userDoc = await db.collection('users').doc(uid).get()
      if (!userDoc.exists) {
        return res.status(404).send('Utilizador não encontrado.')
      }

      const prefs = userDoc.data().emailPreferences || { marketingOptOut: false, notificationsOptOut: false }

      const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
      res.send(`
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Preferências de Email — WebStart Academy</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; color: #1a1a1a; background: #f8fafc; }
            h1 { font-size: 20px; color: #064e3b; }
            label { display: block; margin: 16px 0; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }
            label:hover { border-color: #064e3b; }
            input[type="checkbox"] { margin-right: 10px; }
            button { background: #064e3b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 16px; font-size: 14px; }
            button:hover { background: #065f46; }
            .msg { padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 14px; }
            .ok { background: #d1fae5; color: #064e3b; }
            .err { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <h1>Preferências de Email</h1>
          <p>Escolhe que tipo de emails queres receber da WebStart Academy:</p>
          <form id="form">
            <input type="hidden" id="uid" value="${uid}">
            <input type="hidden" id="token" value="${token}">
            <label>
              <input type="checkbox" id="marketing" ${!prefs.marketingOptOut ? 'checked' : ''}>
              Emails de reativação (lembrar quando paraste de estudar)
            </label>
            <label>
              <input type="checkbox" id="notifications" ${!prefs.notificationsOptOut ? 'checked' : ''}>
              Notificações de novas aulas
            </label>
            <button type="submit">Guardar preferências</button>
          </form>
          <div id="result"></div>
          <script>
            document.getElementById('form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const body = {
                uid: document.getElementById('uid').value,
                token: document.getElementById('token').value,
                marketingOptOut: !document.getElementById('marketing').checked,
                notificationsOptOut: !document.getElementById('notifications').checked,
              };
              try {
                const res = await fetch('${appUrl}/api/email-preferences', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                const el = document.getElementById('result');
                if (data.success) {
                  el.className = 'msg ok';
                  el.textContent = 'Preferências guardadas com sucesso!';
                } else {
                  el.className = 'msg err';
                  el.textContent = data.error || 'Erro ao guardar.';
                }
              } catch {
                document.getElementById('result').className = 'msg err';
                document.getElementById('result').textContent = 'Erro de conexão.';
              }
            });
          </script>
        </body>
        </html>
      `)
    } else if (req.method === 'POST') {
      const { uid, token, marketingOptOut, notificationsOptOut } = req.body

      if (!uid || !token) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios em falta.' })
      }

      const expectedToken = generateUnsubscribeToken(uid)
      if (token !== expectedToken) {
        return res.status(403).json({ error: 'Token inválido.' })
      }

      await db.collection('users').doc(uid).update({
        emailPreferences: {
          marketingOptOut: marketingOptOut === true,
          notificationsOptOut: notificationsOptOut === true,
        },
      })

      logger.info(`handleEmailPreferences: uid=${uid} updated`)
      return res.json({ success: true })
    } else {
      return res.status(405).json({ error: 'Method not allowed.' })
    }
  } catch (error) {
    logger.error('handleEmailPreferences error:', error)
    return res.status(500).json({ error: 'Erro interno.' })
  }
})

// ─── BREVO WEBHOOK TRACKING ───────────────────────────────────────────────────

exports.brevoWebhook = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const body = req.body
    if (!body) {
      return res.status(400).json({ error: 'Empty body.' })
    }

    const events = parseWebhookBatch(body)
    if (events.length === 0) {
      return res.json({ received: 0, stored: 0 })
    }

    let stored = 0
    for (const event of events) {
      try {
        await processWebhookEvent(event)
        stored++
      } catch (err) {
        logger.error('[webhook] Failed to store event:', err)
      }
    }

    logger.info(`[webhook] Processed ${events.length} events, stored ${stored}`)
    return res.json({ received: events.length, stored })
  } catch (error) {
    logger.error('[webhook] Fatal error:', error)
    return res.status(500).json({ error: 'Internal error.' })
  }
})
