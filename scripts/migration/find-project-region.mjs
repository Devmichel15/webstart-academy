// Conecta no pooler de cada região até achar a do projeto (tenant = postgres.<ref>).
// Uso: node scripts/migration/find-project-region.mjs
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = process.cwd();
const env = {};
for (const line of fs.readFileSync(path.join(ROOT, 'migration', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const url = new URL(env.DATABASE_URL);
const pwd = decodeURIComponent(url.password);

const PREFIXES = ['aws-0', 'aws-1', 'aws-2'];
const REGIONS = ['sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1', 'eu-central-1', 'eu-west-1',
  'eu-west-2', 'eu-north-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1'];

for (const prefix of PREFIXES) {
  for (const region of REGIONS) {
    const cs = `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@${prefix}-${region}.pooler.supabase.com:5432/postgres`;
    const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 });
    try {
      await client.connect();
      const r = await client.query('select current_user as u');
      console.log(`✓ REGIÃO ENCONTRADA: ${prefix}-${region} (conectado como ${r.rows[0].u})`);
      fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'pooler-region.txt'), `${prefix}-${region}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      const msg = String(e.message).slice(0, 90).replace(/\n/g, ' ');
      if (!/not found/i.test(msg)) console.log(`${prefix}-${region.padEnd(14)} ? ${msg}`);
      try { await client.end(); } catch {}
    }
  }
  console.log(`— varredura ${prefix} concluída`);
}
console.error('✗ região não encontrada nas candidatas');
process.exit(1);
