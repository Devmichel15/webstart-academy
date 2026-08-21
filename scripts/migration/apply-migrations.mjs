// Aplica supabase/migrations/001..004 no banco via DATABASE_URL (role postgres).
// Idempotente por guarda: pula tudo se public.profiles já existir.
// Uso: node scripts/migration/apply-migrations.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = process.cwd();
const FORCE = process.argv.includes('--force');

function envLocal() {
  const env = {};
  for (const line of fs.readFileSync(path.join(ROOT, 'migration', '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}
const ENV = envLocal();
if (!ENV.DATABASE_URL) { console.error('✗ DATABASE_URL ausente em migration/.env.local'); process.exit(1); }

const client = new pg.Client({
  connectionString: ENV.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// guarda de idempotência
const { rows } = await client.query(`select to_regclass('public.profiles') as t`);
if (rows[0].t && !FORCE) {
  console.log(`✓ schema já aplicado (${rows[0].t} existe) — nada a fazer. Use --force para reexecutar.`);
  await client.end();
  process.exit(0);
}

const FILES = ['001_initial_schema.sql', '002_indexes.sql', '003_rls.sql', '004_views_compatibility.sql'];
let failed = null;

for (const f of FILES) {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', f), 'utf8');
  const t0 = Date.now();
  try {
    await client.query('BEGIN');
    // protocolo simples: arquivo inteiro em uma query (sem placeholders)
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✓ ${f} aplicado (${Date.now() - t0}ms)`);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    failed = { file: f, error: e.message, detail: e.detail || '', hint: e.hint || '', where: e.where || '' };
    console.error(`✗ ${f}: ${e.message}`);
    if (failed.detail) console.error(`  detail: ${failed.detail}`);
    break;
  }
}

if (!failed) {
  // inventário pós-aplicação
  const inv = await client.query(`
    select (select count(*) from information_schema.tables where table_schema='public') as tabelas,
           (select count(*) from information_schema.views  where table_schema='public') as views,
           (select count(*) from pg_constraint where contype='f' and connamespace='public'::regnamespace) as fks,
           (select count(*) from pg_indexes where schemaname='public') as indices,
           (select count(*) from pg_policies where schemaname='public') as policies`);
  const r = inv.rows[0];
  console.log(`\ninventário: tabelas=${r.tabelas} views=${r.views} FKs=${r.fks} índices=${r.indices} policies=${r.policies}`);
  fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'migrations-applied.json'),
    JSON.stringify({ at: new Date().toISOString(), files: FILES, inventory: r }, null, 2));
}

await client.end();
process.exit(failed ? 1 : 0);
