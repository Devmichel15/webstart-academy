// Export READ-ONLY do Firebase → migration/backups/firebase/
// Operações usadas: listCollections / get / listUsers / getFiles — nenhuma escrita.
// Credenciais: firebase/serviceAccountKey.json (LOCAL, fora do Git).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'migration', 'backups', 'firebase')
const REPORTS_DIR = path.join(ROOT, 'migration', 'reports')

// resolve firebase-admin a partir de functions/node_modules (não altera dependências do root)
const requireFromFunctions = createRequire(path.join(ROOT, 'functions', 'package.json'))
const admin = requireFromFunctions('firebase-admin')

const KEY_PATH = path.join(ROOT, 'firebase', 'serviceAccountKey.json')
if (!fs.existsSync(KEY_PATH)) {
  console.error(`ERRO: ${KEY_PATH} não encontrado. Export abortado.`)
  process.exit(1)
}

const errors = []
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(REPORTS_DIR, { recursive: true })
function recordError(source, message) {
  errors.push({ source, message: String(message).slice(0, 500) })
  console.error(`  [erro] ${source}: ${String(message).slice(0, 200)}`)
}

admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) })
const db = admin.firestore()
const auth = admin.auth()

// ── serialização fiel (Timestamp/Ref/GeoPoint/Bytes marcados p/ o transform) ──
function serializeValue(v) {
  if (v === null || v === undefined) return v ?? null
  if (v instanceof admin.firestore.Timestamp) {
    return { __type: 'timestamp', _seconds: v.seconds, _nanoseconds: v.nanoseconds }
  }
  if (typeof v === 'object' && typeof v.toDate === 'function' && '_seconds' in v) {
    return { __type: 'timestamp', _seconds: v._seconds, _nanoseconds: v._nanoseconds }
  }
  if (v instanceof admin.firestore.DocumentReference) {
    return { __type: 'ref', path: v.path }
  }
  if (typeof v === 'object' && 'latitude' in v && 'longitude' in v && typeof v.latitude === 'number') {
    return { __type: 'geopoint', latitude: v.latitude, longitude: v.longitude }
  }
  if (Buffer.isBuffer(v)) return { __type: 'bytes', b64: v.toString('base64') }
  if (Array.isArray(v)) return v.map(serializeValue)
  if (typeof v === 'object') {
    const out = {}
    for (const k of Object.keys(v)) out[k] = serializeValue(v[k])
    return out
  }
  return v
}

function writeJson(file, data) {
  const target = path.isAbsolute(file) ? file : path.join(OUT_DIR, file)
  fs.writeFileSync(target, JSON.stringify(data, null, 2))
  return target
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function mask(id) {
  const s = String(id)
  return s.length <= 10 ? `${s[0]}…` : `${s.slice(0, 4)}…${s.slice(-4)}`
}

// ── 1. Firestore: TODAS as collections raiz (sem assumir nomes) ──
console.log('▶ Listando collections raiz do Firestore...')
let collectionRefs
try {
  collectionRefs = await db.listCollections()
} catch (err) {
  console.error('ERRO ao listar collections:', err.message)
  process.exit(2)
}
const collectionNames = collectionRefs.map((c) => c.id)
console.log(`  encontradas: ${collectionNames.join(', ')}`)

const collectionsReport = []

for (const ref of collectionRefs) {
  const name = ref.id
  process.stdout.write(`▶ Exportando "${name}"... `)
  try {
    const snap = await ref.get() // read-only
    const docs = []
    const subcolSampleLimit = 20
    let scanned = 0
    const subcollections = new Set()

    for (const d of snap.docs) {
      docs.push({ __id: d.id, __data: serializeValue(d.data()) })
      // amostragem p/ detectar subcollections (leitura barata e read-only)
      if (scanned < subcolSampleLimit) {
        scanned++
        try {
          const subs = await d.ref.listCollections()
          subs.forEach((s) => subcollections.add(s.id))
        } catch (e) {
          recordError(`subcollections:${name}/${d.id}`, e.message)
        }
      }
    }

    writeJson(`${name}.json`, docs)
    collectionsReport.push({
      name,
      documents: docs.length,
      sampledForSubcollections: scanned,
      subcollections: [...subcollections],
    })
    console.log(`${docs.length} documento(s)` + (subcollections.size ? ` | subcols: ${[...subcollections].join(', ')}` : ''))
  } catch (err) {
    recordError(`export:${name}`, err.message)
    collectionsReport.push({ name, documents: null, error: String(err.message).slice(0, 300) })
  }
}

// ── 2. Firebase Auth: listUsers paginado (SEM passwordHash/salt/token) ──
console.log('▶ Exportando usuários do Firebase Auth...')
let authUsers = []
let pageToken
try {
  do {
    const result = await auth.listUsers(1000, pageToken)
    for (const u of result.users) {
      authUsers.push({
        uid: u.uid,
        email: u.email || '',
        emailVerified: u.emailVerified || false,
        displayName: u.displayName || '',
        photoURL: u.photoURL || '',
        disabled: u.disabled || false,
        providers: (u.providerData || []).map((p) => p.providerId),
        createdAt: u.metadata?.creationTime || null,
        lastSignInTime: u.metadata?.lastSignInTime || null,
      })
    }
    pageToken = result.pageToken
  } while (pageToken)
} catch (err) {
  recordError('auth:listUsers', err.message)
}
writeJson('_auth_users.json', authUsers)
console.log(`  ${authUsers.length} usuário(s) de autenticação`)

// ── 3. Órfãos (Auth ↔ users/{uid}) ──
const usersBackup = collectionsReport.find((c) => c.name === 'users')
let firestoreUids = []
if (usersBackup?.documents > 0) {
  const raw = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'users.json'), 'utf8'))
  firestoreUids = raw.map((d) => d.__id)
}
const authUidSet = new Set(authUsers.map((u) => u.uid))
const firestoreUidSet = new Set(firestoreUids)
const authWithoutDoc = authUsers.filter((u) => !firestoreUidSet.has(u.uid)).map((u) => u.uid)
const docWithoutAuth = firestoreUids.filter((uid) => !authUidSet.has(uid))

// ── 4. Storage: listagem read-only ──
console.log('▶ Listando Firebase Storage...')
const storage = { checked: true, bucketName: null, fileCount: 0, totalBytes: 0, topPrefixes: [], note: '' }
try {
  // bucket explícito: .env → convenções do Firebase
  const envRaw = fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : ''
  const envBucket = envRaw.match(/^VITE_FIREBASE_STORAGE_BUCKET=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
  const projectId = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8')).project_id
  const candidates = [...new Set([envBucket, `${projectId}.firebasestorage.app`, `${projectId}.appspot.com`])].filter(Boolean)

  let files = null
  let lastErr
  for (const bucketName of candidates) {
    try {
      const [f] = await admin.storage().bucket(bucketName).getFiles({ autoPaginate: true })
      files = f
      storage.bucketName = bucketName
      break
    } catch (e) {
      lastErr = e
    }
  }
  if (!files) throw lastErr || new Error('nenhum bucket candidato acessível')

  storage.fileCount = files.length
  const prefixes = new Map()
  for (const f of files) {
    storage.totalBytes += Number(f.metadata.size || 0)
    const top = f.name.split('/')[0] + '/'
    const cur = prefixes.get(top) || { prefix: top, count: 0, bytes: 0 }
    cur.count++
    cur.bytes += Number(f.metadata.size || 0)
    prefixes.set(top, cur)
  }
  storage.topPrefixes = [...prefixes.values()].sort((a, b) => b.count - a.count)
  if (files.length === 0) storage.note = 'bucket acessível e vazio'
} catch (err) {
  storage.checked = false
  storage.note = `não foi possível listar: ${String(err.message).slice(0, 200)}`
  console.warn(`  [aviso] Storage: ${storage.note}`)
}

// ── 5. Manifest (sha256) + relatório ──
const manifest = []
for (const c of collectionsReport) {
  if (c.documents !== null && c.documents !== undefined) {
    const file = path.join(OUT_DIR, `${c.name}.json`)
    manifest.push({ file: `${c.name}.json`, records: c.documents, sha256: sha256(file) })
  }
}
manifest.push({ file: '_auth_users.json', records: authUsers.length, sha256: sha256(path.join(OUT_DIR, '_auth_users.json')) })

const summary = {
  generatedAt: new Date().toISOString(),
  mode: 'READ-ONLY',
  projectId: JSON.parse(fs.readFileSync(KEY_PATH, 'utf8')).project_id,
  totals: {
    collections: collectionNames.length,
    documents: collectionsReport.reduce((s, c) => s + (c.documents || 0), 0),
    authUsers: authUsers.length,
  },
  collections: collectionsReport,
  auth: {
    total: authUsers.length,
    byProvider: authUsers.reduce((acc, u) => {
      const key = u.providers.join('+') || '(sem provider)'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
    verified: authUsers.filter((u) => u.emailVerified).length,
    disabled: authUsers.filter((u) => u.disabled).length,
  },
  orphans: {
    authWithoutDoc: { count: authWithoutDoc.length, uids: authWithoutDoc },
    docWithoutAuth: { count: docWithoutAuth.length, uids: docWithoutAuth },
  },
  storage,
  errors,
  manifest,
}

writeJson(path.join(REPORTS_DIR, 'export-summary.json'), summary)
fs.writeFileSync(path.join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2))
// ── 6. Validação: re-ler todos os arquivos e conferir contagens ──
console.log('\n▶ Validando backup (re-leitura + parse + contagens)...')
let validationOk = true
for (const entry of manifest) {
  const file = path.join(OUT_DIR, entry.file)
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    const count = Array.isArray(parsed) ? parsed.length : -1
    const ok = count === entry.records && sha256(file) === entry.sha256
    console.log(`  ${ok ? '✓' : '✗'} ${entry.file.padEnd(24)} registros=${count} esperado=${entry.records} hash=${ok ? 'ok' : 'DIFERE'}`)
    if (!ok) validationOk = false
  } catch (err) {
    console.log(`  ✗ ${entry.file}: JSON inválido (${err.message})`)
    validationOk = false
  }
}
// ── resumo no console (uids mascarados) ──
console.log('\n════════ RESUMO DO EXPORT ════════')
for (const c of collectionsReport) {
  console.log(`  ${c.name.padEnd(20)} ${c.documents ?? 'ERRO'} doc(s)${c.subcollections?.length ? ' | sub: ' + c.subcollections.join(',') : ''}`)
}
console.log(`  auth_users           ${authUsers.length}`)
console.log(`  órfãos auth→doc:     ${authWithoutDoc.length} (${authWithoutDoc.slice(0, 5).map(mask).join(', ')}${authWithoutDoc.length > 5 ? '...' : ''})`)
console.log(`  órfãos doc→auth:     ${docWithoutAuth.length} (${docWithoutAuth.slice(0, 5).map(mask).join(', ')}${docWithoutAuth.length > 5 ? '...' : ''})`)
console.log(`  storage:             ${storage.checked ? `${storage.fileCount} arquivo(s), ${(storage.totalBytes / 1024).toFixed(1)} KB` : storage.note}`)
console.log(`  erros:               ${errors.length}`)
console.log(`  validação:           ${validationOk ? 'OK ✓' : 'FALHOU ✗'}`)
process.exit(validationOk ? 0 : 3)
