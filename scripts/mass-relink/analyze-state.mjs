// Passo 1 — Análise do estado atual: identifica os pares
// (perfil migrado com dados vs perfil ativo vazio) por email.
// Apenas leitura.
import fs from 'node:fs';
import path from 'node:path';

const BACKUP_DIR = process.argv[2] || fs.readdirSync(path.join(process.cwd(), 'supabase', 'backups'))
  .filter((n) => /^supabase-backup-\d+$/.test(n))
  .map((n) => path.join(process.cwd(), 'supabase', 'backups', n))
  .sort((a, b) => b.localeCompare(a))[0];

const read = (name) => JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, `${name}.json`), 'utf8'));

const profiles = read('profiles');
const authUsers = read('auth_users');
const identityLinks = read('identity_links');
const lessonProgress = read('lesson_progress');

console.log(`Backup: ${BACKUP_DIR}`);
console.log(`profiles=${profiles.length}  auth_users=${authUsers.length}  identity_links=${identityLinks.length}  lesson_progress=${lessonProgress.length}\n`);

const isV5 = (id) => id && String(id).split('-')[2]?.[0] === '5';
const isLegacy = (p) => !!p.legacy_firebase_uid && isV5(p.id);
const hasData = (p) =>
  (p.xp || 0) > 0 ||
  (p.streak || 0) > 0 ||
  (Array.isArray(p.completed_lessons) && p.completed_lessons.length > 0) ||
  (Array.isArray(p.completed_courses) && p.completed_courses.length > 0) ||
  (Array.isArray(p.completed_quizzes) && p.completed_quizzes.length > 0) ||
  (p.total_study_time || 0) > 0 ||
  (p.completed_exercises || 0) > 0 ||
  (p.completed_projects || 0) > 0 ||
  (p.current_course && p.current_lesson);

const byEmail = {};
for (const p of profiles) {
  const email = (p.email || '').trim().toLowerCase();
  if (!email) continue;
  (byEmail[email] = byEmail[email] || []).push(p);
}

const authEmails = new Map();
for (const u of authUsers) authEmails.set((u.email || '').trim().toLowerCase(), u.id);

// Perfil "ativo": é o que o app resolve para o auth uid
//   (id = auth.uid() OU auth_user_id = auth.uid())
const authUidByEmail = {};
for (const [email, uid] of authEmails) {
  const candidates = byEmail[email] || [];
  const active = candidates.find((p) => p.auth_user_id === uid) ||
    candidates.find((p) => p.id === uid) ||
    null;
  authUidByEmail[email] = active ? { active, uid } : null;
}

console.log('=== IDENTIDADE (auth_users × profiles) ===');
for (const u of authUsers) {
  const email = (u.email || '').trim().toLowerCase();
  const list = byEmail[email] || [];
  const linked = list.filter((p) => p.auth_user_id === u.id);
  const idMatch = list.find((p) => p.id === u.id);
  console.log(`\n${u.email}  (uid ${u.id})`);
  for (const p of list) {
    console.log(`   ${JSON.stringify({ id: p.id, auth_uid: p.auth_user_id || null, legacy: (p.legacy_firebase_uid || '').slice(0, 12), xp: p.xp, streak: p.streak, lessons: (p.completed_lessons || []).length, role: p.role })}`);
  }
  if (!list.length) console.log(`   (nenhum perfil com este email)`);
}

console.log('\n=== PAIRES POR EMAIL (duplicados) ===');
const dupEmails = Object.entries(byEmail).filter(([, arr]) => arr.length > 1);
let pairsFound = 0;
for (const [email, arr] of dupEmails) {
  const legacy = arr.filter(isLegacy);
  const active = arr.filter((p) => !isLegacy(p) || p.auth_user_id);
  const dataLegacy = legacy.filter(hasData);
  const authUid = authEmails.get(email);
  const authProfile = authUid ? arr.find((p) => p.id === authUid || p.auth_user_id === authUid) : null;
  console.log(`\n${email} (${arr.length} perfis, auth_user: ${authUid ? 'SIM' : 'NÃO'})`);
  for (const p of arr) {
    console.log(`   ${JSON.stringify({ id: p.id, auth_uid: p.auth_user_id || null, legacy: (p.legacy_firebase_uid || '').slice(0, 12), xp: p.xp, streak: p.streak, lessons: (p.completed_lessons || []).length, studyTime: p.total_study_time })}${hasData(p) ? '  <-- dados' : ''}`);
  }
  if (authUid && dataLegacy.length && authProfile) pairsFound++;
}

const profilesWithAuthUid = profiles.filter((p) => p.auth_user_id);
const profilesSelfLinked = profilesWithAuthUid.filter((p) => p.auth_user_id === p.id);
console.log(`\nauth_user_id preenchidos: ${profilesWithAuthUid.length} (self=${profilesSelfLinked.length})`);

console.log('\n=== identity_links ===');
for (const l of identityLinks) {
  console.log(`  auth=${l.auth_uid} source=${l.source_profile_id} match=${l.match_source} firebase=${l.legacy_firebase_uid}`);
}