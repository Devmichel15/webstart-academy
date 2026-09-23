import { supabase } from '../lib/supabase.js'
import { resolveProfileId } from './userService.js'

export const FEED_PAGE_SIZE = 9
export const TITLE_MIN = 3
export const TITLE_MAX = 120
export const DESCRIPTION_MIN = 10
export const DESCRIPTION_MAX = 2000
export const COMMENT_MAX = 1000
export const TAGS_MAX = 8

const authorCache = new Map()

function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export function isValidUrl(value) {
  if (!value || typeof value !== 'string') return false
  if (value.length < 8 || value.length > 2048) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeTag(tag) {
  return String(tag)
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function parseTags(input) {
  const seen = new Set()
  const tags = []
  String(input || '')
    .split(',')
    .forEach((raw) => {
      const tag = normalizeTag(raw)
      if (tag.length >= 2 && tag.length <= 24 && !seen.has(tag)) {
        seen.add(tag)
        tags.push(tag)
      }
    })
  return tags.slice(0, TAGS_MAX)
}

export function validateProjectForm({ title, description, projectUrl, githubUrl, tags }) {
  const errors = {}

  if (!title || title.trim().length < TITLE_MIN || title.trim().length > TITLE_MAX) {
    errors.title = `O título deve ter entre ${TITLE_MIN} e ${TITLE_MAX} caracteres.`
  }
  if (!description || description.trim().length < DESCRIPTION_MIN || description.trim().length > DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter entre ${DESCRIPTION_MIN} e ${DESCRIPTION_MAX} caracteres.`
  }
  if (projectUrl && !isValidUrl(projectUrl)) {
    errors.projectUrl = 'URL inválida. Exemplo: https://meu-projeto.vercel.app'
  }
  if (githubUrl && !isValidUrl(githubUrl)) {
    errors.githubUrl = 'URL inválida. Exemplo: https://github.com/utilizador/repo'
  }
  if (!(projectUrl && projectUrl.trim()) && !(githubUrl && githubUrl.trim())) {
    errors.links = 'Informe pelo menos um link: projeto ou GitHub.'
  }
  if ((tags || []).some((tag) => tag.length < 2 || tag.length > 24)) {
    errors.tags = 'Cada tag deve ter entre 2 e 24 caracteres.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

function buildProjectData(form) {
  const data = {
    title: form.title.trim(),
    description: form.description.trim(),
    tags: parseTags(form.tags),
  }
  const projectUrl = form.projectUrl && form.projectUrl.trim()
  const githubUrl = form.githubUrl && form.githubUrl.trim()
  if (projectUrl) data.project_url = projectUrl
  if (githubUrl) data.github_url = githubUrl
  return data
}

function mapProjectFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags || [],
    projectUrl: row.project_url,
    githubUrl: row.github_url,
    authorId: row.author_id,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapProjectToDb(data) {
  const mapped = {}
  if (data.title !== undefined) mapped.title = data.title
  if (data.description !== undefined) mapped.description = data.description
  if (data.tags !== undefined) mapped.tags = data.tags
  if (data.project_url !== undefined) mapped.project_url = data.project_url
  if (data.github_url !== undefined) mapped.github_url = data.github_url
  return mapped
}

export async function createProject(uid, form) {
  const validation = validateProjectForm(form)
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0])
  }

  const profileId = (await resolveProfileId(uid)) || uid
  const payload = buildProjectData(form)
  const { data, error } = await supabase
    .from('community_projects')
    .insert({
      ...payload,
      author_id: profileId,
      like_count: 0,
      comment_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return mapProjectFromDb(data)
}

export async function updateProject(projectId, current, form) {
  const validation = validateProjectForm(form)
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0])
  }

  const payload = buildProjectData(form)
  const dbPayload = mapProjectToDb(payload)

  const { error } = await supabase
    .from('community_projects')
    .update(dbPayload)
    .eq('id', projectId)

  if (error) throw error
  return { id: projectId, ...current, ...payload }
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('community_projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

export async function getProjectsFeed({ pageSize = FEED_PAGE_SIZE, cursor = null, tag = null, sort = 'recent' }) {
  let query = supabase
    .from('community_projects')
    .select('*', { count: 'exact' })

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (sort === 'popular') {
    query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (cursor) {
    if (sort === 'popular') {
      const likeCount = cursor.likeCount ?? 0
      const createdAt = cursor.createdAt
      query = query.or(`and(like_count.eq.${likeCount},created_at.lt.${createdAt}),like_count.lt.${likeCount}`)
    } else {
      query = query.lt('created_at', cursor)
    }
  }

  query = query.limit(pageSize)

  const { data, error } = await query
  if (error) throw error

  const projects = (data || []).map(mapProjectFromDb)
  const lastProject = projects[projects.length - 1]
  const lastDoc = lastProject
    ? sort === 'popular'
      ? { createdAt: lastProject.createdAt, likeCount: lastProject.likeCount ?? 0 }
      : lastProject.createdAt
    : null

  return { projects, lastDoc, hasMore: projects.length === pageSize }
}

export async function getUserProjects(uid) {
  const profileId = (await resolveProfileId(uid)) || uid
  const { data, error } = await supabase
    .from('community_projects')
    .select('*')
    .eq('author_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data || []).map(mapProjectFromDb)
}

export async function getProjectById(projectId) {
  const { data, error } = await supabase
    .from('community_projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (error || !data) return null
  return mapProjectFromDb(data)
}

export async function hydrateAuthors(projects) {
  const missing = [...new Set(projects.map((p) => p.authorId))].filter((uid) => !authorCache.has(uid))

  for (const group of chunk(missing, 10)) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, photo_url')
      .in('id', group)

    if (data) {
      data.forEach((profile) => {
        const displayName = (profile.name || '').trim()
        authorCache.set(profile.id, {
          name: displayName || 'Aluno WebStart',
          username: profile.username || '',
          photoURL: profile.photo_url || '',
        })
      })
    }
  }

  const authors = {}
  projects.forEach((p) => {
    authors[p.authorId] =
      authorCache.get(p.authorId) ||
      { name: 'Aluno WebStart', username: '', photoURL: '' }
  })
  return authors
}

export function clearAuthorCache() {
  authorCache.clear()
}

export async function toggleLike(projectId) {
  const { data, error } = await supabase.rpc('toggle_project_like', {
    p_project_id: projectId,
  })

  if (error) throw error
  return data
}

export async function getLikedProjectIds(uid, projectIds) {
  if (!projectIds.length) return new Set()

  const profileId = (await resolveProfileId(uid)) || uid
  const { data } = await supabase
    .from('project_likes')
    .select('project_id')
    .eq('user_id', profileId)
    .in('project_id', projectIds)

  const liked = new Set()
  if (data) {
    data.forEach((like) => liked.add(like.project_id))
  }
  return liked
}

export async function getComments({ projectId, pageSize = 30, cursor = null }) {
  let query = supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(pageSize)

  if (cursor) {
    query = query.gt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) throw error

  const comments = (data || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const lastDoc = comments.length > 0 ? comments[comments.length - 1]?.createdAt : null

  return { comments, lastDoc, hasMore: comments.length === pageSize }
}

export async function addComment(projectId, uid, content) {
  const trimmed = String(content || '').trim()
  if (trimmed.length < 1 || trimmed.length > COMMENT_MAX) {
    throw new Error(`O comentário deve ter entre 1 e ${COMMENT_MAX} caracteres.`)
  }

  const profileId = (await resolveProfileId(uid)) || uid
  const { data: comment, error: commentError } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      author_id: profileId,
      content: trimmed,
    })
    .select()
    .single()

  if (commentError) throw commentError

  return {
    id: comment.id,
    projectId: comment.project_id,
    authorId: comment.author_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }
}

export async function updateComment(commentId, content) {
  const trimmed = String(content || '').trim()
  if (trimmed.length < 1 || trimmed.length > COMMENT_MAX) {
    throw new Error(`O comentário deve ter entre 1 e ${COMMENT_MAX} caracteres.`)
  }

  const { error } = await supabase
    .from('project_comments')
    .update({ content: trimmed })
    .eq('id', commentId)

  if (error) throw error
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('project_comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}

export async function getCommentById(commentId) {
  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .eq('id', commentId)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    projectId: data.project_id,
    authorId: data.author_id,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createPostReport({ projectId = null, commentId = null, reason }) {
  const trimmed = String(reason || '').trim()
  if (trimmed.length < 3 || trimmed.length > 500) {
    throw new Error('Descreve o motivo da denúncia (3 a 500 caracteres).')
  }
  if (!projectId && !commentId) {
    throw new Error('Falta o conteúdo a denunciar.')
  }

  const payload = { reason: trimmed }
  if (projectId) payload.project_id = projectId
  else payload.comment_id = commentId

  const { data, error } = await supabase
    .from('post_reports')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listReports() {
  const { data, error } = await supabase
    .from('post_reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export async function resolveReport(reportId, action) {
  const { data, error } = await supabase.rpc('admin_resolve_report', {
    p_report_id: reportId,
    p_action: action,
  })

  if (error) throw error
  return data
}
