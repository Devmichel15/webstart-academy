// Passo 1 + Passo 2 — Análise completa dos pares migrado/ativo no backup mais recente.
// Gera relatório em migration/reports/mass-relink-analysis.json (só leitura).
import fs from 'node:fs';
import path from 'node:path';

const BACK_DIR = fs.readdirSync(path.join(process.cwd(), 'supabase', 'backups'))
  .filter((n) => /^supabase-backup-\d+$/.test(n))
  .map((n) => path.join(process.cwd(), 'supabase', 'backups', n))
  .sort((a, b) => b.localeCompare(a))[0];

const read = (name) => JSON.parse(fs.readFileSync(path.join(BACK_DIR, `${name}.json`), 'utf8'));
const profiles = read('profiles');
const authUsers = read('auth_users');
const identityLinks = read('identity_links');

const isV5 = (id) => id && String(id).split('-')[2]?.[0] === '5';
const isLegacy = (p) => !!p.legacy_firebase_uid && isV5(p.id);
const hasData = (p) =>
  (p.xp || 0) > 0 || (p.streak || 0) > 0 ||
  [p.completed_lessons, p.completed_courses, p.completed_quizzes].some(
    (a) => Array.isArray(a) && a.length > 0) ||
  (p.total_study_time || 0) > 0 || (p.completed_exercises || 0) > 0 ||
  (p.completed_projects || 0) > 0 || (p.current_course && p.current_lesson);

const byEmail = {};
for (const p of profiles) {
  const e = (p.email || '').trim().toLowerCase();
  if (!e) continue;
  (byEmail[e] = byEmail[e] || []).push(p);
}

const authEmails = new Map(authUsers.map((u) => [(u.email || '').trim().toLowerCase(), u.id]));
const authByUid = new Map(authUsers.map((u) => [u.id, u]));

// ── resolve profile para o auth uid (id = uid OU auth_user_id = uid) ──
const byUidIndex = new Map();
for (const p of profiles) {
  if (p.auth_user_id) byUidIndex.set(p.auth_user_id, p);
}
for (const p of profiles) {
  if (!byUidIndex.has(p.id)) byUidIndex.set(p.id, p); // id tem prioridade se não colidiu
}
// corrige: queremos o perfil resolvido por id quando existir (ativo), senão por auth_user_id
const resolvedByUid = new Map();
for (const p of profiles) {
  if (p.auth_user_id && !resolvedByUid.has(p.auth_user_id)) resolvedByUid.set(p.auth_user_id, p);
}
for (const p of profiles) {
  if (!resolvedByUid.has(p.id)) resolvedByUid.set(p.id, p);
}

const uidEmails = new Map();
for (const p of profiles) {
  const e = (p.email || '').trim().toLowerCase();
  if (!e) continue;
  const uid = p.auth_user_id || p.id;
  if (!uidEmails.has(uid)) uidEmails.set(uid, e);
}

const perUser = [];
for (const u of authUsers) {
  const email = (u.email || '').trim().toLowerCase();
  const matches = (byEmail[email] || []).slice();
  const legacy = matches.filter(isLegacy);
  const legacyData = legacy.filter(hasData);
  const activeByUid = matches.filter((p) => p.id === u.id);
  const linkedByAuth = matches.filter((p) => p.auth_user_id === u.id);
  const resolved = resolvedByUid.get(u.id);
  const resolvedData = resolved ? hasData(resolved) : false;

  let status;
  if (resolved && resolvedData) status = 'OK_LINKED_COM_DADOS';
  else if (resolved && !resolvedData && legacyData.length) status = 'DIVERGENTE_REVISAO';
  else if (legacyData.length) status = 'RE_LINK_SEGURO';
  else if (resolved && !resolvedData && !legacyData.length) status = 'OK_SEM_DADOS';
  else if (!resolved && !legacyData.length) status = 'SEM_PERFIL';
  else status = 'ANALISAR';

  perUser.push({
    email: u.email,
    uid: u.id,
    status,
    resolvedProfile: resolved ? { id: resolved.id, xp: resolved.xp, streak: resolved.streak, lessons: (resolved.completed_lessons || []).length, auth: resolved.auth_user_id, legacyUid: resolved.legacy_firebase_uid } : null,
    profiles: matches.map((p) => ({
      id: p.id, isLegacy: isLegacy(p), xp: p.xp, streak: p.streak,
      lessons: (p.completed_lessons || []).length, auth: p.auth_user_id || null,
      legacyUid: (p.legacy_firebase_uid || '').slice(0, 12), hasData: hasData(p),
    })),
  });
}

// legacy com dados SEM auth correspondente
const legacyWithoutAuth = profiles.filter((p) => isLegacy(p) && hasData(p) && !p.auth_user_id && !authEmails.has((p.email || '').trim().toLowerCase()));

// pares duplicados por email (qualquer combinação)
const dup = Object.entries(byEmail).filter(([, arr]) => arr.length > 1).map(([e, arr]) => ({ email: e, n: arr.length }));

const report = {
  geradoEm: new Date().toISOString(),
  backupDir: BACK_DIR,
  resumo: {
    totalProfiles: profiles.length,
    totalAuthUsers: authUsers.length,
    paresMesmoEmail: dup.length,
    usuariosStatus: perUser.reduce((acc, x) => { acc[x.status] = (acc[x.status] || 0) + 1; return acc; }, {}),
    legacyComDadosSemAuth: legacyWithoutAuth.length,
  },
  usuarios: perUser,
  legacyComDadosSemAuth: legacyWithoutAuth.map((p) => ({ id: p.id, email: p.email, xp: p.xp })),
  emailsDuplicados: dup,
};

const out = path.join(process.cwd(), 'migration', 'reports', 'mass-relink-analysis.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log(`Relatório: ${out}\n`);
console.log('RESUMO:');
console.table(report.resumo.usuariosStatus);
console.log(`paresMesmoEmail(com >1 perfil do mesmo email): ${dup.length}`);
console.log(`legacy com dados MAS SEM auth user (fora de escopo — importação): ${legacyWithoutAuth.length}\n`);
console.log('POR USUÁRIO (auth):');
for (const x of perUser) {
  console.log(`\n[${x.status}] ${x.email}  uid=${x.uid.slice(0, 13)}...`);
  for (const pp of x.profiles) console.log(`   ${JSON.stringify(pp)}`);
  if (x.resolvedProfile) console.log(`   resolvido → ${JSON.stringify(x.resolvedProfile)}`);
}