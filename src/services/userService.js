import { supabase } from "../lib/supabase.js";
import {
  BIO_MAX,
  isValidUrl,
  normalizeUrl,
  validateProfileName,
} from "../utils/profileValidation.js";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

function mapProfileRow(row) {
  if (!row) return null;
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
  };
}

/**
 * Nome a gravar num perfil novo (bugs #21, #22).
 *
 * Antes: `(extra.name || user.user_metadata?.name || '').trim() || "Aluno WebStart"`.
 * Um só campo de metadata, e "Aluno WebStart" como resposta a tudo o que
 * faltasse — daí a школа de utilizadores sem nome próprio. Ordem agora:
 *
 *   1. o que o formulário mandou (`extra.name`);
 *   2. `user_metadata.name` / `full_name` / `user_name` / `preferred_username`
 *      — o Google devolve `full_name`, e `name` só quando o claim vem;
 *   3. derivado do email (`maria.silva@...` -> "Maria Silva");
 *   4. "Aluno WebStart", só quando não há mesmo nada.
 *
 * O fallback genérico é o ÚLTIMO recurso: é preferível mostrar um nome derivado
 * do email a "Aluno WebStart". Sem nada aproveitável devolvemos `null`: o
 * cadastro é marcado como incompleto (`isIncompleteProfileName`) e é o modal
 * lateral que pede o nome. Gravar o default era o que multiplicava as linhas
 * "Aluno WebStart" no top 10 — daí `name` passar a ser NULLABLE
 * (supabase/migrations/017).
 */
const NAME_METADATA_KEYS = ["name", "full_name", "user_name", "preferred_username"];

function titleCaseToken(token) {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function deriveNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0];
  if (!localPart) return "";
  const words = localPart
    .split(/[.\-_+]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .map(titleCaseToken);
  return words.join(" ");
}

function resolveDisplayName(user, extra = {}) {
  const fromExtra = String(extra.name || "").trim();
  if (fromExtra) return fromExtra.slice(0, 80);

  const metadata = user?.user_metadata || {};
  for (const key of NAME_METADATA_KEYS) {
    const value = String(metadata[key] || "").trim();
    if (value) return value.slice(0, 80);
  }

  const fromEmail = deriveNameFromEmail(user?.email);
  if (fromEmail) return fromEmail.slice(0, 80);

  return null;
}

export async function createUserProfile(user, extra = {}) {
  let profile = await loadProfile(user.id);

  if (user.email && isEmptyProfile(profile, user.id)) {
    const migratedProfile = await findMigratedProfileByEmail(user.email);
    if (migratedProfile && migratedProfile.id !== user.id) {
      const { error } = await supabase
        .from("profiles")
        .update({ auth_user_id: user.id })
        .eq("id", migratedProfile.id);
      if (error) throw error;
      profile = migratedProfile;
    }
  }

  // B1 — re-link de identidade: quando o perfil atual é vazio/inexistente e existe
  // histórico migrado (id = uuidv5(NS, firebase_uid)), copia-o para este auth.uid.
  // A função é idempotente e não-destrutiva (ver supabase/migrations/009).
  if (isEmptyProfile(profile, user.id)) {
    try {
      await supabase.rpc("link_legacy_profile", {
        p_auth_uid: user.id,
        p_firebase_uid: getLegacyFirebaseUid(user),
      });
      profile = await loadProfile(user.id);
    } catch (err) {
      // Engolir a falha fazia `profile` ficar null e o fluxo caía no insert de
      // um perfil NOVO e vazio: o migrador perdia o histórico e ainda ganhas
      // uma segunda linha para o mesmo auth uid. Propagar para o AuthContext
      // mostrar o erro em vez de fingir que o login correu bem.
      console.error("[createUserProfile] link_legacy_profile error:", err);
      throw err;
    }
  }

  if (profile) {
    await touchProfile(user, profile);
    return profile;
  }

  // nenhum perfil ainda (novo cadastro GoTrue, sem histórico Firebase)
  const name = resolveDisplayName(user, extra);
  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  const profileData = {
    id: user.id,
    name,
    username: extra.username || generateUniqueUsername(name, user.id),
    email: user.email || "",
    provider: extra.provider || "email",
    role: isAdmin ? "admin" : "student",
    xp: 0,
    level: 1,
    streak: 0,
    is_public: true,
    first_steps_done: false,
    ...mapExtraToProfile(extra),
  };

  // vínculo real com Firebase (cadastros "bridge" entre os dois sistemas)
  const legacyFirebaseUid = getLegacyFirebaseUid(user);
  if (legacyFirebaseUid) profileData.legacy_firebase_uid = legacyFirebaseUid;

  const { error: insertError } = await supabase
    .from("profiles")
    .insert(profileData);
  if (insertError) {
    console.error("[createUserProfile] insert error:", insertError);
    throw insertError;
  }

  return profileData;
}

function getLegacyFirebaseUid(user) {
  return (
    user?.user_metadata?.legacy_firebase_uid ||
    user?.app_metadata?.legacy_firebase_uid ||
    null
  );
}

function isEmptyProfile(row, authUid = null) {
  if (!row) return true;
  const lessons = Array.isArray(row.completed_lessons)
    ? row.completed_lessons.length
    : 0;
  const courses = Array.isArray(row.completed_courses)
    ? row.completed_courses.length
    : 0;
  const xp = row.xp || 0;
  const syntheticLegacyUid = authUid && row.legacy_firebase_uid === authUid;
  return (
    xp === 0 &&
    lessons === 0 &&
    courses === 0 &&
    (!row.legacy_firebase_uid || syntheticLegacyUid)
  );
}

// Um auth uid pode corresponder a DUAS linhas de `profiles`: a "work profile"
// criada no registo (id = auth uid) e o perfil migrado do Firebase ligado por
// `auth_user_id`. Ler com `maybeSingle()` devolve PGRST116 nesse estado, o que
// fazia o perfil parecer inexistente. Buscamos até 2 linhas e escolhemos de
// forma determinística a que tem histórico.
function pickCanonicalProfileRow(rows, uid) {
  if (!rows || rows.length === 0) return null;
  if (rows.length === 1) return rows[0];

  const linked = rows.filter((row) => row.auth_user_id === uid);
  const candidates = linked.length > 0 ? linked : rows;

  return (
    candidates.find((row) => !isEmptyProfile(row, uid)) ||
    candidates.find((row) => row.name && String(row.name).trim()) ||
    candidates[0]
  );
}

async function fetchProfileRows(uid) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${uid},auth_user_id.eq.${uid}`)
    .limit(2);
  if (error) throw error;
  return data || [];
}

async function getUserProfileRow(uid) {
  return pickCanonicalProfileRow(await fetchProfileRows(uid), uid);
}

async function loadProfile(uid) {
  return getUserProfileRow(uid);
}

async function findMigratedProfileByEmail(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email.trim())
    .not("legacy_firebase_uid", "is", null)
    .order("xp", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function touchProfile(user, profile) {
  const updates = { last_login: new Date().toISOString() };
  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  if (isAdmin && profile.role !== "admin") updates.role = "admin";
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profile.id);
  if (error) console.error("[createUserProfile] update error:", error);
  return profile;
}

function mapExtraToProfile(extra) {
  const mapped = {};
  if (extra.username) mapped.username = extra.username;
  return mapped;
}

function generateUniqueUsername(name, uid) {
  const base = (name || "aluno")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
  const suffix = uid.slice(0, 6);
  return `${base}${suffix}`;
}

export async function getUserProfile(uid) {
  try {
    const row = await getUserProfileRow(uid);
    return row ? mapProfileRow(row) : null;
  } catch (error) {
    // `null` significa "perfil inexistente". devolver `null` num erro de rede
    // confundia os dois: createUserProfile inseria um perfil duplicado e o
    // ProgressContext tratava o utilizador como novo. Propagar o erro.
    console.error(`[getUserProfile] error for uid ${uid}:`, error);
    throw error;
  }
}

const activeUserChannels = new Map();

const PROFILE_RETRY_ATTEMPTS = 4;
const PROFILE_RETRY_DELAY_MS = 500;

export function subscribeToUser(uid, callback) {
  if (!uid) return () => {};

  const mappedCallback = (row) => callback(mapProfileRow(row));

  if (activeUserChannels.has(uid)) {
    const entry = activeUserChannels.get(uid);
    entry.refCount++;
    entry.callbacks.add(mappedCallback);

    readProfileWithRetry(uid).then(mappedCallback);

    return () => unsubscribeUser(uid, mappedCallback);
  }

  const callbacks = new Set([mappedCallback]);
  const channel = supabase
    .channel(`user-${uid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      (payload) => {
        if (
          payload.new &&
          (payload.new.id === uid || payload.new.auth_user_id === uid)
        ) {
          for (const cb of callbacks) cb(payload.new);
        }
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        readProfileWithRetry(uid).then((data) => {
          for (const cb of callbacks) cb(data);
        });
      }
    });

  activeUserChannels.set(uid, { channel, callbacks, refCount: 1 });

  return () => unsubscribeUser(uid, mappedCallback);
}

function unsubscribeUser(uid, callback) {
  if (!activeUserChannels.has(uid)) return;

  const entry = activeUserChannels.get(uid);
  entry.callbacks.delete(callback);
  entry.refCount--;

  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel);
    activeUserChannels.delete(uid);
  }
}

export async function updateLastLogin(uid) {
  const profile = await getUserProfileRow(uid);
  if (!profile) return;
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", profile.id);
}

export async function updateUserProfile(uid, data) {
  const supabaseData = mapJsToSql(data);
  const profile = await getUserProfileRow(uid);
  if (!profile) throw new Error("Perfil do utilizador não encontrado.");
  const { error } = await supabase
    .from("profiles")
    .update(supabaseData)
    .eq("id", profile.id);
  if (error) throw error;
}

// Campos que o utilizador pode editar no seu próprio perfil. `updateUserProfile`
// acima é interno (xp, streak, role…) e aceita chaves arbitrárias; este é o
// caminho para dados que vêm de um formulário. Os mesmos nomes, em
// snake_case, são a whitelist do servidor (supabase/migrations/018).
const EDITABLE_PROFILE_FIELDS = new Set([
  "name",
  "bio",
  "githubUrl",
  "portfolioUrl",
  "linkedinUrl",
  "twitterUrl",
  "instagramUrl",
  "websiteUrl",
  "isPublic",
]);

const EDITABLE_URL_FIELDS = [
  "githubUrl",
  "portfolioUrl",
  "linkedinUrl",
  "twitterUrl",
  "instagramUrl",
  "websiteUrl",
];

/**
 * Actualiza o perfil do utilizador autenticado.
 *
 * A gravação passa por `public.update_own_profile(jsonb)`
 * (supabase/migrations/018), que valida no servidor e recusa chaves fora da
 * whitelist. A validação abaixo continua a existir — para dar o erro sem ida
 * ao servidor e para o formulário responder imediatamente — mas já não é a
 * única linha de defesa: a RPC e o trigger `guard_privileged_profile_columns`
 * fecham o que um cliente hostil tentaria.
 *
 * O que a RPC garante, e o `updateUserProfile` interno não:
 *   1. whitelist no servidor — `role`, `xp`, `is_premium`… num formulário são
 *      erro, não um campo silenciosamente descartado;
 *   2. validação no servidor — o front é conveniência, não autoridade;
 *   3. resolve a linha canónica (perfis migrados têm `id` ≠ `auth.uid()`).
 *
 * Lança `Error` com mensagem em português, pronta para `toUserMessage`.
 */
export async function updateOwnProfile(uid, data = {}) {
  const patch = {};

  // Valida-se o payload em camelCase, ANTES de `mapJsToSql` renomear as chaves
  // para snake_case — validar depois comparava "githubUrl" com "github_url" e
  // a validação de URL nunca corria.
  for (const key of Object.keys(data)) {
    if (!EDITABLE_PROFILE_FIELDS.has(key)) {
      if (key !== "id") console.warn(`[updateOwnProfile] campo ignorado: ${key}`);
      continue;
    }

    if (key === "name") {
      const validation = validateProfileName(data.name);
      if (!validation.valid) throw new Error(validation.error);
      patch.name = validation.value;
      continue;
    }

    if (key === "bio") {
      const bio = String(data.bio ?? "").trim();
      patch.bio = bio ? bio.slice(0, BIO_MAX) : null;
      continue;
    }

    if (EDITABLE_URL_FIELDS.includes(key)) {
      if (!isValidUrl(data[key])) {
        throw new Error("URL inválida. Exemplo: https://github.com/usuario");
      }
      patch[key] = normalizeUrl(data[key]) || null;
      continue;
    }

    patch[key] = data[key];
  }

  // Payload vazio: nem vale a pena uma viagem ao servidor.
  if (Object.keys(patch).length === 0) {
    const profile = await getUserProfileRow(uid);
    if (!profile) throw new Error("Perfil do utilizador não encontrado.");
    return mapProfileRow(profile);
  }

  const { data: rows, error } = await supabase.rpc("update_own_profile", {
    p_patch: mapJsToSql(patch),
  });
  if (error) throw error;

  const updated = Array.isArray(rows) ? rows[0] : rows;
  return updated ? mapProfileRow(updated) : null;
}

async function readProfileWithRetry(uid) {
  for (let attempt = 0; attempt < PROFILE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const row = await getUserProfileRow(uid);
      if (row) return row;
    } catch {
      // leitura transiente com erro → tenta de novo dentro do orçamento
    }
    if (attempt < PROFILE_RETRY_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, PROFILE_RETRY_DELAY_MS));
    }
  }
  return null;
}

export async function resolveProfileId(uid) {
  let profile = await getUserProfileRow(uid);
  if (profile?.id) return profile.id;

  // Perfil ainda não resolvível (conta nova em corrida com createUserProfile,
  // ou perfil órfão): tenta re-link idempotente antes de desistir.
  // Nunca devolver um uid que não exista em profiles.id (senão as FK
  // user_id → profiles.id falham com 23503).
  try {
    await supabase.rpc("link_legacy_profile", {
      p_auth_uid: uid,
      p_firebase_uid: null,
    });
  } catch (err) {
    console.warn("[resolveProfileId] link_legacy_profile skipped:", err?.message || err);
  }

  profile = await getUserProfileRow(uid);
  return profile?.id || null;
}

function mapJsToSql(data) {
  const mapped = {};
  const fieldMap = {
    lastStudyDate: "last_study_date",
    completedLessons: "completed_lessons",
    completedCourses: "completed_courses",
    completedExercises: "completed_exercises",
    completedProjects: "completed_projects",
    completedQuizzes: "completed_quizzes",
    currentCourse: "current_course",
    currentLesson: "current_lesson",
    totalStudyTime: "total_study_time",
    isPublic: "is_public",
    firstStepsDone: "first_steps_done",
    lastReactivationEmail: "last_reactivation_email",
    welcomeEmailSent: "welcome_email_sent",
    welcomeEmailSentAt: "welcome_email_sent_at",
    photoURL: "photo_url",
    githubUrl: "github_url",
    portfolioUrl: "portfolio_url",
    linkedinUrl: "linkedin_url",
    twitterUrl: "twitter_url",
    instagramUrl: "instagram_url",
    websiteUrl: "website_url",
  };

  for (const [key, value] of Object.entries(data)) {
    const sqlKey = fieldMap[key] || key;
    mapped[sqlKey] = value;
  }
  return mapped;
}

export async function addXpToUser(uid, amount) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const xp = (user.xp || 0) + amount;
  const level = getLevelFromXp(xp);
  await updateUserProfile(uid, { xp, level });
  return { xp, level };
}

export async function updateUserStreak(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const today = getTodayKey();
  const { streak, broke, bonusXp, penaltyXp } = computeStreakUpdate(
    user.lastStudyDate,
    user.streak,
  );

  let xp = user.xp || 0;
  if (broke && penaltyXp) xp = Math.max(0, xp - penaltyXp);
  if (bonusXp) xp += bonusXp;

  const level = getLevelFromXp(xp);
  await updateUserProfile(uid, {
    streak,
    lastStudyDate: today,
    xp,
    level,
  });
  return { streak, broke, bonusXp, penaltyXp, xp, level };
}

export async function incrementCompletedExercises(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const count = (user.completedExercises || 0) + 1;
  await updateUserProfile(uid, { completedExercises: count });
  return count;
}

export async function incrementCompletedProjects(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const count = (user.completedProjects || 0) + 1;
  await updateUserProfile(uid, { completedProjects: count });
  return count;
}

export async function addCompletedQuiz(uid, moduleId) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const completedQuizzes = user.completedQuizzes || [];
  if (completedQuizzes.includes(moduleId)) return completedQuizzes;
  await updateUserProfile(uid, {
    completedQuizzes: [...completedQuizzes, moduleId],
  });
  return [...completedQuizzes, moduleId];
}

export async function updateCurrentLesson(uid, { courseId, lessonId }) {
  const profile = await getUserProfileRow(uid);
  if (!profile) throw new Error("Perfil do utilizador não encontrado.");
  if (profile.current_course === courseId && profile.current_lesson === lessonId) {
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ current_course: courseId, current_lesson: lessonId })
    .eq("id", profile.id);
  if (error) throw error;
}

export async function addCompletedLesson(uid, lessonId) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const completedLessons = user.completedLessons || [];
  if (completedLessons.includes(lessonId)) return user;
  await updateUserProfile(uid, {
    completedLessons: [...completedLessons, lessonId],
  });
  return [...completedLessons, lessonId];
}

export async function addCompletedCourse(uid, courseId) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  const completedCourses = user.completedCourses || [];
  if (completedCourses.includes(courseId)) return user;
  await updateUserProfile(uid, {
    completedCourses: [...completedCourses, courseId],
  });
}

export async function addStudyTime(uid, minutes) {
  const user = await getUserProfile(uid);
  if (!user) return;
  await updateUserProfile(uid, {
    totalStudyTime: (user.totalStudyTime || 0) + minutes,
  });
}

export async function ensureUsername(uid) {
  const user = await getUserProfile(uid);
  if (!user) return null;
  if (user.username) return user.username;
  const username = generateUniqueUsername(user.name, uid);
  await updateUserProfile(uid, { username });
  return username;
}

function getLevelFromXp(xp) {
  if (xp >= 5000) return 10;
  if (xp >= 3000) return 9;
  if (xp >= 2000) return 8;
  if (xp >= 1500) return 7;
  if (xp >= 1000) return 6;
  if (xp >= 700) return 5;
  if (xp >= 400) return 4;
  if (xp >= 200) return 3;
  if (xp >= 50) return 2;
  return 1;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function computeStreakUpdate(lastStudyDate, currentStreak) {
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Primeira atividade de sempre: começa o streak em 1. Não é uma quebra e
  // não dá bónus (antes caía no ramo de gap: `broke: true` + 10 XP grátis).
  if (!lastStudyDate) {
    return { streak: 1, broke: false, bonusXp: 0, penaltyXp: 0 };
  }

  if (lastStudyDate === today) {
    return { streak: currentStreak, broke: false, bonusXp: 0, penaltyXp: 0 };
  }

  if (lastStudyDate === yesterday) {
    const newStreak = currentStreak + 1;
    const bonusXp = newStreak >= 7 ? 50 : newStreak >= 3 ? 20 : 10;
    return { streak: newStreak, broke: false, bonusXp, penaltyXp: 0 };
  }

  // Gap: o streak reinicia e penaliza, mas nunca dá bónus — caso contrário
  // `xp = max(0, xp - penalty) + bonus` podia terminar acima do XP anterior.
  const penaltyXp = currentStreak >= 7 ? 25 : currentStreak >= 3 ? 10 : 0;
  return { streak: 1, broke: true, bonusXp: 0, penaltyXp };
}
