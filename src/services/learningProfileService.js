import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { withRetry } from '../utils/retry.js'

export async function getLearningProfile(uid) {
  if (!uid) return null
  return withRetry(async () => {
    const docRef = doc(db, 'learning_profiles', uid)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
    return null
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
    const docRef = doc(db, 'learning_profiles', uid)

    const payload = {
      assessment: {
        ...assessment,
        answeredAt: serverTimestamp(),
      },
      roadmap: {
        ...roadmap,
        generatedAt: serverTimestamp(),
      },
      metadata: {
        completed: true,
        version: 1,
        source,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    }

    await setDoc(docRef, payload, { merge: true })
    return payload
  })
}
