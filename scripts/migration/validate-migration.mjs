// ETAPA 6 — Validação pós-import: contagens e somas de controle (DB vs JSONL local).
// Uso: node scripts/migration/validate-migration.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NORM = path.join(ROOT, 'migration', 'normalized');
const CONTENT = path.join(NORM, 'content');

function loadEnvLocal() {
  const p = path.join(ROOT, 'migration', '.env.local');
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}
const ENV = loadEnvLocal();
const BASE = `${ENV.SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

async function dbStats(table) {
  // count exato via Head com Prefer count=exact
  const res = await fetch(`${BASE}/${table}?select=*`, {
    method: 'HEAD',
    headers: {
      apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0'
    }
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  const cr = res.headers.get('content-range'); // "0-0/354"
  return { count: Number((cr || '/0').split('/')[1]) };
}

async function dbSum(table, column) {
  const res = await fetch(`${BASE}/${table}?select=${column}`, {
    headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` }
  });
  if (!res.ok) throw new Error(`${table}.${column}: HTTP ${res.status}`);
  const rows = await res.json();
  return rows.reduce((s, r) => s + (Number(r[column]) || 0), 0);
}

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
}
const localRows = (dir, f) => readJsonl(path.join(dir, f));
function sumBy(rows, col) { return rows.reduce((s, r) => s + (Number(r[col]) || 0), 0); }

console.log('=== VALIDAÇÃO MIGRAÇÃO ===');
let ok = true;
const report = [];

const CHECKS = [
  ['courses', path.join(CONTENT, 'courses.jsonl')],
  ['modules', path.join(CONTENT, 'modules.jsonl')],
  ['lessons', path.join(CONTENT, 'lessons.jsonl')],
  ['achievements', path.join(CONTENT, 'achievements.jsonl')],
  ['profiles', path.join(NORM, 'profiles.jsonl')],
  ['email_preferences', path.join(NORM, 'email_preferences.jsonl')],
  ['learning_profiles', path.join(NORM, 'learning_profiles.jsonl')],
  ['lesson_progress', path.join(NORM, 'lesson_progress.jsonl')],
  ['quiz_completions', path.join(NORM, 'quiz_completions.jsonl')],
  ['course_completions', path.join(NORM, 'course_completions.jsonl')],
  ['user_achievements', path.join(NORM, 'user_achievements.jsonl')],
  ['announcements', path.join(NORM, 'announcements.jsonl')],
  ['firebase_id_mapping', path.join(NORM, 'firebase_id_mapping.jsonl')]
];

for (const [table, file] of CHECKS) {
  const local = localRows(path.dirname(file), path.basename(file)).length;
  const remote = (await dbStats(table)).count;
  const match = local === remote;
  if (!match) ok = false;
  report.push({ table, local, remote, match });
}

// somas de controlhe — xp total deve bater exatamente (backup: 83.665)
const profilesLocal = readJsonl(path.join(NORM, 'profiles.jsonl'));
const xpLocal = sumBy(profilesLocal, 'xp');
const xpRemote = await dbSum('profiles', 'xp');
if (xpLocal !== xpRemote) ok = false;
report.push({ check: 'sum(profiles.xp)', local: xpLocal, remote: xpRemote });

// progresso concluído
const progLocal = localRows(NORM, 'lesson_progress.jsonl').filter(r => r.completed).length;
const resProg = await fetch(`${BASE}/lesson_progress?select=user_id&completed=eq.true`, {
  method: 'HEAD',
  headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'count=exact', Range: '0-0' }
});
const crProg = resProg.headers.get('content-range');
const progRemote = Number((crProg || '/0').split('/')[1]);
if (progLocal !== progRemote) ok = false;
report.push({ table: 'lesson_progress(completed=true)', local: progLocal, remote: progRemote });

fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'validation-summary.json'),
  JSON.stringify({ at: new Date().toISOString(), ok, report }, null, 2));

for (const r of report) console.log(`  ${(r.match ?? (r.local === r.remote)) ? '✓' : '✗'} ${String(r.table ?? r.check).padEnd(30)} local=${r.local} db=${r.remote}`);
console.log(ok ? '\n✓ VALIDAÇÃO OK — nada perdido' : '\n✗ DIVERGÊNCIA ENCONTRADA — não prosseguir para cutover');
process.exit(ok ? 0 : 1);
