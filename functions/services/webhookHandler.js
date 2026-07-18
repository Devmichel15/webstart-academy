const { logger } = require('firebase-functions/v2')
const admin = require('firebase-admin')

const db = admin.firestore()

const VALID_EVENTS = ['opened', 'clicked', 'bounced', 'complained', 'unsubscribed']

function parseWebhookBatch(body) {
  const items = Array.isArray(body) ? body : [body]
  return items.filter((item) => item && VALID_EVENTS.includes(item.event))
}

async function processWebhookEvent(event) {
  const { event: eventType, email, date, 'message-id': messageId, link, subject } = event

  if (!email) {
    logger.warn('[webhook] Event without email, skipping')
    return null
  }

  const eventData = {
    event: eventType,
    email,
    messageId: messageId || null,
    subject: subject || null,
    link: link || null,
    timestamp: date ? new Date(date) : admin.firestore.FieldValue.serverTimestamp(),
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  const docRef = db.collection('emailEvents').doc()
  await docRef.set(eventData)

  logger.info(`[webhook] Stored event: ${eventType} for ${email} (doc: ${docRef.id})`)
  return docRef.id
}

module.exports = { parseWebhookBatch, processWebhookEvent, VALID_EVENTS }
