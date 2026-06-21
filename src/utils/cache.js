const CACHE_PREFIX = 'webstart-cache:'

export function getCache(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setCache(key, value) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value))
  } catch {
    // cache is optional
  }
}

export function clearCache(key) {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`)
}
