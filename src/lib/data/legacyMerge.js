// ═══════════════════════════════════════════════════════════════
// WebStart Academy — camada de merge de LEITURA (estratégia híbrida).
//
// Regra do jogo (aprovada no planeamento):
//   - Escrita: 100% Supabase. NUNCA escrever novo dado no Firebase.
//   - Leitura: dados migrados vêm do Supabase; o histórico que ainda só
//     existe no Firebase (Firestore `users/{legacyUid}`) é lido AQUI,
//     de forma centralizada — nunca espalhada pelas telas.
//   - O join de identidade é feito por `legacy_firebase_uid`, nunca por email.
//   - Entidades em modo 'merge' são temporárias: devem ser revalidadas
//     em docs/migration/dual-backend-status.md e desligadas após o backfill
//     dos deltas (scripts/migration/import-delta.mjs --run).
//   - A leitura legada é opcional: só ativa com VITE_ENABLE_FIREBASE_LEGACY_READ
//     e degrada de forma silenciosa (warn) em caso de erro/rules.
//
// ⚠ CONSTRAINT (importante): `firebase/firestore.rules` exige `request.auth`
// (Firebase Auth) para ler `users/{userId}`, e a app nova só usa Supabase Auth.
// Logo, a leitura SDK no browser está BLOQUEADA pelas rules e cai sempre em
// degrade. O caminho operável é um reader SERVIDOR (ex.: Supabase Edge Function
// com firebase-admin), injetável via setLegacyReader() ou VITE_LEGACY_READ_URL.
// ═══════════════════════════════════════════════════════════════

export const MERGE_MODES = {
  LESSON_PROGRESS: { entity: 'lesson_progress', mode: 'merge' },
  COURSE_COMPLETIONS: { entity: 'course_completions', mode: 'merge' },
  QUIZ_COMPLETIONS: { entity: 'quiz_completions', mode: 'merge' },
  LEARNING_PROFILES: { entity: 'learning_profiles', mode: 'supabase-only' },
  PROFILES: { entity: 'profiles', mode: 'supabase-only' },
  COMMUNITY: { entity: 'community_projects', mode: 'supabase-only' },
  ACHIEVEMENTS: { entity: 'user_achievements', mode: 'supabase-only' },
}

const LEGACY_READ_FLAG = import.meta.env.VITE_ENABLE_FIREBASE_LEGACY_READ === 'true'
const LEGACY_READ_URL = import.meta.env.VITE_LEGACY_READ_URL || null
const CACHE_TTL_MS = 5 * 60 * 1000

const docCache = new Map()
let inflight = null

let customReader = null

export function setLegacyReader(fn) {
  customReader = typeof fn === 'function' ? fn : null
}

const mergeStats = {
  enabled: LEGACY_READ_FLAG,
  reads: 0,
  cacheHits: 0,
  errors: 0,
  lastError: null,
}

export function isMergeMode(entity) {
  const entry = MERGE_MODES[entity]
  return entry ? entry.mode === 'merge' : false
}

export function isLegacyReadEnabled() {
  return LEGACY_READ_FLAG
}

export function getLegacyUidFromAuth(user) {
  return user?.user_metadata?.legacy_firebase_uid || user?.app_metadata?.legacy_firebase_uid || null
}

export function getLegacyUid(user, profileRow) {
  const fromProfile = profileRow?.legacy_firebase_uid || profileRow?.legacyFirebaseUid || null
  return fromProfile || getLegacyUidFromAuth(user) || null
}

export function getMergeStats() {
  return { ...mergeStats }
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

async function serverReader() {
  const { supabase } = await import('../supabase.js')
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) return null

  const res = await fetch(LEGACY_READ_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`legacy-read HTTP ${res.status}`)
  const body = await res.json()
  return body?.completions || null
}

async function fetchLegacyUserDoc(legacyUid) {
  if (!LEGACY_READ_FLAG) return null
  if (customReader) return customReader(legacyUid)
  if (LEGACY_READ_URL) return serverReader()

  const { db } = await import('../../firebase/firebase.js')
  const { doc, getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, 'users', legacyUid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    completedLessons: Array.isArray(d.completedLessons) ? d.completedLessons : [],
    completedCourses: Array.isArray(d.completedCourses) ? d.completedCourses : [],
    completedQuizzes: Array.isArray(d.completedQuizzes) ? d.completedQuizzes : [],
    xp: typeof d.xp === 'number' ? d.xp : null,
    streak: typeof d.streak === 'number' ? d.streak : null,
    totalStudyTime: typeof d.totalStudyTime === 'number' ? d.totalStudyTime : null,
  }
}

export async function readLegacyCompletions(legacyUid) {
  if (!legacyUid || !LEGACY_READ_FLAG) return null

  const cached = docCache.get(legacyUid)
  if (cached && Date.now() < cached.expiresAt) {
    mergeStats.cacheHits++
    return cached.data
  }

  if (inflight) return inflight

  inflight = (async () => {
    try {
      const data = await fetchLegacyUserDoc(legacyUid)
      mergeStats.reads++
      docCache.set(legacyUid, { data, expiresAt: Date.now() + CACHE_TTL_MS })
      return data
    } catch (err) {
      mergeStats.errors++
      mergeStats.lastError = err?.message || String(err)
      console.warn('[legacyMerge] leitura legada indisponível (degraded):', err?.message || err)
      docCache.set(legacyUid, { data: null, expiresAt: Date.now() + CACHE_TTL_MS })
      return null
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function mergeCompletions(supabaseCompletions = {}, legacyCompletions = null) {
  const merged = {
    completedLessons: [...(supabaseCompletions.completedLessons || [])],
    completedCourses: [...(supabaseCompletions.completedCourses || [])],
    completedQuizzes: [...(supabaseCompletions.completedQuizzes || [])],
  }

  if (!legacyCompletions) return merged

  if (isMergeMode('LESSON_PROGRESS')) {
    merged.completedLessons = unique([...merged.completedLessons, ...(legacyCompletions.completedLessons || [])])
  }
  if (isMergeMode('COURSE_COMPLETIONS')) {
    merged.completedCourses = unique([...merged.completedCourses, ...(legacyCompletions.completedCourses || [])])
  }
  if (isMergeMode('QUIZ_COMPLETIONS')) {
    merged.completedQuizzes = unique([...merged.completedQuizzes, ...(legacyCompletions.completedQuizzes || [])])
  }

  return merged
}