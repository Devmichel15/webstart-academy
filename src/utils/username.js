export function slugifyUsername(name = '') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'aluno'
}

export function generateUniqueUsername(name, uid) {
  const base = slugifyUsername(name)
  const suffix = uid.slice(-4)
  return `${base}-${suffix}`
}

export function getPublicProfileUrl(username) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://webstart.app'
  return `${base}/u/${username}`
}
