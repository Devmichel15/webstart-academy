import { supabase } from '../lib/supabase.js'

export const POST_IMAGES_BUCKET = 'project-images'
export const POST_IMAGES_MAX = 4
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
export const POST_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function imageExtension(type) {
  return EXT_BY_TYPE[type] || 'jpg'
}

/** Devolve mensagem de erro (PT) ou null se o ficheiro é aceitável. */
export function validateImageFile(file) {
  if (!file || typeof file !== 'object') return 'Ficheiro inválido.'
  if (!POST_IMAGE_TYPES.includes(file.type)) {
    return 'Formato não suportado. Usa JPEG, PNG ou WebP.'
  }
  if (typeof file.size === 'number' && file.size > POST_IMAGE_MAX_BYTES) {
    return 'A imagem excede o limite de 5 MB.'
  }
  return null
}

export function buildImagePath(profileId, projectId, position, file) {
  return `${profileId}/${projectId}/${position}-${crypto.randomUUID()}.${imageExtension(file.type)}`
}

export async function uploadProjectImage({ profileId, projectId, file, position }) {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)

  const path = buildImagePath(profileId, projectId, position, file)
  const { error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error
  return path
}

/**
 * Envia vários ficheiros em paralelo. Se algum falhar, remove os já
 * enviados (compensação) e lança o erro original.
 */
export async function uploadProjectImages({ profileId, projectId, files }) {
  const list = (files || []).filter(Boolean)
  if (!list.length) return []

  const results = await Promise.allSettled(
    list.map((file, index) =>
      uploadProjectImage({ profileId, projectId, file, position: index }),
    ),
  )

  const uploaded = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
  const failure = results.find((result) => result.status === 'rejected')

  if (failure) {
    await removeProjectImages(uploaded)
    throw failure.reason
  }
  return uploaded
}

/** Remoção best-effort: nunca lança (falhas de limpeza não podem perder o dado da BD). */
export async function removeProjectImages(paths) {
  const list = (paths || []).filter(Boolean)
  if (!list.length) return false
  try {
    const { error } = await supabase.storage.from(POST_IMAGES_BUCKET).remove(list)
    return !error
  } catch {
    return false
  }
}

export function projectImageUrl(path) {
  if (!path) return ''
  return supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}
