import fs from 'node:fs';
import path from 'node:path';

export function loadMigrationEnv() {
  const p = process.env.MIGRATION_ENV_FILE || path.join(process.cwd(), 'migration', '.env.local');
  if (!fs.existsSync(p)) {
    console.error(`✗ ${p} não encontrado.`);
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em migration/.env.local');
    process.exit(1);
  }
  return env;
}