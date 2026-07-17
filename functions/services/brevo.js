const { logger } = require('firebase-functions/v2')

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

function getApiKey() {
  const key = process.env.BREVO_API_KEY || process.env.VITE_API_KEY_BREVO
  if (!key) {
    throw new Error(
      'BREVO_API_KEY não configurada. Define via: firebase functions:config:set brevo.api_key="xxx"',
    )
  }
  return key
}

async function sendEmail({ to, toName, subject, htmlContent }) {
  const apiKey = getApiKey()

  const body = {
    sender: {
      name: 'WebStart Academy',
      email: 'noreply@webstart-academy.web.app',
    },
    to: [{ email: to, name: toName || '' }],
    subject,
    htmlContent,
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    logger.error(`Brevo API error ${response.status}:`, errorBody)
    throw new Error(`Brevo API ${response.status}: ${errorBody}`)
  }

  const result = await response.json()
  logger.info(`Brevo email sent to ${to}, messageId: ${result.messageId}`)
  return result
}

module.exports = { sendEmail }
