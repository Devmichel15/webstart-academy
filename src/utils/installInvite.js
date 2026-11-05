/**
 * Convite de instalação do PWA — preferências do utilizador no dispositivo.
 *
 * Onde vive o estado (e porquê):
 *
 *  - `localStorage`: preferências do DISPOSITIVO. O `localStorage` NÃO é
 *    sincronizado entre dispositivos — o mesmo aluno pode voltar a ver o
 *    convite no telemóvel depois de o ter recusado no computador. É o
 *    comportamento pretendido: a instalação é local ao dispositivo.
 *  - Sem tabelas nem migrações: isto é estado de interface, não de conta. O
 *    servidor fica livre para receber, mais tarde, a preferência de notificações
 *    (que essa sim é de conta e vai exigir coluna própria).
 *
 * Chaves (prefixo `webstart-pwa-`):
 *   - `install-dismissed`     → o utilizador já recusou o convite.
 *   - `install-invited`       → o utilizador (por `id`) já viu o convite de
 *                               boas-vindas. Evita repetir o convite mesmo que
 *                               o utilizador não tenha clicado em nada.
 *   - `registration-pending`  → conta acabada de criar. Guarda o `id` da conta
 *                               para que outra conta usada no mesmo dispositivo
 *                               não herde o convite.
 *
 * Tudo o que toca em `storage` está protegido: em modo privado / cookies
 * bloqueados o acesso pode lançar, e um convite de instalação nunca deve
 * partir a aplicação.
 */

export const INSTALL_DISMISSED_KEY = "webstart-pwa-install-dismissed";
export const INSTALL_INVITED_KEY = "webstart-pwa-install-invited";
export const REGISTRATION_PENDING_KEY = "webstart-pwa-registration-pending";

function getStorage(kind) {
  try {
    if (typeof window === "undefined") return null;
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // acesso ao storage bloqueado (cookies desativados, modo privado estrito)
    return null;
  }
}

function readItem(kind, key) {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeItem(kind, key, value) {
  try {
    getStorage(kind)?.setItem(key, value);
  } catch {
    // quota cheia / storage bloqueado: seguimos sem persistir
  }
}

function removeItem(kind, key) {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // idem
  }
}

// ─── Recusa do convite ─────────────────────────────────────────────────────

/** O utilizador já disse "não quero instalar" neste dispositivo? */
export function isInstallDismissed() {
  return readItem("local", INSTALL_DISMISSED_KEY) === "true";
}

/** Regista a recusa. Silencioso: voltar a convidar é decisão do produto. */
export function markInstallDismissed() {
  writeItem("local", INSTALL_DISMISSED_KEY, "true");
}

/** Limpa a recusa (ex.: depois de uma instalação concluída). */
export function clearInstallDismissal() {
  removeItem("local", INSTALL_DISMISSED_KEY);
}

// ─── Convite já apresentado ───────────────────────────────────────────────

/**
 * Já mostrámos o convite de boas-vindas a este utilizador?
 *
 * `@param {string | null | undefined} userId` id da conta (Supabase auth uid).
 */
export function hasBeenInvited(userId) {
  const key = userId || "anonymous";
  return readItem("local", INSTALL_INVITED_KEY) === key;
}

/** Marca o convite como apresentado para esta conta. */
export function markInvited(userId) {
  writeItem("local", INSTALL_INVITED_KEY, userId || "anonymous");
}

// ─── Registo pendente ─────────────────────────────────────────────────────

/** Janela (ms) em que uma conta é considerada "recém-criada". */
export const FRESH_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/** Desvio de relógio tolerado entre o browser e o servidor (ms). */
export const FRESH_ACCOUNT_TOLERANCE_MS = 60 * 1000;

/**
 * Validade do registo pendente (ms).
 *
 * No fluxo por email a conta só fica autenticada depois de o utilizador
 * confirmar o e-mail, o que pode demorar horas — por isso a janela é larga.
 * Passado esse tempo o sinal já não significa "conta nova" e o convite de
 * boas-vindas deixa de fazer sentido.
 */
export const REGISTRATION_PENDING_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Regista que acabou de ser criada uma conta.
 *
 * @param {string | null} userId id da conta criada. Com `null` (OAuth, onde o
 *   id só é conhecido depois do redireccionamento) o convite fica associado a
 *   "qualquer conta autenticada nesta sessão".
 */
export function markRegistrationPending(userId = null) {
  writeItem(
    "local",
    REGISTRATION_PENDING_KEY,
    JSON.stringify({ userId: userId || null, at: Date.now() }),
  );
}

/**
 * Lê o registo pendente.
 *
 * @returns {{ userId: string | null, at: number } | null}
 */
export function readRegistrationPending() {
  const raw = readItem("local", REGISTRATION_PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      userId: parsed.userId ?? null,
      at: Number(parsed.at) || 0,
    };
  } catch {
    return null;
  }
}

/** Limpa o registo pendente (o convite já foi tratado). */
export function clearRegistrationPending() {
  removeItem("local", REGISTRATION_PENDING_KEY);
}

/**
 * O registo pendente pertence a esta conta?
 *
 * - `userId` conhecido → tem de ser a mesma conta.
 * - `userId` desconhecido (OAuth, onde o id só é conhecido depois do
 *   redireccionamento) → só conta se a conta for mesmo nova.
 *
 * @param {{ userId: string | null, at: number } | null} pending
 * @param {{ id?: string, created_at?: string } | null | undefined} user
 */
export function registrationPendingMatches(pending, user) {
  if (!pending || !user?.id) return false;
  if (pending.userId) {
    if (pending.userId !== user.id) return false;
    // O sinal não é eterno: depois de um dia já não é um registo "novo".
    return Date.now() - pending.at <= REGISTRATION_PENDING_TTL_MS;
  }
  return isFreshlyCreatedAccount(user);
}

/**
 * A conta foi criada há pouco?
 *
 * Usado no fluxo OAuth, onde o `id` da conta só é conhecido depois de o
 * browser voltar do Google. Um utilizador que já tinha conta Google não deve
 * receber o convite de boas-vindas só por ter entrado.
 *
 * Sem `created_at` não há como distinguir: assume-se conta nova (o convite é
 * de boas-vindas, nunca um bloqueio).
 */
export function isFreshlyCreatedAccount(user, now = Date.now()) {
  const created = Date.parse(user?.created_at || "");
  if (Number.isNaN(created)) return true;
  const age = now - created;
  // Tolera um pequeno desvio de relógio entre o cliente e o servidor.
  return age > -FRESH_ACCOUNT_TOLERANCE_MS && age < FRESH_ACCOUNT_WINDOW_MS;
}
