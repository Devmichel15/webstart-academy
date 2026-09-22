// Passo 3 — Re-link em lote dos casos SEGUROS.
// Para cada auth user com um perfil legado migrado (mesmo email) que tenha dados
// reais e AUT_USER_ID ainda NULL, atualiza o perfil migrado para
// auth_user_id = <uid do auth user> (mesmo padrão de re-link usado antes).
//
// Segurança:
//  - Dry-run por omissão: `--run` para gravar.
//  - Transação por usuário (um erro não corrompe os outros).
//  - NÃO toca em casos divergentes (ativo com dados reais) — apenas reporta.
//  - NÃO apaga NENHUM perfil.
//  - Log completo por operação (email, IDs, sucesso/erro).
//
// Uso:
//   node scripts/mass-relink/batch-relink.mjs                 # dry-run
//   node scripts/mass-relink/batch-relink.mjs --run           # executa
//   node scripts/mass-relink/batch-relink.mjs --run --limit N
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadMigrationEnv } from './_env.mjs';

const ENV = loadMigrationEnv();
const RUN = process.argv.includes('--run');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx > -1 ? Number(process.argv[limitIdx + 1]) : Infinity;

const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const isV5 = (id) => id && String(id).split('-')[2]?.[0] === '5';
const isLegacy = (p) => !!p.legacy_firebase_uid && isV5(p.id);
const HARD_DATA = (p) =>
  (p.xp || 0) > 0 || (p.streak || 0) > 0 ||
  [p.completed_lessons, p.completed_courses, p.completed_quizzes].some(
    (a) => Array.isArray(a) && a.length > 0) ||
  (p.total_study_time || 0) > 0 || (p.completed_exercises || 0) > 0 ||
  (p.completed_projects || 0) > 0;

console.log(RUN ? `=== RE-LINK EM MASSA (RUN — ${ENV.SUPABASE_URL}) ===` : '=== RE-LINK EM MASSA (DRY-RUN — nada será escrito) ===');

// ── 1) lista auth users ──
const users = [];
let page = 1;
for (;;) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error(`✗ listUsers: ${error.message}`); process.exit(2); }
  users.push(...(data?.users || []));
  if (!data?.users?.length || data.users.length < 1000) break;
  page++;
}
const targets = LIMIT === Infinity ? users : users.slice(0, LIMIT);
console.log(`  auth users: ${targets.length}\n`);

const log = [];
const stats = { seguro_executado: 0, seguro_dryrun: 0, divergente: 0, ok_linked: 0, sem_dados: 0, sem_perfil: 0, erro: 0 };

async function handle(uid, email) {
  const nemail = (email || '').trim().toLowerCase();
  const entry = { email: email || '', uid, resultado: 'pending' };

  try {
    // perfis que correspondem a este auth user: ligeiramente exceção: abranger email
    const { data: matches, error: e1 } = await db.from('profiles').select('*').ilike('email', nemail);
    if (e1) throw new Error(`select profiles: ${e1.message}`);

    const legacy = (matches || []).filter(isLegacy);
    const legacyData = legacy.filter(HARD_DATA);

    // Perfil detectável pelo app: id = uid OU auth_user_id = uid
    const { data: resolvable, error: e2 } = await db.from('profiles')
      .select('*').or(`id.eq.${uid},auth_user_id.eq.${uid}`);
    if (e2) throw new Error(`select resolvable: ${e2.message}`);

    const resolved = (resolvable || []).find((p) => p.id === uid && !HARD_DATA(p)) ||
      (resolvable || [])[0];
    const resolvedHasData = resolved ? HARD_DATA(resolved) : false;

    // jÃ¡ linkado/OK?
    if (resolved && resolvedHasData) {
      entry.resultado = 'ok_linked';
      stats.ok_linked++;
      log.push(entry);
      return;
    }

    // caso divergente: o perfil ativo (id=uid) tem dados reais E existe legado com dados
    const activeHasData = (resolvable || []).some((p) => p.id === uid && HARD_DATA(p));
    if (activeHasData && legacyData.length) {
      entry.resultado = 'divergente';
      entry.ativos = (resolvable || []).map((p) => ({ id: p.id, xp: p.xp, lessons: (p.completed_lessons || []).length, auth: p.auth_user_id }));
      entry.legados = legacyData.map((p) => ({ id: p.id, xp: p.xp, lessons: (p.completed_lessons || []).length }));
      stats.divergente++;
      log.push(entry);
      return;
    }

    if (!legacyData.length) {
      entry.resultado = 'sem_dados_seguros';
      stats[resolved ? 'sem_dados' : 'sem_perfil']++;
      entry.nota = resolved ? `perfil existente sem dados (xp=${resolved.xp}, lessons=${(resolved.completed_lessons || []).length})` : 'nenhum perfil legado com dados encontrado';
      log.push(entry);
      return;
    }

    // ── RE-LINK SEGURO ──
    const target = legacyData[0];
    entry.legado = { id: target.id, xp: target.xp, lessons: (target.completed_lessons || []).length, streak: target.streak };

    // não sobreescrever um vínculo já existente para outro auth user
    if (target.auth_user_id && target.auth_user_id !== uid) {
      entry.resultado = 'conflito_outro_auth';
      entry.conflict = target.auth_user_id;
      stats.divergente++;
      log.push(entry);
      return;
    }

    if (target.auth_user_id === uid) {
      entry.resultado = 'ok_ja_linkado';
      stats.ok_linked++;
      log.push(entry);
      return;
    }

    if (RUN) {
      const { error: up } = await db.from('profiles')
        .update({ auth_user_id: uid })
        .eq('id', target.id);
      if (up) { entry.resultado = 'erro'; entry.error = up.message; stats.erro++; log.push(entry); return; }

      // auditoria do vínculo (mesmo padrão do admin — identity_links)
      const { error: audit } = await db.from('identity_links')
        .upsert({
          auth_uid: uid,
          source_profile_id: target.id,
          legacy_firebase_uid: target.legacy_firebase_uid || null,
          match_source: 'email',
        }, { onConflict: 'auth_uid' });
      if (audit) { entry.resultado = 'relink_ok_sem_auditoria'; entry.error = audit.message; }
      else entry.resultado = 'relink_ok';

      stats.seguro_executado++;
      log.push(entry);
      return;
    }
    entry.resultado = 'seria_relink'; // dry-run
    stats.seguro_dryrun++;
  } catch (err) {
    entry.resultado = 'erro';
    entry.error = String(err.message).slice(0, 300);
    stats.erro++;
  }
  log.push(entry);
}

for (const u of targets) await handle(u.id, u.email);

// ── relatório ──
console.table(stats);
console.log('\nPOR USUÁRIO:');
for (const e of log) {
  const extra = e.legado ? ` → legado ${e.legado.id.slice(0, 8)} xp=${e.legado.xp} lessons=${e.legado.lessons}` : e.error ? ` → ${e.error}` : e.nota ? ` → ${e.nota}` : '';
  console.log(`  [${e.resultado.padEnd(18)}] ${e.email}${extra}`);
}

const report = {
  at: new Date().toISOString(),
  mode: RUN ? 'run' : 'dry-run',
  target: ENV.SUPABASE_URL,
  stats,
  operations: log,
};
const outDir = path.join(process.cwd(), 'migration', 'reports');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, RUN ? 'batch-relink.json' : 'batch-relink-dryrun.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`\nrelatório: ${outFile}`);
process.exit(stats.erro ? 1 : 0);