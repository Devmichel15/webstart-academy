// Aplica migrations "pendentes" (005..009 por padrão) no destino via DATABASE_URL.
// Idempotente: registra cada arquivo em public.schema_migrations (tabela própria).
// Detecta aplicação manual prévia (ex.: RUN_THIS.sql) via tabela-guarda por arquivo.
// Uso:
//   node scripts/migration/apply-pending.mjs               # aplica 005..009
//   node scripts/migration/apply-pending.mjs --force       # reexecuta mesmo se registrado
//   node scripts/migration/apply-pending.mjs --from 009    # aplica a partir de 009
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';

const ROOT = process.cwd();
const FORCE = process.argv.includes('--force');
const fromIdx = process.argv.indexOf('--from');
const FROM = fromIdx > -1 ? Number(process.argv[fromIdx + 1]) : 5;
if (!Number.isInteger(FROM)) {
  console.error('✗ --from precisa ser um número (ex.: 009)');
  process.exit(1);
}

// tabela que "prova" que um arquivo já foi aplicado à mão (ex.: RUN_THIS.sql)
const GUARD_TABLES = {
  '005_community_feed.sql': 'public.community_projects',
  '006_community_migration_validation.sql': 'public.community_projects',
  '009_identity_link.sql': 'public.identity_links',
  // 007/008 usam add column if not exists → sempre seguros de reexecutar
};

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

await client.query(`
  create table if not exists public.schema_migrations (
    filename   text primary key,
    applied_at timestamptz not null default now(),
    sha256     text
  );
`);

const files = fs.readdirSync(path.join(ROOT, 'supabase', 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .map((f) => ({ name: f, n: Number.parseInt(f.split('_')[0], 10) }))
  .filter((f) => Number.isInteger(f.n) && f.n >= FROM)
  .sort((a, b) => a.n - b.n);

if (files.length === 0) {
  console.log('nenhum arquivo pendente para aplicar.');
  await client.end();
  process.exit(0);
}

const recorded = new Set();
if (!FORCE) {
  const { rows } = await client.query('select filename from public.schema_migrations');
  for (const r of rows) recorded.add(r.filename);
}

let failed = null;
const appliedNow = [];
const skipped = [];

for (const f of files) {
  if (recorded.has(f.name)) {
    console.log(`↷ ${f.name} já registrado em schema_migrations (skip)`);
    skipped.push({ file: f.name, reason: 'recorded' });
    continue;
  }

  const guard = GUARD_TABLES[f.name];
  if (guard) {
    const { rows } = await client.query('select to_regclass($1) as t', [guard]);
    if (rows[0].t) {
      // aplicado manualmente fora do pipeline → apenas registra
      await client.query('insert into public.schema_migrations (filename, sha256) values ($1, $2) on conflict do nothing', [f.name, 'manual']);
      console.log(`↷ ${f.name} já aplicado (${guard} existe — registrado como manual)`);
      skipped.push({ file: f.name, reason: 'manual' });
      continue;
    }
  }

  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', f.name), 'utf8');
  const hash = createHash('sha256').update(sql).digest('hex');
  const t0 = Date.now();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'insert into public.schema_migrations (filename, applied_at, sha256) values ($1, now(), $2) on conflict (filename) do nothing',
      [f.name, hash]
    );
    await client.query('COMMIT');
    console.log(`✓ ${f.name} aplicado (${Date.now() - t0}ms)`);
    appliedNow.push(f.name);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    failed = { file: f.name, error: e.message, detail: e.detail || '', hint: e.hint || '', where: e.where || '' };
    console.error(`✗ ${f.name}: ${e.message}`);
    if (failed.detail) console.error(`  detail: ${failed.detail}`);
    break;
  }
}

// inventário pós-aplicação (apenas se nada falhou)
if (!failed) {
  const { rows } = await client.query(`
    select
      (select count(*) from pg_policies where schemaname='public') as policies,
      (select count(*) from public.schema_migrations)                as applied
  `);
  fs.mkdirSync(path.join(ROOT, 'migration', 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, 'migration', 'reports', 'apply-pending-summary.json'),
    JSON.stringify({ at: new Date().toISOString(), from: FROM, applied: appliedNow, skipped, inventory: rows[0], failed: null }, null, 2)
  );
  console.log(`\ninventário: policies=${rows[0].policies} migrations registradas=${rows[0].applied}`);
}

await client.end();
process.exit(failed ? 1 : 0);