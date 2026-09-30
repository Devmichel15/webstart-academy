import { supabase } from '../lib/supabase.js'
import { resolveProfileId } from './userService.js'
import { withRetry } from '../utils/retry.js'

function mapLearningProfileRow(row) {
  if (!row) return null
  return {
    id: row.user_id,
    assessment: row.assessment,
    roadmap: row.roadmap,
    metadata: row.metadata,
    // Coluna canónica declarada em 001_initial_schema.sql. `metadata.completed`
    // é apenas um espelho e não existia em registos antigos, por isso ler só
    // uma das duas fazia o assessment parecer por concluir.
    completed: row.completed === true,
    source: row.source ?? null,
  }
}

/**
 * Um assessment só conta como submetido se tiver `answeredAt` — é a marca que
 * `saveFullLearningProfile` grava. Um objeto `assessment` com respostas
 * parciais (ex.: `{ experience: 'know_basics' }`) é um rascunho, não um
 * onboarding concluído.
 */
function hasSubmittedAssessment(assessment) {
  if (!assessment || typeof assessment !== 'object') return false
  return Boolean(assessment.answeredAt)
}

export async function getLearningProfile(uid) {
  if (!uid) return null
  return withRetry(async () => {
    // `learning_profiles.user_id` referencia `profiles.id`, que para
    // utilizadores migrados NÃO é o auth uid. Sem resolver, a leitura falha.
    const profileId = await resolveProfileId(uid)
    if (!profileId) return null

    const { data, error } = await supabase
      .from('learning_profiles')
      .select('*')
      .eq('user_id', profileId)
      .maybeSingle()

    if (error) throw error
    return data ? mapLearningProfileRow(data) : null
  })
}

export async function isAssessmentCompleted(uid) {
  if (!uid) return false
  try {
    return (await getAssessmentStatus(uid)) === true
  } catch (err) {
    console.error('[learningProfileService] Error checking completion:', err)
    return false
  }
}

/**
 * Estado do assessment em três valores:
 *   `true`  — concluído;
 *   `false` — não concluído (verificado);
 *   `null`  — não foi possível verificar (erro de rede/RLS).
 *
 * `isAssessmentCompleted` colapsa os três em booleano e um `false` de falha
 * ficava indistinguível de "por fazer", o que fazia o guard mandar o utilizador
 * refazer o assessment sempre que a rede falhasse.
 */
export async function getAssessmentStatus(uid) {
  if (!uid) return false
  const profile = await getLearningProfile(uid)
  if (!profile) return false
  return Boolean(
    profile.completed ||
      profile.metadata?.completed ||
      hasSubmittedAssessment(profile.assessment),
  )
}

export async function saveFullLearningProfile(uid, { assessment, roadmap, source = 'signup' }) {
  if (!uid) throw new Error('UID is required to save learning profile')

  // A FK `learning_profiles.user_id -> profiles.id` falha com 23503 se
  // gravarmos o auth uid num perfil migrado cujo id é outro.
  const profileId = await resolveProfileId(uid)
  if (!profileId) throw new Error('Profile not found for learning profile save')

  return withRetry(async () => {
    const now = new Date().toISOString()
    const payload = {
      user_id: profileId,
      completed: true,
      source,
      assessment: {
        ...assessment,
        answeredAt: now,
      },
      roadmap: {
        ...roadmap,
        generatedAt: now,
      },
      metadata: {
        completed: true,
        version: 1,
        source,
        createdAt: now,
        updatedAt: now,
      },
    }

    const { error } = await supabase
      .from('learning_profiles')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) throw error
    return payload
  })
}
