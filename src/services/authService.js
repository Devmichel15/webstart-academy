import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase/firebase.js'
import { createUserProfile, updateLastLogin } from './userService.js'
import { withRetry } from '../utils/retry.js'

const googleProvider = new GoogleAuthProvider()

function mapAuthError(error) {
  const messages = {
    'auth/email-already-in-use': 'Este email já está registrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credenciais inválidas.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  }

  return messages[error.code] || error.message || 'Erro de autenticação.'
}

export async function registerWithEmail({ name, email, password }) {
  return withRetry(async () => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await createUserProfile(credential.user, {
        name,
        provider: 'email',
      })
      return credential.user
    } catch (error) {
      throw new Error(mapAuthError(error))
    }
  })
}

export async function loginWithEmail(email, password) {
  return withRetry(async () => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      await updateLastLogin(credential.user.uid)
      return credential.user
    } catch (error) {
      throw new Error(mapAuthError(error))
    }
  })
}

export async function loginWithGoogle() {
  return withRetry(async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      await createUserProfile(credential.user, {
        name: credential.user.displayName,
        provider: 'google',
      })
      await updateLastLogin(credential.user.uid)
      return credential.user
    } catch (error) {
      throw new Error(mapAuthError(error))
    }
  })
}

export async function logoutUser() {
  await signOut(auth)
}

export async function resetPassword(email) {
  return withRetry(async () => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw new Error(mapAuthError(error))
    }
  })
}

export { onAuthStateChanged } from 'firebase/auth'
