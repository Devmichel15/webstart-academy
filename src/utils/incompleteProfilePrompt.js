/**
 * Quando é que o modal de "falta-te um nome" se lembra do utilizador.
 *
 * A regra `isIncompleteProfileName` é a mesma do resto da app; aqui fica só a
 * política de insistência: o modal é útil, mas não pode ser um modal que
 * persegue alguém a cada clique.
 *
 *   - só se avalia uma vez por sessão (`sessionShownRef` fica no componente);
 *   - "Mais tarde" grava um timestamp e silencia o modal por
 *     `DISMISS_COOLDOWN_MS` — passado esse tempo volta a aparecer;
 *   - guardar o nome limpa o estado: o problema deixou de existir.
 *
 * Módulo separado do componente para não o obrigar a exportar lógica que não
 * é UI.
 */

export const DISMISS_STORAGE_KEY = "webstart:incomplete-profile-dismissed";

/** Tempo de silêncio depois de "Mais tarde". Passado este tempo, volta a aparecer. */
export const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function readDismissedAt(storage) {
  try {
    const raw = storage?.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return null;
    const at = Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    // localStorage pode estar bloqueado (modo privado, iframe, cookies off).
    return null;
  }
}

export function persistDismissedAt(storage, timestamp = Date.now()) {
  try {
    storage?.setItem(DISMISS_STORAGE_KEY, String(timestamp));
  } catch {
    /* perder o cooldown é melhor do que partir a app */
  }
}

export function clearDismissal(storage) {
  try {
    storage?.removeItem(DISMISS_STORAGE_KEY);
  } catch {
    /* idem */
  }
}

export function isInCooldown(dismissedAt, now = Date.now()) {
  if (dismissedAt === null || dismissedAt === undefined) return false;
  return now - dismissedAt < DISMISS_COOLDOWN_MS;
}
