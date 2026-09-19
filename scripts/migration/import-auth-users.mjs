// ETAPA 1 (Firebase → Supabase) — Import de auth.users com preservação de passwords.
//
// Porquê este script e não a ferramenta oficial (supabase-community/firebase-to-supabase)?
//   O import_users.js oficial insere encrypted_password = '' (password vazia) e depende de um
//   middleware "work-in-progress". O GoTrue (Supabase Auth) suporta NATIVAMENTE hashes scrypt do
//   Firebase no formato $fbscrypt$ (ver supabase/auth internal/crypto/password.go). Este script
//   constrói esse formato a partir do export de Firebase Auth (que traz passwordHash + salt) e
//   dos parâmetros de hash do projeto (base64_signer_key, base64_salt_separator, rounds, mem_cost).
//
// REQUISITOS:
//   - migration/<env>.local com DATABASE_URL (Postgres, pooler ou direto)
//   - migration/firebase-hash-params.json (gitignored) OU env FIREBASE_HASH_PARAMS (JSON)
//   - export de auth do Firebase: `firebase auth:export users.json --format=json`
//
// USO:
//   node scripts/migration/import-auth-users.mjs --file <export.json>            # dry-run
//   node scripts/migration/import-auth-users.mjs --file <export.json> --run      # executa
//   MIGRATION_ENV_FILE=<staging.env> ...                                         # aponta ao staging
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

const ROOT = process.cwd();
const RUN = process.argv.includes('--run');
const FILE_IDX = process.argv.indexOf('--file');
const EXPORT_FILE = FILE_IDX > -1
  ? process.argv[FILE_IDX + 1]
  : path.join(ROOT, 'migration', 'backups', 'firebase', 'auth_export.json');
const CONFIRM_ALL = !process.argv.includes('--respect-verified');

// ── env (staging via MIGRATION_ENV_FILE; senão .env.local) ──
function loadEnv() {
  const p = process.env.MIGRATION_ENV_FILE || path.join(ROOT, 'migration', '.env.local');
  if (!fs.existsSync(p)) { console.error(`✗ env não encontrado: ${p}`); process.exit(1); }
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!env.DATABASE_URL) { console.error('✗ DATABASE_URL ausente no env'); process.exit(1); }
  return env;
}

// ── parâmetros de hash do projeto Firebase (Console → Authentication → Users → ⋮) ──
function loadHashParams() {
  const file = process.env.FIREBASE_HASH_PARAMS_FILE || path.join(ROOT, 'migration', 'firebase-hash-params.json');
  let raw = process.env.FIREBASE_HASH_PARAMS;
  if (!raw && fs.existsSync(file)) raw = fs.readFileSync(file, 'utf8');
  if (!raw) {
    console.error('✗ Parâmetros de hash ausentes. Cria migration/firebase-hash-params.json:\n' +
      '  { "base64_signer_key": "...", "base64_salt_separator": "...", "rounds": 8, "mem_cost": 14, "threads": 1 }');
    process.exit(1);
  }
  const p = JSON.parse(raw);
  for (const k of ['base64_signer_key', 'base64_salt_separator']) {
    if (!p[k]) { console.error(`✗ hash params: campo ${k} em falta`); process.exit(1); }
  }
  return {
    signerKey: p.base64_signer_key,
    saltSeparator: p.base64_salt_separator,
    rounds: Number(p.rounds) || 8,
    memCost: Number(p.mem_cost) || 14,
    threads: Number(p.threads) || 1,
  };
}

// normaliza qualquer base64 (std ou url-safe) para std base64 (o que o GoTrue faz decode)
function b64std(s) {
  let t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return t;
}

// $fbscrypt$v=1,n=<memCost>,r=<rounds>,p=<threads>,ss=<saltSep>,sk=<signerKey>$<salt>$<hash>
function buildFbScrypt(passwordHash, salt, hp) {
  return `$fbscrypt$v=1,n=${hp.memCost},r=${hp.rounds},p=${hp.threads},` +
    `ss=${b64std(hp.saltSeparator)},sk=${b64std(hp.signerKey)}$${b64std(salt)}$${b64std(passwordHash)}`;
}

const ms = (v) => (v ? new Date(Number(v)) : null);

function buildUser(u, hp) {
  const isPassword = Boolean(u.passwordHash && u.salt);
  const provider = isPassword ? 'email' : 'google';
  const id = randomUUID();
  const email = (u.email || '').trim().toLowerCase();
  const meta = u.providerUserInfo?.[0] || {};
  const name = u.displayName || meta.displayName || (email.split('@')[0]);
  const picture = u.photoUrl || meta.photoUrl || null;

  const userMeta = {
    sub: isPassword ? id : (meta.rawId || id),
    name,
    email,
    provider,
    email_verified: CONFIRM_ALL ? true : Boolean(u.emailVerified),
    phone_verified: false,
    legacy_firebase_uid: u.localId,
  };
  if (picture) userMeta.avatar_url = picture;

  const identityData = { ...userMeta };
  if (!isPassword && meta.rawId) {
    identityData.iss = 'https://accounts.google.com';
    identityData.full_name = name;
    identityData.picture = picture;
    identityData.avatar_url = picture;
    identityData.provider_id = meta.rawId;
  }

  return {
    id,
    email,
    provider,
    localId: u.localId,
    encrypted_password: isPassword ? buildFbScrypt(u.passwordHash, u.salt, hp) : null,
    email_confirmed_at: (CONFIRM_ALL || u.emailVerified) ? (ms(u.createdAt) || new Date()) : null,
    last_sign_in_at: ms(u.lastSignedInAt),
    created_at: ms(u.createdAt) || new Date(),
    app_meta: { provider, providers: [provider], legacy_firebase_uid: u.localId },
    user_meta: userMeta,
    identity: {
      id: randomUUID(),
      provider,
      provider_id: isPassword ? id : (meta.rawId || id),
      identity_data: identityData,
    },
    hasHash: isPassword,
  };
}

const hp = loadHashParams();
const ENV = loadEnv();
if (!fs.existsSync(EXPORT_FILE)) { console.error(`✗ export não encontrado: ${EXPORT_FILE}`); process.exit(1); }
const exported = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
const src = Array.isArray(exported) ? exported : (exported.users || []);
const rows = src.filter(u => u && u.email).map(u => buildUser(u, hp));

console.log(RUN ? '=== IMPORT AUTH (RUN) ===' : '=== IMPORT AUTH (DRY-RUN — nada será escrito) ===');
console.log(`export: ${EXPORT_FILE}`);
console.log(`users: ${src.length} | com email: ${rows.length} | com password ($fbscrypt$): ${rows.filter(r => r.hasHash).length} | google: ${rows.filter(r => !r.hasHash).length}`);
console.log(`confirm-all (email_confirmed_at): ${CONFIRM_ALL}`);
if (rows[0]?.hasHash) console.log(`exemplo hash: ${rows[0].encrypted_password.slice(0, 70)}...`);

const client = new Client({ connectionString: ENV.DATABASE_URL, connectionTimeoutMillis: 15000, query_timeout: 30000, statement_timeout: 30000 });
const hard = setTimeout(() => { console.error('HARD TIMEOUT'); process.exit(3); }, 180000);
console.log(`DB: ${new URL(ENV.DATABASE_URL).host}`);
await client.connect();

const existing = new Set(
  (await client.query('select lower(email) as e from auth.users where email is not null')).rows.map(r => r.e)
);

const report = { at: new Date().toISOString(), mode: RUN ? 'run' : 'dry-run', export: EXPORT_FILE, total: rows.length, inserted: 0, skippedExisting: 0, withHash: 0, google: 0, errors: [] };

try {
  if (RUN) await client.query('begin');
  for (const r of rows) {
    if (existing.has(r.email)) { report.skippedExisting++; continue; }
    if (!RUN) { report.inserted++; r.hasHash ? report.withHash++ : report.google++; continue; }
    try {
      const ures = await client.query(
        `insert into auth.users
          (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, email_change_confirm_status,
           raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user, is_anonymous,
           created_at, updated_at, last_sign_in_at, phone_change, phone_change_token)
         values
          ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, $3, $4,
           '', '', '', '', '', 0,
           $5::jsonb, $6::jsonb, false, false, false,
           $7, now(), $8, '', '')
         returning id`,
        [r.id, r.email, r.encrypted_password, r.email_confirmed_at,
          JSON.stringify(r.app_meta), JSON.stringify(r.user_meta), r.created_at, r.last_sign_in_at]
      );
      const uid = ures.rows[0].id;
      await client.query(
        `insert into auth.identities (id, user_id, provider, provider_id, identity_data, email, created_at, updated_at)
         values ($1, $2, $3, $4, $5::jsonb, $6, now(), now())`,
        [r.identity.id, uid, r.identity.provider, r.identity.provider_id, JSON.stringify(r.identity.identity_data), r.email]
      );
      report.inserted++;
      r.hasHash ? report.withHash++ : report.google++;
    } catch (e) {
      report.errors.push({ email: r.email, error: String(e.message).slice(0, 200) });
    }
  }
  if (RUN) await client.query('commit');
} catch (e) {
  if (RUN) await client.query('rollback').catch(() => {});
  console.error('✗ transação abortada:', e.message);
  report.errors.push({ fatal: e.message });
}

const final = (await client.query('select count(*)::int as n from auth.users')).rows[0].n;
const withPw = (await client.query("select count(*)::int as n from auth.users where encrypted_password like '$fbscrypt$%'")).rows[0].n;
const withIdentity = (await client.query('select count(*)::int as n from auth.identities')).rows[0].n;
report.authUsersTotal = final;
report.fbscryptPasswords = withPw;
report.identitiesTotal = withIdentity;

fs.mkdirSync(path.join(ROOT, 'migration', 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'auth-import-summary.json'), JSON.stringify(report, null, 2));
console.log(`\nresumo: inserted=${report.inserted} skipped=${report.skippedExisting} comHash=${report.withHash} google=${report.google} erros=${report.errors.length}`);
console.log(`auth.users=${final} | $fbscrypt$=${withPw} | identities=${withIdentity}`);
if (report.errors.length) console.log('erros (ver migration/reports/auth-import-summary.json):\n  ' + report.errors.slice(0, 8).map(e => e.email + ': ' + e.error).join('\n  '));
console.log(RUN ? '\n✓ import executado' : '\n✓ dry-run concluído (nada escrito)');
clearTimeout(hard);
client.end().catch(() => {});
process.exit(report.errors.length ? 1 : 0);