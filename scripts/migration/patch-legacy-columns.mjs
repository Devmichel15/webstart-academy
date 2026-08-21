// Patch: colunas *_legacy para preservação byte-exata de valores string corrompidos.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = process.cwd();
const env = {};
for (const line of fs.readFileSync(path.join(ROOT, 'migration', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query('alter table public.profiles add column if not exists total_study_time_legacy text');
await client.query('alter table public.lesson_progress add column if not exists time_spent_legacy text');
const r = await client.query(`select table_name, column_name from information_schema.columns
                              where table_schema='public'
                                and (column_name in ('total_study_time_legacy','time_spent_legacy'))
                              order by table_name`);
for (const row of r.rows) console.log(`✓ ${row.table_name}.${row.column_name}`);
await client.end();
process.exit(r.rows.length === 2 ? 0 : 1);
