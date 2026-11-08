import { supabase } from "../lib/supabase.js";

const SYNCED_PREFIX = "webstart-pwa-installed-synced:";

/**
 * A instalação é local ao dispositivo, por isso o "já sincronizei" também é.
 * Sem esta guarda, cada arranque da app instalada faria um UPDATE à toa; a RPC
 * é idempotente, mas não vale a pena a viagem.
 */
function hasSynced(uid) {
  try {
    return window.localStorage.getItem(`${SYNCED_PREFIX}${uid}`) === "1";
  } catch {
    return false;
  }
}

function markSynced(uid) {
  try {
    window.localStorage.setItem(`${SYNCED_PREFIX}${uid}`, "1");
  } catch {
    // storage bloqueado/modo privado: no pior caso repete no próximo arranque
  }
}

/** Plataforma tal como o InstallContext a conhece (`device`). */
export function platformLabel(device = {}) {
  if (device.ios) return "ios";
  if (device.android) return "android";
  return "desktop";
}

/**
 * Regista que a conta tem a app instalada.
 *
 * Só deve ser chamado quando há mesmo um sinal de instalação (app em
 * standalone ou evento `appinstalled`). A RPC resolve a linha canónica do
 * perfil, por isso funciona também para perfis migrados (`id !== auth.uid()`).
 *
 * @param {string} uid auth uid do utilizador com sessão.
 * @param {string | null} platform `ios` | `android` | `desktop`.
 * @returns {Promise<{ synced: boolean, reason?: string }>}
 */
export async function syncAppInstalled(uid, platform = null) {
  if (!uid) return { synced: false, reason: "no-user" };
  if (hasSynced(uid)) return { synced: false, reason: "already-synced" };

  const { error } = await supabase.rpc("mark_app_installed", {
    p_platform: platform || null,
  });
  if (error) throw error;

  markSynced(uid);
  return { synced: true };
}
