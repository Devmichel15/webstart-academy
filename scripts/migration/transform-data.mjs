// ETAPA 5a — Transform local: backup Firebase -> migration/normalized/*.jsonl
// Determinístico e idempotente (uuidv5). Não acessa rede nem banco.
// Uso: node scripts/migration/transform-data.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IN = path.join(ROOT, 'migration', 'backups', 'firebase');
const OUT = path.join(ROOT, 'migration', 'normalized');
const REPORTS = path.join(ROOT, 'migration', 'reports');

// namespace fixo — NUNCA mudar após primeiro import (ids derivam dele)
const NS = 'f7d1e6c4-9b3a-4e58-8c21-6a0d9f4e2b77';

function uuidV5(namespaceStr, name) {
  const ns = Buffer.from(String(namespaceStr).replace(/-/g, ''), 'hex');
  const d = createHash('sha1').update(ns).update(Buffer.from(name, 'utf8')).digest();
  const b = d.subarray(0, 16); // UUID usa os primeiros 16 bytes do SHA-1
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const s = b.toString('hex');
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

function iso(ts) {
  if (!ts) return null;
  if (ts.__type === 'timestamp') return new Date(ts._seconds * 1000).toISOString();
  if (typeof ts === 'string') {
    // datas 'YYYY-MM-DD' viram meia-noite UTC explícita
    return /^\d{4}-\d{2}-\d{2}$/.test(ts) ? `${ts}T00:00:00Z` : ts;
  }
  return null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(IN, file), 'utf8'));
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REPORTS, { recursive: true });

const errors = [];
const warn = (msg) => { errors.push(msg); console.warn('⚠ ' + msg); };

const users = readJson('users.json');
const progress = readJson('user_progress.json');
const achievements = readJson('user_achievements.json');
const announcements = readJson('announcements.json');
const authUsers = readJson('_auth_users.json');

console.log(`Entrada: ${users.length} users · ${progress.length} progress · ${achievements.length} achievements · ${announcements.length} announcements · ${authUsers.length} auth`);

const writers = {};
function open(name) {
  writers[name] = fs.createWriteStream(path.join(OUT, name));
  return {
    write(obj) { writers[name].write(JSON.stringify(obj) + '\n'); }
  };
}

// ── perfis: TODOS os usuários Auth recebem linha (órfãos => is_public=false) ──
const docByUid = new Map(users.map(u => [u.__id, u.__data]));
const profilesW = open('profiles.jsonl');
const prefsW = open('email_preferences.jsonl');
const mappingW = open('firebase_id_mapping.jsonl');
const ccourseW = open('course_completions.jsonl');
const quizW = open('quiz_completions.jsonl');

let backfilledFirstSteps = 0;
let orphanAuthProfiles = 0;
const tstStats = { legacyStrings: 0, reconstructed: 0, zeroed: 0 };

// totalStudyTime legado veio como string corrompida (concatenação MM:SS).
// Estratégia zero-perda: preserva byte-exato em *_legacy; inteiro via parse
// sequencial determinístico quando consome a string inteira; senão 0.
function parseStudyTime(raw) {
  if (typeof raw !== 'string') return { value: Number.isFinite(raw) ? raw : 0, legacy: null, ok: true };
  const s = raw.trim();
  if (!s) return { value: 0, legacy: null, ok: true };
  const re = /(\d{1,2}):(\d{2})/y;
  let i = 0, totalSecs = 0;
  while (i < s.length) {
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) return { value: 0, legacy: raw, ok: false };
    totalSecs += Number(m[1]) * 60 + Number(m[2]);
    i = re.lastIndex;
  }
  return { value: Math.round(totalSecs / 60), legacy: raw, ok: true };
}

for (const au of authUsers) {
  const uid = au.uid;
  const d = docByUid.get(uid);
  const id = uuidV5(NS, uid);

  if (!d) {
    orphanAuthProfiles++;
    profilesW.write({
      id, legacy_firebase_uid: uid,
      name: au.displayName || 'Aluno WebStart',
      username: (au.email || '').split('@')[0] || `aluno_${uid.slice(0, 6)}`,
      email: au.email || '',
      provider: (au.providerData?.[0]?.providerId || 'password') === 'google.com' ? 'google' : 'email',
      role: 'student',
      photo_url: au.photoURL || null,
      is_public: false // regra aprovada p/ órfãos
    });
    continue;
  }

  const hasFirstSteps = Object.prototype.hasOwnProperty.call(d, 'firstStepsDone');
  let firstStepsDone = hasFirstSteps ? !!d.firstStepsDone : false;
  if (!hasFirstSteps) {
    firstStepsDone =
      (d.xp ?? 0) > 0 ||
      (Array.isArray(d.completedLessons) && d.completedLessons.length > 0) ||
      (Array.isArray(d.completedCourses) && d.completedCourses.length > 0);
    if (firstStepsDone) backfilledFirstSteps++;
  }

  const tst = parseStudyTime(d.totalStudyTime ?? 0);
  if (tst.legacy !== null) {
    tstStats.legacyStrings++;
    if (tst.ok) tstStats.reconstructed++; else tstStats.zeroed++;
  }

  profilesW.write({
    id,
    legacy_firebase_uid: uid,
    name: d.name ?? 'Aluno WebStart',
    username: d.username ?? null,
    email: d.email ?? '',
    provider: d.provider === 'google' ? 'google' : 'email',
    role: d.role === 'admin' ? 'admin' : 'student',
    photo_url: d.photoURL ?? null,
    xp: d.xp ?? 0,
    level: d.level ?? 1,
    streak: d.streak ?? 0,
    last_study_date: d.lastStudyDate ?? null,
    completed_exercises: d.completedExercises ?? 0,
    completed_projects: d.completedProjects ?? 0,
    current_course: d.currentCourse ?? null,
    current_lesson: d.currentLesson ?? null,
    total_study_time: tst.value,
    total_study_time_legacy: tst.legacy,
    is_public: d.isPublic !== false,
    first_steps_done: firstStepsDone,
    created_at: iso(d.createdAt),
    last_login: iso(d.lastLogin),
    welcome_email_sent: !!d.welcomeEmailSent,
    welcome_email_sent_at: iso(d.welcomeEmailSentAt),
    last_reactivation_email: iso(d.lastReactivationEmail),
    certificates: Array.isArray(d.certificates) ? d.certificates : [],
    is_premium: d.isPremium === true,
    purchased_courses: Array.isArray(d.purchasedCourses) ? d.purchasedCourses : []
  });

  const ep = d.emailPreferences || {};
  const prefRow = {
    user_id: id,
    marketing_opt_out: ep.marketingOptOut === true,
    notifications_opt_out: ep.notificationsOptOut === true
  };
  if (iso(ep.updatedAt)) prefRow.updated_at = iso(ep.updatedAt); // ausente → default now()
  prefsW.write(prefRow);

  mappingW.write({
    firebase_doc_path: `users/${uid}`,
    supabase_table: 'profiles',
    supabase_id: id
  });

  for (const courseId of Array.isArray(d.completedCourses) ? d.completedCourses : []) {
    ccourseW.write({ user_id: id, course_id: courseId, completed_at: null });
  }
  for (const moduleId of Array.isArray(d.completedQuizzes) ? d.completedQuizzes : []) {
    quizW.write({ user_id: id, module_id: moduleId, completed_at: null });
  }
}

// ── progresso de aulas ──
const progressW = open('lesson_progress.jsonl');
for (const row of progress) {
  const d = row.__data;
  const uid = d.userId;
  if (!docByUid.has(uid)) { warn(`progress órfão ignorado: ${row.__id}`); continue; }
  const ts = parseStudyTime(d.timeSpent ?? 0);
  progressW.write({
    user_id: uuidV5(NS, uid),
    lesson_id: d.lessonId,
    course_id: d.courseId ?? null,
    module_id: d.moduleId ?? null,
    completed: d.completed !== false,
    progress_percentage: d.progressPercentage ?? 100,
    time_spent: ts.value,
    time_spent_legacy: ts.legacy,
    completed_at: iso(d.completedAt),
    updated_at: iso(d.updatedAt ?? d.completedAt) ?? iso(d.completedAt),
    legacy_doc_id: row.__id
  });
}

// ── conquistas ──
const uachvW = open('user_achievements.jsonl');
for (const row of achievements) {
  const d = row.__data;
  if (!docByUid.has(d.userId)) { warn(`achievement órfão ignorado: ${row.__id}`); continue; }
  uachvW.write({
    user_id: uuidV5(NS, d.userId),
    achievement_id: d.achievementId,
    earned_at: iso(d.earnedAt) ?? new Date().toISOString()
  });
  mappingW.write({
    firebase_doc_path: `user_achievements/${row.__id}`,
    supabase_table: 'user_achievements',
    supabase_id: `${uuidV5(NS, d.userId)}|${d.achievementId}`
  });
}

// ── anúncios / campanhas ──
const annW = open('announcements.jsonl');
for (const row of announcements) {
  const d = row.__data;
  annW.write({
    id: row.__id,
    subject: d.subject ?? null,
    total: d.total ?? 0,
    sent: d.sent ?? 0,
    errors: d.errors ?? 0,
    error_details: Array.isArray(d.errorDetails) ? d.errorDetails : [],
    mode: d.mode ?? null,
    sent_at: iso(d.sentAt)
  });
}

// ── learning_profiles: coleção inexistente no backup (arquivo vazio p/ pipeline) ──
open('learning_profiles.jsonl');

await Promise.all(Object.values(writers).map(w =>
  new Promise((resolve, reject) => {
    w.on('error', reject);
    w.on('finish', resolve);
    w.end();
  })
));

// ── validações locais ──
const counts = {};
for (const f of fs.readdirSync(OUT)) {
  const p = path.join(OUT, f);
  if (!fs.statSync(p).isFile()) continue;
  const txt = fs.readFileSync(p, 'utf8').trim();
  counts[f] = txt ? txt.split('\n').length : 0;
}

// duplicidade de username (constraint unique falharia no import)
const seen = new Map(); const dupeUsernames = [];
for (const line of fs.readFileSync(path.join(OUT, 'profiles.jsonl'), 'utf8').trim().split('\n')) {
  const u = JSON.parse(line);
  if (u.username == null) continue;
  const k = u.username.toLowerCase();
  if (seen.has(k)) dupeUsernames.push(k);
  seen.set(k, true);
}
if (dupeUsernames.length) warn(`usernames duplicados (resolver antes do import): ${dupeUsernames.join(', ')}`);

// contagens esperadas vs obtidas
const expect = {
  'profiles.jsonl': authUsers.length,
  'lesson_progress.jsonl': progress.length,
  'user_achievements.jsonl': achievements.length,
  'announcements.jsonl': announcements.length
};
let ok = true;
for (const [f, n] of Object.entries(expect)) {
  if (counts[f] !== n) { ok = false; warn(`contagem divergente ${f}: esperado=${n} obtido=${counts[f]}`); }
}

const summary = {
  generatedAt: new Date().toISOString(),
  namespace: NS,
  counts,
  expected: expect,
  orphanAuthProfiles,
  backfilledFirstSteps,
  totalStudyTime: tstStats,
  duplicateUsernames: [...new Set(dupeUsernames)],
  errorsCount: errors.length,
  ok: ok && errors.length === 0
};
fs.writeFileSync(path.join(REPORTS, 'transform-summary.json'), JSON.stringify(summary, null, 2));
if (errors.length) fs.writeFileSync(path.join(REPORTS, 'transform-errors.txt'), errors.join('\n'));

console.log('\n=== TRANSFORM ==='); console.table(counts);
console.log(`órfãos auth->profile: ${orphanAuthProfiles} | firstStepsDone backfill: ${backfilledFirstSteps} | usernames duplicados: ${summary.duplicateUsernames.length}`);
console.log(summary.ok ? '✓ transform OK (idempotente)' : '✗ transform com problemas — ver reports/');
process.exit(summary.ok ? 0 : 1);
