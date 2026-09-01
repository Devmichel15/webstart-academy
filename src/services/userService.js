import { supabase } from '../lib/supabase.js'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    legacyFirebaseUid: row.legacy_firebase_uid || null,
    authUserId: row.auth_user_id || null,
    name: row.name,
    username: row.username,
    email: row.email,
    photoURL: row.photo_url,
    level: row.level || 1,
    xp: row.xp || 0,
    streak: row.streak || 0,
    completedLessons: row.completed_lessons || [],
    completedCourses: row.completed_courses || [],
    completedExercises: row.completed_exercises || 0,
    completedProjects: row.completed_projects || 0,
    completedQuizzes: row.completed_quizzes || [],
    currentCourse: row.current_course || null,
    currentLesson: row.current_lesson || null,
    totalStudyTime: row.total_study_time || 0,
    lastStudyDate: row.last_study_date || null,
    firstStepsDone: row.first_steps_done || false,
    isPublic: row.is_public ?? true,
    bio: row.bio || null,
    githubUrl: row.github_url || null,
    portfolioUrl: row.portfolio_url || null,
    linkedinUrl: row.linkedin_url || null,
    twitterUrl: row.twitter_url || null,
    instagramUrl: row.instagram_url || null,
    websiteUrl: row.website_url || null,
  }
}

export async function createUserProfile(user, extra = {}) {
  let profile = await loadProfile(user.id)

  // B1 — re-link de identidade: quando o perfil atual é vazio/inexistente e existe
  // histórico migrado (id = uuidv5(NS, firebase_uid)), copia-o para este auth.uid.
  // A função é idempotente e não-destrutiva (ver supabase/migrations/009).
  if (isEmptyProfile(profile)) {
    try {
      await supabase.rpc('link_legacy_profile', {
        p_auth_uid: user.id,
        p_firebase_uid: getLegacyFirebaseUid(user),
      })
      profile = await loadProfile(user.id)
    } catch (err) {
      console.error('[createUserProfile] link_legacy_profile error:', err)
    }
  }

  if (profile) {
    await touchProfile(user, profile)
    return profile
  }

  // nenhum perfil ainda (novo cadastro GoTrue, sem histórico Firebase)
  const name = (extra.name || user.user_metadata?.name || '').trim() || 'Aluno WebStart'
  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL

  const profileData = {
    id: user.id,
    name,
    username: extra.username || generateUniqueUsername(name, user.id),
    email: user.email || '',
    provider: extra.provider || 'email',
    role: isAdmin ? 'admin' : 'student',
    xp: 0,
    level: 1,
    streak: 0,
    is_public: true,
    first_steps_done: false,
    ...mapExtraToProfile(extra),
  }

  // vínculo real com Firebase (cadastros "bridge" entre os dois sistemas)
  const legacyFirebaseUid = getLegacyFirebaseUid(user)
  if (legacyFirebaseUid) profileData.legacy_firebase_uid = legacyFirebaseUid

  const { error: insertError } = await supabase.from('profiles').insert(profileData)
  if (insertError) {
    console.error('[createUserProfile] insert error:', insertError)
    throw insertError
  }

  return profileData
}

function getLegacyFirebaseUid(user) {
  return user?.user_metadata?.legacy_firebase_uid || user?.app_metadata?.legacy_firebase_uid || null
}

function isEmptyProfile(row) {
  if (!row) return true
  const lessons = Array.isArray(row.completed_lessons) ? row.completed_lessons.length : 0
  const courses = Array.isArray(row.completed_courses) ? row.completed_courses.length : 0
  const xp = row.xp || 0
  return xp === 0 && lessons === 0 && courses === 0 && !row.legacy_firebase_uid
}

async function loadProfile(uid) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (error) {
    console.error('[createUserProfile] lookup error:', error)
    throw error
  }
  return data || null
}

async function touchProfile(user, profile) {
  const updates = { last_login: new Date().toISOString() }
  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL
  if (isAdmin && profile.role !== 'admin') updates.role = 'admin'
  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) console.error('[createUserProfile] update error:', error)
  return profile
}

function mapExtraToProfile(extra) {
  const mapped = {}
  if (extra.username) mapped.username = extra.username
  return mapped
}

function generateUniqueUsername(name, uid) {
  const base = (name || 'aluno')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16)
  const suffix = uid.slice(0, 6)
  return `${base}${suffix}`
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()

  if (error) {
    console.error(`[getUserProfile] error for uid ${uid}:`, error)
    return null
  }
  return data ? mapProfileRow(data) : null
}

const activeUserChannels = new Map()

export function subscribeToUser(uid, callback) {
  if (!uid) return () => {}

  const mappedCallback = (row) => callback(mapProfileRow(row))

  if (activeUserChannels.has(uid)) {
    const entry = activeUserChannels.get(uid)
    entry.refCount++
    entry.callbacks.add(mappedCallback)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data) mappedCallback(data)
      })

    return () => unsubscribeUser(uid, mappedCallback)
  }

  const callbacks = new Set([mappedCallback])
  const channel = supabase
    .channel(`user-${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
      (payload) => {
        if (payload.new) {
          for (const cb of callbacks) cb(payload.new)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              for (const cb of callbacks) cb(data)
            }
          })
      }
    })

  activeUserChannels.set(uid, { channel, callbacks, refCount: 1 })

  return () => unsubscribeUser(uid, mappedCallback)
}

function unsubscribeUser(uid, callback) {
  if (!activeUserChannels.has(uid)) return

  const entry = activeUserChannels.get(uid)
  entry.callbacks.delete(callback)
  entry.refCount--

  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel)
    activeUserChannels.delete(uid)
  }
}

export async function updateLastLogin(uid) {
  await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', uid)
}

export async function updateUserProfile(uid, data) {
  const supabaseData = mapJsToSql(data)
  supabaseData.id = uid
  const { error } = await supabase
    .from('profiles')
    .upsert(supabaseData, { onConflict: 'id' })
  if (error) throw error
}

function mapJsToSql(data) {
  const mapped = {}
  const fieldMap = {
    lastStudyDate: 'last_study_date',
    completedLessons: 'completed_lessons',
    completedCourses: 'completed_courses',
    completedExercises: 'completed_exercises',
    completedProjects: 'completed_projects',
    completedQuizzes: 'completed_quizzes',
    currentCourse: 'current_course',
    currentLesson: 'current_lesson',
    totalStudyTime: 'total_study_time',
    isPublic: 'is_public',
    firstStepsDone: 'first_steps_done',
    lastReactivationEmail: 'last_reactivation_email',
    welcomeEmailSent: 'welcome_email_sent',
    welcomeEmailSentAt: 'welcome_email_sent_at',
    photoURL: 'photo_url',
    githubUrl: 'github_url',
    portfolioUrl: 'portfolio_url',
    linkedinUrl: 'linkedin_url',
    twitterUrl: 'twitter_url',
    instagramUrl: 'instagram_url',
    websiteUrl: 'website_url',
  }

  for (const [key, value] of Object.entries(data)) {
    const sqlKey = fieldMap[key] || key
    mapped[sqlKey] = value
  }
  return mapped
}

export async function addXpToUser(uid, amount) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const xp = (user.xp || 0) + amount
  const level = getLevelFromXp(xp)
  await updateUserProfile(uid, { xp, level })
  return { xp, level }
}

export async function updateUserStreak(uid) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const today = getTodayKey()
  const { streak, broke, bonusXp, penaltyXp } = computeStreakUpdate(
    user.lastStudyDate,
    user.streak
  )

  let xp = user.xp || 0
  if (broke && penaltyXp) xp = Math.max(0, xp - penaltyXp)
  if (bonusXp) xp += bonusXp

  const level = getLevelFromXp(xp)
  await updateUserProfile(uid, {
    streak,
    lastStudyDate: today,
    xp,
    level,
  })
  return { streak, broke, bonusXp, penaltyXp, xp, level }
}

export async function incrementCompletedExercises(uid) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const count = (user.completedExercises || 0) + 1
  await updateUserProfile(uid, { completedExercises: count })
  return count
}

export async function incrementCompletedProjects(uid) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const count = (user.completedProjects || 0) + 1
  await updateUserProfile(uid, { completedProjects: count })
  return count
}

export async function addCompletedQuiz(uid, moduleId) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const completedQuizzes = user.completedQuizzes || []
  if (completedQuizzes.includes(moduleId)) return completedQuizzes
  await updateUserProfile(uid, {
    completedQuizzes: [...completedQuizzes, moduleId],
  })
  return [...completedQuizzes, moduleId]
}

export async function updateCurrentLesson(uid, { courseId, lessonId }) {
  await updateUserProfile(uid, {
    currentCourse: courseId,
    currentLesson: lessonId,
  })
}

export async function addCompletedLesson(uid, lessonId) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const completedLessons = user.completedLessons || []
  if (completedLessons.includes(lessonId)) return user
  await updateUserProfile(uid, {
    completedLessons: [...completedLessons, lessonId],
  })
  return [...completedLessons, lessonId]
}

export async function addCompletedCourse(uid, courseId) {
  const user = await getUserProfile(uid)
  if (!user) return null
  const completedCourses = user.completedCourses || []
  if (completedCourses.includes(courseId)) return user
  await updateUserProfile(uid, {
    completedCourses: [...completedCourses, courseId],
  })
}

export async function addStudyTime(uid, minutes) {
  const user = await getUserProfile(uid)
  if (!user) return
  await updateUserProfile(uid, {
    totalStudyTime: (user.totalStudyTime || 0) + minutes,
  })
}

export async function ensureUsername(uid) {
  const user = await getUserProfile(uid)
  if (!user) return null
  if (user.username) return user.username
  const username = generateUniqueUsername(user.name, uid)
  await updateUserProfile(uid, { username })
  return username
}

function getLevelFromXp(xp) {
  if (xp >= 5000) return 10
  if (xp >= 3000) return 9
  if (xp >= 2000) return 8
  if (xp >= 1500) return 7
  if (xp >= 1000) return 6
  if (xp >= 700) return 5
  if (xp >= 400) return 4
  if (xp >= 200) return 3
  if (xp >= 50) return 2
  return 1
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function computeStreakUpdate(lastStudyDate, currentStreak) {
  const today = getTodayKey()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (lastStudyDate === today) {
    return { streak: currentStreak, broke: false, bonusXp: 0, penaltyXp: 0 }
  }

  if (lastStudyDate === yesterday) {
    const newStreak = currentStreak + 1
    const bonusXp = newStreak >= 7 ? 50 : newStreak >= 3 ? 20 : 10
    return { streak: newStreak, broke: false, bonusXp, penaltyXp: 0 }
  }

  const penaltyXp = currentStreak >= 7 ? 25 : currentStreak >= 3 ? 10 : 0
  return { streak: 1, broke: true, bonusXp: 10, penaltyXp }
}
