/**
 * Fonte única das regras de "cadastro completo" do perfil.
 *
 * O sintoma original: utilizadores apareciam como "Aluno WebStart" no top 10
 * semanal. A regra "isto é um cadastro incompleto?" vivia em três sítios
 * e divergia:
 *   - `supabase/migrations/001_initial_schema.sql` (default da coluna);
 *   - `resolveDisplayName()` em `services/userService.js` (fallback JS);
 *   - `Ranking.jsx` (`entry.name || "Aluno WebStart"`).
 *
 * Passa a viver aqui, e o espelho SQL em
 * `public.is_incomplete_profile_name(text)` (supabase/migrations/017).
 * Os dois lados são comparados por `src/test/profileValidation.test.js`, que
 * lê o .sql e falha se os literais deixarem de bater certo.
 */

/** Default histórico. Tem de bater certo com a constante SQL `DEFAULT_PROFILE_NAME`. */
export const DEFAULT_PROFILE_NAME = 'Aluno WebStart'

/** O que se mostra quando o cadastro está incompleto. Tem de bater certo com `ANONYMOUS_DISPLAY_NAME` em SQL. */
export const ANONYMOUS_DISPLAY_NAME = 'Aluno anónimo'

export const NAME_MIN = 2
export const NAME_MAX = 60
export const BIO_MAX = 500
export const PASSWORD_MIN = 8

export function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function nameKey(value) {
  return normalizeName(value).toLowerCase()
}

/** `true` para "Aluno WebStart", " aluno   webstart " ou "ALUNO WEBSTART". */
export function isDefaultProfileName(value) {
  return nameKey(value) === nameKey(DEFAULT_PROFILE_NAME)
}

/**
 * Regra única de cadastro incompleto: `name` null, vazio/só espaços, ou igual
 * ao default histórico.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIncompleteProfileName(value) {
  const name = normalizeName(value)
  if (!name) return true
  return isDefaultProfileName(name)
}

/**
 * Valida e normaliza o nome. Devolve `{ valid, value, error }` — `value` só
 * faz sentido quando `valid`, e é o que deve ser gravado (trim + espaços
 * colapsados).
 */
export function validateProfileName(value) {
  const name = normalizeName(value)

  if (!name) {
    return { valid: false, value: null, error: 'O nome é obrigatório.' }
  }
  if (isDefaultProfileName(name)) {
    return {
      valid: false,
      value: null,
      error: 'Escolhe um nome próprio — "Aluno WebStart" não pode ser usado.',
    }
  }
  if (name.length < NAME_MIN) {
    return {
      valid: false,
      value: null,
      error: `O nome deve ter pelo menos ${NAME_MIN} caracteres.`,
    }
  }
  if (name.length > NAME_MAX) {
    return {
      valid: false,
      value: null,
      error: `O nome deve ter no máximo ${NAME_MAX} caracteres.`,
    }
  }

  return { valid: true, value: name, error: null }
}

export function normalizeUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  try {
    const url = new URL(normalizeUrl(trimmed))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Valida a troca de senha. Só composição — confirmar que a senha ATUAL está
 * certa exige o servidor (`changePassword` em `services/authService.js`).
 *
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validatePasswordChange({ currentPassword, newPassword, confirmPassword } = {}) {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'A senha atual é obrigatória.'
  }
  if (!newPassword) {
    errors.newPassword = 'Escreve a nova senha.'
  } else if (newPassword.length < PASSWORD_MIN) {
    errors.newPassword = `A nova senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma a nova senha.'
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
