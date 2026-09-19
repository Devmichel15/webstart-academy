// ETAPA 5c — Import para Supabase via service_role REST API.
// REQUISITOS:
//   migration/.env.local com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
//   Migrations 001-004 JÁ aplicadas no projeto.
// Idempotente: upsert on_conflict nas PKs. Batches de 500. Nunca roda no browser.
// Uso: node scripts/migration/import-supabase.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NORM = path.join(ROOT, 'migration', 'normalized');
const CONTENT = path.join(NORM, 'content');
const DRY = process.argv.includes('--dry-run');
const BATCH = 500;

// ── env local (fora do Vite, nunca no bundle) ──
// MIGRATION_ENV_FILE aponta para outro ficheiro (ex: staging) — safe para não tocar produção.
function loadEnvLocal() {
  const p = process.env.MIGRATION_ENV_FILE || path.join(ROOT, 'migration', '.env.local');
  if (!fs.existsSync(p)) {
    console.error(`✗ ${p} não encontrado.\n  Crie com:\n    SUPABASE_URL=https://<proj>.supabase.co\n    SUPABASE_SERVICE_ROLE_KEY=<service_role>`);
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local'); process.exit(1);
  }
  return env;
}
const ENV = loadEnvLocal();
const BASE = `${ENV.SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

async function upsert(table, rows, conflictCols) {
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    if (DRY) { total += chunk.length; continue; }
    const res = await fetch(`${BASE}/${table}?on_conflict=${conflictCols}`, {
      method: 'POST',
      headers: {
        apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${table} batch ${i}-${i + chunk.length}: HTTP ${res.status} → ${t.slice(0, 500)}`);
    }
    total += chunk.length;
  }
  return total;
}

function readJsonl(p) {
  const f = path.join(p);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
}

// ── ordem respeita FKs; cada etapa é idempotente e re-executável ──
const STEPS = [
  { table: 'courses',             file: () => readJsonl(path.join(CONTENT, 'courses.jsonl')),            conflict: 'id' },
  { table: 'modules',             file: () => readJsonl(path.join(CONTENT, 'modules.jsonl')),           conflict: 'id' },
  { table: 'lessons',             file: () => readJsonl(path.join(CONTENT, 'lessons.jsonl')),           conflict: 'id' },
  { table: 'achievements',        file: () => readJsonl(path.join(CONTENT, 'achievements.jsonl')),      conflict: 'id' },
  { table: 'profiles',            file: () => readJsonl(path.join(NORM, 'profiles.jsonl')),             conflict: 'id' },
  { table: 'email_preferences',   file: () => readJsonl(path.join(NORM, 'email_preferences.jsonl')),    conflict: 'user_id' },
  { table: 'learning_profiles',   file: () => readJsonl(path.join(NORM, 'learning_profiles.jsonl')),    conflict: 'user_id' },
  { table: 'lesson_progress',     file: () => readJsonl(path.join(NORM, 'lesson_progress.jsonl')),      conflict: 'user_id,lesson_id' },
  { table: 'quiz_completions',    file: () => readJsonl(path.join(NORM, 'quiz_completions.jsonl')),     conflict: 'user_id,module_id' },
  { table: 'course_completions',  file: () => readJsonl(path.join(NORM, 'course_completions.jsonl')),   conflict: 'user_id,course_id' },
  { table: 'user_achievements',   file: () => readJsonl(path.join(NORM, 'user_achievements.jsonl')),    conflict: 'user_id,achievement_id' },
  { table: 'announcements',       file: () => readJsonl(path.join(NORM, 'announcements.jsonl')),        conflict: 'id' },
  { table: 'firebase_id_mapping', file: () => readJsonl(path.join(NORM, 'firebase_id_mapping.jsonl')),  conflict: 'firebase_doc_path' }
];

console.log(DRY ? '=== IMPORT (DRY-RUN — nada será escrito) ===' : '=== IMPORT Supabase ===');
if (!DRY) console.log(`Destino: ${ENV.SUPABASE_URL}`);

const results = {};
for (const step of STEPS) {
  const rows = step.file();
  results[step.table] = await upsert(step.table, rows, step.conflict);
  console.log(`  ✓ ${step.table.padEnd(20)} ${String(results[step.table]).padStart(4)} linhas`);
}

fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'import-summary.json'),
  JSON.stringify({ at: new Date().toISOString(), dryRun: DRY, target: DRY ? null : ENV.SUPABASE_URL, results }, null, 2));

console.log(DRY ? '\n✓ dry-run concluído (nenhuma escrita)' : '\n✓ import concluído — rode validate-migration.mjs');
