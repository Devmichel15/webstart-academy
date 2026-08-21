// Patch pontual: adiciona total_study_time_legacy em profiles (espelhado no 001).
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
const r = await client.query(`select column_name from information_schema.columns
                              where table_schema='public' and table_name='profiles'
                                and column_name='total_study_time_legacy'`);
console.log(r.rows.length ? '✓ coluna total_study_time_legacy presente' : '✗ falhou');
await client.end();
process.exit(r.rows.length ? 0 : 1);
