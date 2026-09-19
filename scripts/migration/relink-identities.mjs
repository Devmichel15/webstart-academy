// B1 — Re-ligação server-side de identidade (auth.users ↔ perfis legados Firebase).
// Etapa pós-cutover: garante que TODOS os auth.users tenham o histórico migrado
// copiado para o perfil keyed por auth.uid() (via rpc link_legacy_profile, que é
// idempotente e não-destrutiva — ver supabase/migrations/009).
//
// REQUISITOS: migration/.env.local com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Uso:
//   node scripts/migration/relink-identities.mjs          # dry-run (default)
//   node scripts/migration/relink-identities.mjs --run    # executa de verdade
//   node scripts/migration/relink-identities.mjs --run --limit 50
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const RUN = process.argv.includes('--run');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx > -1 ? Number(process.argv[limitIdx + 1]) : Infinity;

function loadEnvLocal() {
  const p = process.env.MIGRATION_ENV_FILE || path.join(ROOT, 'migration', '.env.local');
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
    console.error('✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local');
    process.exit(1);
  }
  return env;
}
const ENV = loadEnvLocal();
const admin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const DB = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log(RUN ? `=== RE-LINK (RUN — ${ENV.SUPABASE_URL}) ===` : '=== RE-LINK (DRY-RUN — nada será escrito) ===');

// ── lista todos os auth.users paginado ──
const users = [];
let page = 1;
for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error('✗ Erro ao listar auth.users:', error.message); process.exit(2); }
  users.push(...(data?.users || []));
  if (!data?.users?.length || data.users.length < 1000 || users.length >= LIMIT) break;
  page++;
}
const targets = LIMIT === Infinity ? users : users.slice(0, LIMIT);
console.log(`  auth.users: ${targets.length} (de ${users.length})\n`);

// ── mapeia perfis legados p/ relatório de pendências ──
function mask(id) {
  const s = String(id);
  return s.length <= 10 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

async function mapPool(items, worker, concurrency = 5) {
  let i = 0;
  const results = [];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results.push(await worker(items[idx]));
    }
  });
  await Promise.all(workers);
  return results;
}

const stats = { linked: 0, linkedEmail: 0, newUser: 0, alreadyLinked: 0, error: 0, waitedForAuthProfile: 0 };
const errors = [];
const samples = [];

await mapPool(targets, async (u) => {
  const uid = u.id;
  const firebaseUid = u.user_metadata?.legacy_firebase_uid || u.app_metadata?.legacy_firebase_uid || null;
  let result = 'error';

  if (!RUN) {
    // dry-run: apenas diagnostica a zona (vazio? legacy existente por email?)
    const { data: profile } = await DB.from('profiles').select('id, xp, legacy_firebase_uid, email, completed_lessons').eq('id', uid).maybeSingle();
    if (profile) {
      result = 'new';
    } else {
      const { data: legacy } = await DB.from('profiles')
        .select('id, legacy_firebase_uid, xp')
        .eq('email', u.email)
        .neq('id', uid)
        .order('xp', { ascending: false })
        .limit(1)
        .maybeSingle();
      result = legacy ? 'link_candidate' : 'no_legacy';
    }
  } else {
    try {
      const { error } = await DB.rpc('link_legacy_profile', {
        p_auth_uid: uid,
        p_firebase_uid: firebaseUid,
      });
      if (error) {
        if (error.code === 'PGRST116' || /no rows|matching|auth_user_id/.test(error.message)) {
          result = 'error';
        } else {
          throw error;
        }
      } else {
        // classifica após o vínculo
        const { data: link } = await DB.from('identity_links').select('match_source').eq('auth_uid', uid).maybeSingle();
        result = link ? (link.match_source === 'email' ? 'linked_email' : 'linked') : 'profiled';
      }
    } catch (err) {
      errors.push({ uid: mask(uid), email: (u.email || '').slice(0, 40), error: String(err.message).slice(0, 300) });
    }
  }

  switch (result) {
    case 'link_candidate':
    case 'linked': stats.linked++; break;
    case 'linked_email': stats.linkedEmail++; break;
    case 'no_legacy': stats.newUser++; break;
    case 'profiled':
    case 'new': stats.alreadyLinked++; break;
    case 'error': stats.error++; break;
    case 'waitedForAuthProfile': stats.waitedForAuthProfile++; break;
  }
  if (result === 'link_candidate' || result === 'linked' || result === 'linked_email') {
    if (samples.length < 10) samples.push({ uid: mask(uid), email: (u.email || '').slice(0, 40), result });
  }
});

// ── relatório ──
const report = {
  at: new Date().toISOString(),
  mode: RUN ? 'run' : 'dry-run',
  target: RUN ? ENV.SUPABASE_URL : null,
  total: targets.length,
  stats,
  sampleLinks: samples,
  errors,
};
fs.mkdirSync(path.join(ROOT, 'migration', 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'relink-report.json'), JSON.stringify(report, null, 2));

console.table(stats);
if (samples.length) {
  console.log('amostra de ligações:');
  for (const s of samples) console.log(`  ${s.result.padEnd(14)} ${s.uid}  ${s.email}`);
}
if (errors.length) console.log(`erros: ${errors.length} (ver migration/reports/relink-report.json)`);
console.log(`\nrelatório: migration/reports/relink-report.json`);
process.exit(errors.length ? 1 : 0);