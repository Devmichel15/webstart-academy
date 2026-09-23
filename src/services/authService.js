import { supabase } from "../lib/supabase.js";
import { toUserMessage } from "../utils/errors.js";

const NETWORK_FAILURE_PATTERN =
  /failed to fetch|networkerror|network request failed|fetch failed|load failed/i;

const OFFLINE_MESSAGE =
  "Estás sem ligação. Verifica a tua internet e tenta novamente.";
const SERVER_UNREACHABLE_MESSAGE =
  "Não foi possível contactar o servidor. Tenta novamente em instantes.";
const PUBLIC_APP_URL = (
  import.meta.env.DEV
    ? window.location.origin
    : import.meta.env.VITE_PUBLIC_APP_URL ||
      "https://webstart-academy.onrender.com"
).replace(/\/$/, "");

function isNetworkFailure(error) {
  if (!error || typeof error !== "object") return false;
  if (error instanceof TypeError || error?.name === "TypeError") return true;
  if (/AuthRetryableFetchError|AuthRetryableFetch/i.test(error?.name || "")) {
    return true;
  }
  return NETWORK_FAILURE_PATTERN.test(String(error?.message || ""));
}

function isBackendRejection(error) {
  if (error?.status !== undefined || error?.code !== undefined) return true;
  const msg = String(error?.message || "");
  return msg && !NETWORK_FAILURE_PATTERN.test(msg);
}

function mapAuthError(error, operation) {
  if (isNetworkFailure(error)) {
    const online =
      typeof navigator !== "undefined" ? navigator.onLine !== false : true;
    console.warn("[auth] request failed", {
      operation,
      endpoint: `Supabase Auth ${operation}`,
      errorName: error?.name || "UnknownError",
      errorMessage: error?.message || String(error),
      online,
    });
    return online ? SERVER_UNREACHABLE_MESSAGE : OFFLINE_MESSAGE;
  }

  const messages = {
    "auth/email-already-in-use": "Este email já está registrado.",
    "auth/invalid-email": "Email inválido.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "Credenciais inválidas.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/redirect-cancelled-by-user": "Login cancelado.",
    "auth/redirect-operation-pending": "Redirecionamento em andamento.",
    AuthApiError: toUserMessage(error, "Erro de autenticação."),
    invalid_credentials: "Email ou senha incorretos.",
  };

  const msg = String(error?.message || "");
  if (/\binvalid login credentials\b/i.test(msg)) {
    return "Email ou senha incorretos.";
  }
  if (/\buser already registered\b/i.test(msg)) {
    return "Este email já está registrado.";
  }

  if (isBackendRejection(error)) {
    const mapped = messages[error?.code];
    if (mapped) return mapped;
    return toUserMessage(error, "Erro de autenticação.");
  }

  return SERVER_UNREACHABLE_MESSAGE;
}

export async function registerWithEmail({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, provider: "email" },
    },
  });
  if (error) throw new Error(mapAuthError(error, "signup"));
  return data.user;
}

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(mapAuthError(error, "login"));
  return data.user;
}

export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${PUBLIC_APP_URL}/`,
    },
  });
  if (error) throw new Error(mapAuthError(error, "oauth"));
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${PUBLIC_APP_URL}/login`,
  });
  if (error) throw new Error(mapAuthError(error, "password-reset"));
}

export function onAuthStateChanged(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
  return () => subscription.unsubscribe();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
