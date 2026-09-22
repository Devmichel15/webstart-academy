// Analisa o Gabriel FAGUNDES / todos os seus emails no Firebase backup.
import fs from 'node:fs';
import path from 'node:path';

const FIRE = 'migration/backups/firebase';
const files = {
  auth: 'auth_export_2026-09-19.json',
  _auth: '_auth_users.json',
  users: 'users.json',
  progress: 'user_progress.json',
  achievements: 'user_achievements.json',
};

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIRE, files[name]), 'utf8'));
const auth = load('auth');
const _auth = load('_auth');
const users = load('users');
const progress = load('progress');
const achievements = load('achievements');

const KEYS = ['gabriel', 'fagundes', '0001243225', 'senaim', 'souza'];

function hit(str) {
  if (!str) return false;
  return KEYS.some((k) => String(str).toLowerCase().includes(k));
}

console.log('=== AUTH EXPORT ===');
const au = Array.isArray(auth) ? auth : auth.users || [];
for (const u of au) {
  const em = u.email || u.localId && '';
  const um = u.providerUserInfo?.map((x) => x.email).filter(Boolean).join(',');
  if (hit(em) || hit(um) || hit(u.displayName)) {
    console.log(JSON.stringify({ localId: u.localId, email: em, providerEmails: um, displayName: u.displayName, providerId: (u.providerUserInfo||[]).map(x=>x.providerId) }));
  }
}

console.log('\n=== _auth_users ===');
for (const u of (Array.isArray(_auth) ? _auth : [])) {
  if (hit(u.email) || hit(u.name) || hit(u.displayName)) console.log(JSON.stringify(u).slice(0, 300));
}

console.log('\n=== users (perfis) ===');
for (const u of (Array.isArray(users) ? users : users.users || [])) {
  if (hit(u.email) || hit(u.name) || hit(u.username)) {
    console.log(JSON.stringify({ uid: u.uid, name: u.name, email: u.email, username: u.username, xp: u.xp, streak: u.streak, lastStudyDate: u.lastStudyDate, currentLesson: u.currentLesson, completedLessons: (u.completedLessons||[]).length, provider: u.provider }));
  }
}

console.log('\n=== user_progress (uid?) ===');
const prog = Array.isArray(progress) ? progress : progress.documents || [];
console.log('total progress docs:', prog.length);
// pega uids dos users achados
const foundUids = new Set();
for (const u of (Array.isArray(users) ? users : users.users || [])) {
  if (hit(u.email) || hit(u.name) || hit(u.username)) foundUids.add(u.uid);
  if (hit(u.uid)) foundUids.add(u.uid);
}
for (const p of prog) {
  const uid = p.userId || p.uid || (p.id && String(p.id).split('__')[0]);
  if (foundUids.has(uid) || hit(uid)) console.log('progress:', JSON.stringify(p).slice(0, 400));
}

console.log('\n=== firebase_id_mapping (backup antigo) ===');
const oldMap = JSON.parse(fs.readFileSync('supabase/backups/supabase-backup-1790034060053/firebase_id_mapping.json', 'utf8'));
for (const m of oldMap) {
  const s = JSON.stringify(m);
  if (hit(s)) console.log(JSON.stringify(m).slice(0, 400));
}