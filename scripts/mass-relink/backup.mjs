// Passo 0 — Backup completo (read-only) antes de qualquer alteração.
// Dump de profiles + todas as tabelas relacionadas + auth.users + identity_links.
// Salva em supabase/backups/supabase-backup-<ts>/ como JSON.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadMigrationEnv } from './_env.mjs';

const ENV = loadMigrationEnv();
const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const outDir = path.join(process.cwd(), 'supabase', 'backups', `supabase-backup-${Date.now()}`);

const TABLES = [
  'profiles', 'lesson_progress', 'quiz_completions', 'course_completions',
  'user_achievements', 'learning_profiles', 'email_preferences', 'identity_links',
  'community_projects', 'project_likes', 'project_comments',
];

async function fetchAll(table) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db.from(table).select('*').range(from, from + 999);
    if (error) {
      console.error(`✗ ${table} range ${from}: ${error.message}`);
      return { error: error.message, rows };
    }
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return { rows };
}

async function fetchAuthUsers() {
  const users = [];
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { error: error.message, users };
    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < 1000) break;
    page++;
  }
  return { users };
}

fs.mkdirSync(outDir, { recursive: true });

const started = Date.now();
const summary = {};

for (const table of TABLES) {
  const { rows, error } = await fetchAll(table);
  fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2));
  summary[table] = error ? `ERROR: ${error}` : rows.length;
  console.log(`  ${table}: ${summary[table]}`);
}

const { users, error: authError } = await fetchAuthUsers();
fs.writeFileSync(path.join(outDir, 'auth_users.json'), JSON.stringify(users, null, 2));
summary.auth_users = authError ? `ERROR: ${authError}` : users.length;
console.log(`  auth_users: ${summary.auth_users}`);

const meta = {
  backupDir: outDir,
  at: new Date().toISOString(),
  target: ENV.SUPABASE_URL,
  durationMs: Date.now() - started,
  tables: summary,
};
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(`\n✓ Backup completo em ${outDir}`);
console.log(JSON.stringify(meta.tables, null, 2));