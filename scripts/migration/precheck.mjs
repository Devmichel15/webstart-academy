// FASE 1 — Pré-verificação SEM service_role (anon key apenas).
// Verifica: conectividade, tabelas/views aplicadas, RLS ativa, backup legível.
// NÃO imprime segredos. Uso: node scripts/migration/precheck.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ok = []; const fail = [];
const mark = (cond, label, extra = '') => {
  (cond ? ok : fail).push(label);
  console.log(`${cond ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
};

function parseEnv(file) {
  const env = {};
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}
const localEnv = parseEnv('migration/.env.local');
const appEnv = parseEnv('.env');

// ── credenciais ──
const SRK = localEnv.SUPABASE_SERVICE_ROLE_KEY || '';
const srkConfigured = !!SRK && SRK !== 'COLE_A_SERVICE_ROLE_KEY_AQUI';
mark(srkConfigured, 'credentials: service_role configurada',
  srkConfigured ? '' : 'PLACEHOLDER em migration/.env.local');
mark(!!appEnv.VITE_SUPABASE_ANON_KEY, 'credentials: anon key presente (.env)');
mark(!!localEnv.SUPABASE_URL, 'config: SUPABASE_URL presente');
console.log(`target host: ${new URL(localEnv.SUPABASE_URL || 'https://invalid.invalid').host}`);

// ── conectividade + existência de tabelas/views (anon) ──
// Obs.: o endpoint raiz /rest/v1/ exige service_role ("Invalid API key" p/ anon
// é comportamento normal). Existência real = ausência de PGRST205 na tabela.
const BASE = (localEnv.SUPABASE_URL || '').replace(/\/$/, '');
const AK = appEnv.VITE_SUPABASE_ANON_KEY;
let reachable = false;
try {
  const res = await fetch(`${BASE}/rest/v1/profiles?select=id`, { headers: { apikey: AK } });
  reachable = true;
  mark(true, 'connection: successful (gateway responde)', `HTTP ${res.status}`);
} catch (e) {
  mark(false, 'connection: successful', e.message);
}

const TABLES = ['profiles', 'email_preferences', 'learning_profiles', 'firebase_id_mapping',
  'courses', 'modules', 'lessons', 'achievements',
  'lesson_progress', 'quiz_completions', 'course_completions', 'user_achievements',
  'xp_transactions', 'email_events', 'announcements'];
const VIEWS = ['v_profile_completed_lessons', 'v_profile_completed_courses',
  'v_profile_completed_quizzes', 'v_user_profile_compat'];

async function exists(table) {
  try {
    const r = await fetch(`${BASE}/rest/v1/${table}?select=*`, {
      method: 'HEAD',
      headers: { apikey: AK, Prefer: 'count=exact', Range: '0-0' }
    });
    if (r.status === 404) return { exists: false, count: null };
    const cr = r.headers.get('content-range');
    return { exists: true, count: cr ? Number(cr.split('/')[1]) : null };
  } catch { return { exists: false, count: null }; }
}

if (reachable) {
  let missingT = [];
  for (const t of TABLES) {
    const r = await exists(t);
    if (!r.exists) missingT.push(t);
  }
  let missingV = [];
  for (const v of VIEWS) {
    const r = await exists(v);
    if (!r.exists) missingV.push(v);
  }
  mark(missingT.length === 0, 'schema: 15 tabelas presentes', missingT.length ? `faltam ${missingT.length}/${TABLES.length} (${missingT.slice(0,3).join(',')}…) → aplique as migrations` : '');
  mark(missingV.length === 0, 'schema: 4 compatibility views presentes', missingV.length ? `faltam ${missingV.length}/4 → migration 004` : '');

  if (!missingT.includes('courses')) {
    for (const t of ['courses', 'modules', 'lessons', 'achievements']) {
      const r = await exists(t);
      mark(r.count !== null && !Number.isNaN(r.count), `dados: ${t}`, `linhas=${r.count}`);
    }
  }

  // RLS prova: anon NÃO pode ler perfis de outros usuários
  if (!missingT.includes('profiles')) {
    try {
      const r = await fetch(`${BASE}/rest/v1/profiles?select=id`, { headers: { apikey: AK } });
      const rows = r.ok ? await r.json() : null;
      const secure = Array.isArray(rows) && rows.length === 0;
      mark(secure, 'RLS: anon bloqueado em profiles', `retornou ${Array.isArray(rows) ? rows.length : 'erro'} linhas`);
    } catch (e) { mark(false, 'RLS: anon bloqueado em profiles', e.message); }
  }
}

// ── backup Firebase legível ──
const IN = path.join(ROOT, 'migration', 'backups', 'firebase');
const EXPECT = { 'users.json': 81, 'user_progress.json': 354, 'user_achievements.json': 188, 'announcements.json': 1, '_auth_users.json': 81 };
for (const [f, n] of Object.entries(EXPECT)) {
  try {
    const rows = JSON.parse(fs.readFileSync(path.join(IN, f), 'utf8'));
    mark(Array.isArray(rows) && rows.length === n, `backup: ${f}`, `${rows.length}/${n}`);
  } catch (e) { mark(false, `backup: ${f}`, e.message); }
}
mark(fs.existsSync(path.join(IN, '_manifest.json')), 'backup: manifest sha256 presente');

console.log('\n───────────────────────────────');
console.log(`pré-verificação: ${ok.length} ✓ · ${fail.length} ✗`);
if (fail.length) console.log(`BLOQUEIOS:\n - ${fail.join('\n - ')}`);
process.exit(fail.length ? 1 : 0);
