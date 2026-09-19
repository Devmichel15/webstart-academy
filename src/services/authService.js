import { supabase } from '../lib/supabase.js'

const NETWORK_FAILURE_PATTERN =
  /failed to fetch|networkerror|network request failed|fetch failed|load failed/i

const OFFLINE_MESSAGE =
  'Estás sem ligação. Verifica a tua internet e tenta novamente.'
const SERVER_UNREACHABLE_MESSAGE =
  'Não foi possível contactar o servidor. Tenta novamente em instantes.'

function isNetworkFailure(error) {
  if (!error || typeof error !== 'object') return false
  if (error instanceof TypeError || error?.name === 'TypeError') return true
  if (/AuthRetryableFetchError|AuthRetryableFetch/i.test(error?.name || '')) {
    return true
  }
  return NETWORK_FAILURE_PATTERN.test(String(error?.message || ''))
}

function isBackendRejection(error) {
  if (error?.status !== undefined || error?.code !== undefined) return true
  const msg = String(error?.message || '')
  return msg && !NETWORK_FAILURE_PATTERN.test(msg)
}

function mapAuthError(error) {
  if (isNetworkFailure(error)) {
    const online =
      typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    return online ? SERVER_UNREACHABLE_MESSAGE : OFFLINE_MESSAGE
  }

  const messages = {
    'auth/email-already-in-use': 'Este email já está registrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credenciais inválidas.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/redirect-cancelled-by-user': 'Login cancelado.',
    'auth/redirect-operation-pending': 'Redirecionamento em andamento.',
    'AuthApiError': error.message || 'Erro de autenticação.',
    'invalid_credentials': 'Email ou senha incorretos.',
  }

  const msg = String(error?.message || '')
  if (/\binvalid login credentials\b/i.test(msg)) {
    return 'Email ou senha incorretos.'
  }
  if (/\buser already registered\b/i.test(msg)) {
    return 'Este email já está registrado.'
  }

  if (isBackendRejection(error)) {
    return messages[error?.code] || error?.message || 'Erro de autenticação.'
  }

  return SERVER_UNREACHABLE_MESSAGE
}

export async function registerWithEmail({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, provider: 'email' },
    },
  })
  if (error) throw new Error(mapAuthError(error))
  return data.user
}

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(mapAuthError(error))
  return data.user
}

export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
  if (error) throw new Error(mapAuthError(error))
  return data
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  if (error) throw new Error(mapAuthError(error))
}

export function onAuthStateChanged(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session?.user || null)
    }
  )
  return () => subscription.unsubscribe
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
