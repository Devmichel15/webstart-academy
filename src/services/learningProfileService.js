import { supabase } from '../lib/supabase.js'
import { withRetry } from '../utils/retry.js'

function mapLearningProfileRow(row) {
  if (!row) return null
  return {
    id: row.user_id,
    assessment: row.assessment,
    roadmap: row.roadmap,
    metadata: row.metadata,
  }
}

export async function getLearningProfile(uid) {
  if (!uid) return null
  return withRetry(async () => {
    const { data } = await supabase
      .from('learning_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()

    return data ? mapLearningProfileRow(data) : null
  })
}

export async function isAssessmentCompleted(uid) {
  if (!uid) return false
  try {
    const profile = await getLearningProfile(uid)
    return Boolean(profile?.metadata?.completed)
  } catch (err) {
    console.error('[learningProfileService] Error checking completion:', err)
    return false
  }
}

export async function saveFullLearningProfile(uid, { assessment, roadmap, source = 'signup' }) {
  if (!uid) throw new Error('UID is required to save learning profile')

  return withRetry(async () => {
    const now = new Date().toISOString()
    const payload = {
      user_id: uid,
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
