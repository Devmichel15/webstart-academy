// ARCHIVE: authService.js
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase.js";
import { createUserProfile, updateLastLogin } from "./userService.js";
import { withRetry } from "../utils/retry.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" }); // Melhora UX

function mapAuthError(error) {
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
  };
  return messages[error.code] || error.message || "Erro de autenticação.";
}

export async function registerWithEmail({ name, email, password }) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await createUserProfile(credential.user, {
      name,
      provider: "email",
    });
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function loginWithEmail(email, password) {
  return withRetry(async () => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateLastLogin(credential.user.uid);
      return credential.user;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  });
}

/**
 * Inicia o login com Google via Redirect
 */
export async function loginWithGoogle() {
  return withRetry(async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;

      await createUserProfile(user, {
        name: user.displayName,
        provider: "google",
      });

      return user;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  });
}

/**
 * Nova função: deve ser chamada após o redirecionamento voltar
 */
export async function handleRedirectResult() {
  return withRetry(async () => {
    try {
      const result = await getRedirectResult(auth);

      if (!result) return null; // Nenhum redirecionamento pendente

      const user = result.user;

      await createUserProfile(user, {
        name: user.displayName,
        provider: "google",
      });

      await updateLastLogin(user.uid);

      return user;
    } catch (error) {
      // Ignora erro "no redirect result" (comum na primeira carga)
      if (error.code === "auth/no-redirect-result") {
        return null;
      }
      throw new Error(mapAuthError(error));
    }
  });
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  return withRetry(async () => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  });
}

export { onAuthStateChanged } from "firebase/auth";
