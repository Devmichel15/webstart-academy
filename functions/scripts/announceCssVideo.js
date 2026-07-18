/**
 * Script one-off: Comunicado — Conclusão do CSS + Formato Vídeo
 *
 * Uso:
 *   node announceCssVideo.js              → envio real (pede confirmação)
 *   node announceCssVideo.js --test       → envia apenas para TEST_EMAILS
 *   node announceCssVideo.js --dry-run    → mostra stats sem enviar nada
 */

const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const { firebaseAdmin: admin, db } = require('../services/firebase')
const { sendEmail } = require('../services/brevo')
const { buildAnnounceEmail } = require('../templates/announce')
const crypto = require('crypto')

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ANNOUNCEMENT_ID = 'css-video-completion-2026'
const SUBJECT = '🎉 Módulo de CSS concluído — e uma novidade para ti'
const BATCH_SIZE = 50
const DELAY_MS = 1000

const TEST_EMAILS = [
  // Adiciona aqui os emails de teste:
  // 'exemplo@email.com',
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function generateUnsubscribeUrl(uid) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.BREVO_API_KEY || 'webstart-default-secret'
  const token = crypto.createHmac('sha256', secret).update(uid).digest('hex').slice(0, 32)
  const appUrl = process.env.APP_URL || 'https://webstart-academy.web.app'
  return `${appUrl}/email-preferences?uid=${encodeURIComponent(uid)}&token=${token}`
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getRecipients(testMode) {
  if (testMode) {
    if (TEST_EMAILS.length === 0) {
      console.error('TEST_EMAILS está vazio. Adiciona pelo menos um email ao array TEST_EMAILS no script.')
      process.exit(1)
    }
    return TEST_EMAILS.map((email) => ({
      uid: 'test',
      email,
      name: 'Teste',
    }))
  }

  const snapshot = await db.collection('users').get()
  const recipients = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    if (!data.email || data.email.trim() === '') return

    const prefs = data.emailPreferences || {}
    if (prefs.marketingOptOut === true) return

    recipients.push({
      uid: doc.id,
      email: data.email,
      name: data.name || 'Aluno',
    })
  })

  return recipients
}

async function logAnnouncement(stats) {
  const docRef = db.collection('announcements').doc(ANNOUNCEMENT_ID)
  await docRef.set({
    id: ANNOUNCEMENT_ID,
    subject: SUBJECT,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    ...stats,
  })
  console.log(`\nRegisto gravado em announcements/${ANNOUNCEMENT_ID}`)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const testMode = args.includes('--test')
  const dryRun = args.includes('--dry-run')

  console.log('━'.repeat(60))
  console.log('  COMUNICADO: Conclusão CSS + Formato Vídeo')
  console.log('━'.repeat(60))
  console.log(`  Modo: ${dryRun ? 'DRY-RUN (sem envio)' : testMode ? 'TESTE (emails fixos)' : 'REAL'}`)
  console.log()

  // 1. Buscar destinatários
  const recipients = await getRecipients(testMode)
  console.log(`  Destinatários: ${recipients.length}`)

  if (recipients.length === 0) {
    console.log('\n  Nenhum destinatário encontrado. Abortando.')
    return
  }

  // 2. Listar primeiros destinatários (preview)
  const preview = recipients.slice(0, 5)
  console.log('  Preview:')
  preview.forEach((r) => console.log(`    - ${r.name} <${r.email}>`))
  if (recipients.length > 5) {
    console.log(`    ... e mais ${recipients.length - 5}`)
  }

  if (dryRun) {
    console.log('\n  DRY-RUN: Nenhum email enviado.')
    return
  }

  // 3. Confirmação (apenas em modo real, não-teste)
  if (!testMode) {
    console.log()
    const readline = require('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise((resolve) => {
      rl.question(`  Confirmas o envio para ${recipients.length} utilizadores? (sim/nao): `, resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'sim') {
      console.log('\n  Envio cancelado pelo utilizador.')
      return
    }
  }

  // 4. Enviar
  console.log('\n  A enviar...')
  let sentCount = 0
  let errorCount = 0
  const errors = []

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(recipients.length / BATCH_SIZE)

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} users)`)

    for (const user of batch) {
      try {
        user._unsubscribeUrl = generateUnsubscribeUrl(user.uid)
        const html = buildAnnounceEmail(user)

        await sendEmail({
          to: user.email,
          toName: user.name,
          subject: SUBJECT,
          htmlContent: html,
        })

        sentCount++
      } catch (error) {
        errorCount++
        errors.push({ email: user.email, error: error.message })
        console.error(`    Erro: ${user.email} — ${error.message}`)
      }
    }

    if (i + BATCH_SIZE < recipients.length) {
      await delay(DELAY_MS)
    }
  }

  // 5. Registo
  const stats = {
    total: recipients.length,
    sent: sentCount,
    errors: errorCount,
    errorDetails: errors.slice(0, 20),
    mode: testMode ? 'test' : 'real',
  }

  await logAnnouncement(stats)

  console.log('\n' + '━'.repeat(60))
  console.log(`  Concluído: ${sentCount} enviados, ${errorCount} erros`)
  console.log('━'.repeat(60))
}

main().catch((error) => {
  console.error('Erro fatal:', error)
  process.exit(1)
})
