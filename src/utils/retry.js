const NETWORK_RETRYABLE_PATTERN =
  /failed to fetch|network error|network request failed|fetch failed|load failed|timed out|timeout|ECONNRESET|socket hang up/i;

function isRetryableStatus(status) {
  if (status === undefined || status === null) return true;
  if (status >= 500) return true;
  return status === 429;
}

function isNetworkFailure(error) {
  if (!error || typeof error !== "object") return false;
  if (error instanceof TypeError || error?.name === "TypeError") return true;
  if (/AuthRetryableFetchError|AuthRetryableFetch/i.test(error?.name || "")) {
    return true;
  }
  return NETWORK_RETRYABLE_PATTERN.test(String(error?.message || ""));
}

export function isPermanentError(error) {
  if (!error || typeof error !== "object") return false;
  if (isNetworkFailure(error)) return false;

  // erros PostgreSQL viram PostgrestError com `.code` (ex.: 23503, 42501)
  if (typeof error?.code === "string" && /^\d{5}$/.test(error.code)) {
    return true;
  }
  // erros PostgREST (PGRST...) também são permanentes
  if (typeof error?.code === "string" && /^PGRST/i.test(error.code)) {
    return true;
  }
  if (typeof error?.status === "number") {
    return !isRetryableStatus(error.status);
  }
  return false;
}

export async function withRetry(fn, { maxAttempts = 3, delayMs = 1000 } = {}) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (isPermanentError(error)) throw error
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError
}
