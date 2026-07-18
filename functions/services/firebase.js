const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

let initialized = false

function initFirebase() {
  if (initialized) return admin

  const isCloudFunction = !!(process.env.FUNCTIONS_EMULATOR || process.env.K_SERVICE || process.env.FUNCTION_TARGET)

  if (isCloudFunction) {
    // Produção / emulador — credenciais automáticas
    admin.initializeApp()
  } else {
    // Local — procura serviceAccountKey.json na pasta firebase/
    const serviceAccountPath = path.resolve(__dirname, '..', '..', 'firebase', 'serviceAccountKey.json')

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    } else {
      // Fallback: tenta Application Default Credentials
      try {
        admin.initializeApp()
      } catch {
        throw new Error(
          `Firebase credentials not found.\n` +
          `  Expected: ${serviceAccountPath}\n` +
          `  Or set GOOGLE_APPLICATION_CREDENTIALS env var.`,
        )
      }
    }
  }

  initialized = true
  return admin
}

const firebaseAdmin = initFirebase()
const db = firebaseAdmin.firestore()
const auth = firebaseAdmin.auth()

module.exports = { firebaseAdmin, db, auth }
