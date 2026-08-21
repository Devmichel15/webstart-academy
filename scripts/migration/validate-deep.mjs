// FASE 5-11 — Validação profunda: registro a registro, hashes canônicos, FKs, RLS.
// Uso: node scripts/migration/validate-deep.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const NORM = path.join(ROOT, 'migration', 'normalized');
const CONTENT = path.join(NORM, 'content');
const REPORTS = path.join(ROOT, 'migration', 'reports');

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, 'migration', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const appEnv = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) appEnv[m[1]] = m[2].replace(/^["']+|["']+$/g, '');
}
const BASE = env.SUPABASE_URL.replace(/\/$/, '');
const SRK = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = appEnv.VITE_SUPABASE_ANON_KEY;

async function fetchAll(table) {
  const out = []; let start = 0; const size = 1000;
  while (true) {
    const res = await fetch(`${BASE}/rest/v1/${table}?select=*`, {
      headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, Range: `${start}-${start + size - 1}` }
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < size) break;
    start += size;
  }
  return out;
}

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
function canon(v) {
  if (v === null || typeof v !== 'object') {
    return (typeof v === 'string' && ISO_RE.test(v)) ? Date.parse(v) : v;
  }
  if (Array.isArray(v)) return v.map(canon);
  const o = {};
  for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
  return o;
}
function hash(row) {
  return createHash('sha256').update(JSON.stringify(canon(row))).digest('hex');
}

console.log('=== VALIDAÇÃO PROFUNDA ===');
const results = { checks: [], mismatches: [] };
const check = (name, ok, detail = '') => {
  results.checks.push({ name, ok, detail });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ── carrega tudo ──
const remote = {}, local = {};
for (const t of ['profiles', 'courses', 'modules', 'lessons', 'achievements', 'email_preferences',
  'lesson_progress', 'quiz_completions', 'course_completions', 'user_achievements',
  'announcements', 'firebase_id_mapping']) {
  remote[t] = await fetchAll(t);
}
local.profiles = readJsonl(path.join(NORM, 'profiles.jsonl'));
local.courses = readJsonl(path.join(CONTENT, 'courses.jsonl'));
local.modules = readJsonl(path.join(CONTENT, 'modules.jsonl'));
local.lessons = readJsonl(path.join(CONTENT, 'lessons.jsonl'));
local.achievements = readJsonl(path.join(CONTENT, 'achievements.jsonl'));
local.email_preferences = readJsonl(path.join(NORM, 'email_preferences.jsonl'));
local.lesson_progress = readJsonl(path.join(NORM, 'lesson_progress.jsonl'));
local.quiz_completions = readJsonl(path.join(NORM, 'quiz_completions.jsonl'));
local.course_completions = readJsonl(path.join(NORM, 'course_completions.jsonl'));
local.user_achievements = readJsonl(path.join(NORM, 'user_achievements.jsonl'));
local.announcements = readJsonl(path.join(NORM, 'announcements.jsonl'));
local.firebase_id_mapping = readJsonl(path.join(NORM, 'firebase_id_mapping.jsonl'));

// ── FASE 9: comparação registro a registro com hash canônico ──
const PKS = {
  profiles: ['id'], courses: ['id'], modules: ['id'], lessons: ['id'], achievements: ['id'],
  email_preferences: ['user_id'], lesson_progress: ['user_id', 'lesson_id'],
  quiz_completions: ['user_id', 'module_id'], course_completions: ['user_id', 'course_id'],
  user_achievements: ['user_id', 'achievement_id'], announcements: ['id'],
  firebase_id_mapping: ['firebase_doc_path']
};
let totalRecords = 0, hashMismatch = 0;
for (const [table, pk] of Object.entries(PKS)) {
  const rIdx = new Map(remote[table].map(r => [pk.map(k => r[k]).join('|'), r]));
  let tableMismatch = 0;
  for (const lrow of local[table]) {
    totalRecords++;
    const key = pk.map(k => lrow[k]).join('|');
    const rrow = rIdx.get(key);
    if (!rrow) { tableMismatch++; results.mismatches.push({ entity: table, id: key, reason: 'ausente no destino' }); continue; }
    // projeta apenas as chaves locais (defaults server-side não contam contra)
    const projected = {}; for (const k of Object.keys(lrow)) projected[k] = rrow[k] ?? null;
    if (hash(projected) !== hash(lrow)) {
      tableMismatch++;
      const diffKeys = Object.keys(lrow).filter(k => hash(lrow[k] ?? null) !== hash((rrow[k] ?? null)));
      results.mismatches.push({ entity: table, id: key, reason: 'hash divergente', fields: diffKeys,
        local: Object.fromEntries(diffKeys.map(k => [k, lrow[k]])),
        remote: Object.fromEntries(diffKeys.map(k => [k, rrow[k] ?? null])) });
    }
  }
  hashMismatch += tableMismatch;
  check(`hashes ${table}`, tableMismatch === 0, tableMismatch ? `${tableMismatch} divergências` : `${local[table].length} registros`);
}
check('TOTAL de registros comparados', true, `${totalRecords}`);

// ── FASE 5: usuários ──
const authUsers = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/backups/firebase/_auth_users.json'), 'utf8'));
check('users: backup auth = profiles', authUsers.length === local.profiles.length && local.profiles.length === remote.profiles.length,
  `81 → ${remote.profiles.length}`);
const emailsOk = local.profiles.every(p => {
  const r = remote.profiles.find(x => x.id === p.id);
  return r && r.email === p.email && r.name === p.name && r.legacy_firebase_uid.length >= 20;
});
check('users: email/nome/uid preservados', emailsOk);

// ── FASE 7: XP global e por usuário ──
const xpLocalMap = new Map(local.profiles.map(p => [p.id, p.xp]));
const xpRemoteMap = new Map(remote.profiles.map(p => [p.id, p.xp]));
let xpUserDiff = 0;
for (const [id, xp] of xpLocalMap) if (xpRemoteMap.get(id) !== xp) xpUserDiff++;
check('xp: global', [...xpRemoteMap.values()].reduce((a, b) => a + b, 0) === [...xpLocalMap.values()].reduce((a, b) => a + b, 0),
  `83.665 esperado`);
check('xp: por usuário (81)', xpUserDiff === 0, xpUserDiff ? `${xpUserDiff} diferenças` : '');

// ── aulas legadas ──
const legacyLessons = local.lessons.filter(l => l.extra?.legacy === true);
const legacyIds = new Set(legacyLessons.map(l => l.id));
const remoteLegacy = remote.lessons.filter(l => l.extra?.legacy === true);
check('aulas legadas preservadas', legacyLessons.length === 18 && remoteLegacy.length === 18,
  `${remoteLegacy.length}/18`);
const currentLessons = local.lessons.length - legacyLessons.length;
check('lições atuais + legadas = total', currentLessons === 277 && local.lessons.length === 295 && remote.lessons.length === 295,
  `${currentLessons} + ${legacyLessons.length} = ${remote.lessons.length}`);

// ── FASE 6: progresso legado ──
const legacyProgressLocal = local.lesson_progress.filter(p => legacyIds.has(p.lesson_id));
const legacyProgressRemote = remote.lesson_progress.filter(p => legacyIds.has(p.lesson_id));
check('progresso em aulas legadas', legacyProgressLocal.length === legacyProgressRemote.length,
  `${legacyProgressRemote.length}/${legacyProgressLocal.length} registros`);

// ── FASE 10: FKs / órfãos ──
const profileIds = new Set(remote.profiles.map(p => p.id));
const courseIds = new Set(remote.courses.map(c => c.id));
const moduleIds = new Set(remote.modules.map(m => m.id));
const lessonIds = new Set(remote.lessons.map(l => l.id));
const achvIds = new Set(remote.achievements.map(a => a.id));
const orphan = (rows, field, universe) => rows.filter(r => r[field] != null && !universe.has(r[field])).length;
check('fk: lesson_progress.user_id', orphan(remote.lesson_progress, 'user_id', profileIds) === 0);
check('fk: lesson_progress.lesson_id', orphan(remote.lesson_progress, 'lesson_id', lessonIds) === 0);
check('fk: lesson_progress.course_id', orphan(remote.lesson_progress, 'course_id', courseIds) === 0);
check('fk: lesson_progress.module_id', orphan(remote.lesson_progress, 'module_id', moduleIds) === 0);
check('fk: quiz/ccourse/user_achv/prefs → users',
  orphan(remote.quiz_completions, 'user_id', profileIds) +
  orphan(remote.course_completions, 'user_id', profileIds) +
  orphan(remote.user_achievements, 'user_id', profileIds) +
  orphan(remote.email_preferences, 'user_id', profileIds) === 0);
check('fk: user_achievements.achievement_id', orphan(remote.user_achievements, 'achievement_id', achvIds) === 0);
check('fk: modules.course_id', orphan(remote.modules, 'course_id', courseIds) === 0);

// ── FASE 11: RLS ──
try {
  const r1 = await fetch(`${BASE}/rest/v1/profiles?select=id`, { headers: { apikey: ANON } });
  const anonProfiles = r1.ok ? await r1.json() : 'erro';
  check('rls: anon não lê profiles', Array.isArray(anonProfiles) && anonProfiles.length === 0, `${Array.isArray(anonProfiles) ? anonProfiles.length : anonProfiles} linhas`);
  const r2 = await fetch(`${BASE}/rest/v1/courses?select=id`, { method: 'HEAD', headers: { apikey: ANON, Prefer: 'count=exact', Range: '0-0' } });
  const n = Number((r2.headers.get('content-range') || '/0').split('/')[1]);
  check('rls: catálogo público legível por anon', n === 12, `${n} cursos`);
} catch (e) { check('rls: teste', false, e.message); }

results.summary = {
  at: new Date().toISOString(),
  totalRecordsCompared: totalRecords,
  hashMismatches: hashMismatch,
  mismatches: results.mismatches.slice(0, 50),
  allOk: results.checks.every(c => c.ok)
};
fs.writeFileSync(path.join(REPORTS, 'deep-validation.json'), JSON.stringify(results.summary, null, 2));
console.log(`\n${results.summary.allOk ? '✓ VALIDAÇÃO PROFUNDA OK' : '✗ DIVERGÊNCIAS ENCONTRADAS'} — ${totalRecords} registros, ${hashMismatch} hashes divergentes`);
process.exit(results.summary.allOk ? 0 : 1);
