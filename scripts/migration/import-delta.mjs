// B4 — Backfill delta Firebase → Supabase (copy + validate, nunca destrutivo).
// Sincroniza, para o Supabase, apenas registros de progresso/conquistas criados
// no Firestore DEPOIS do import inicial. Detecção por presença: se a linha
// determinística já existe no destino, ignora; senão insere (upsert idempotente).
// Registros cujo perfil destino (legacy | email) ainda não existe ficam PENDENTES
// no relatório — resolva com relink-identities.mjs e rode de novo.
//
// REQUISITOS:
//   migration/backups/firebase/  ← export-firestore.mjs (user_progress.json, user_achievements.json, _auth_users.json)
//   migration/.env.local com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// Uso:
//   node scripts/migration/import-delta.mjs          # dry-run (default)
//   node scripts/migration/import-delta.mjs --run    # executa de verdade
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const IN = path.join(ROOT, 'migration', 'backups', 'firebase');
const RUN = process.argv.includes('--run');
const BATCH = 500;

// namespace fixo — NUNCA mudar (ver transform-data.mjs)
const NS = 'f7d1e6c4-9b3a-4e58-8c21-6a0d9f4e2b77';

function uuidV5(namespaceStr, name) {
  const ns = Buffer.from(String(namespaceStr).replace(/-/g, ''), 'hex');
  const d = createHash('sha1').update(ns).update(Buffer.from(name, 'utf8')).digest();
  const b = d.subarray(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const s = b.toString('hex');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function iso(ts) {
  if (!ts) return null;
  if (ts.__type === 'timestamp') return new Date(ts._seconds * 1000).toISOString();
  if (typeof ts === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(ts) ? `${ts}T00:00:00Z` : ts;
  return null;
}

function studyTime(raw) {
  if (typeof raw !== 'string') return { value: Number.isFinite(raw) ? raw : 0, legacy: null };
  const m = raw.match(/(\d{1,2}):(\d{2})/);
  return m ? { value: Number(m[1]) * 60 + Number(m[2]), legacy: raw } : { value: 0, legacy: raw };
}

function readJson(file) {
  const p = path.join(IN, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
}

function loadEnvLocal() {
  const p = path.join(ROOT, 'migration', '.env.local');
  if (!fs.existsSync(p)) { console.error(`✗ ${p} não encontrado.`); process.exit(1); }
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
const BASE = `${ENV.SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

async function getRows(table, select, filters = '') {
  let url = `${BASE}/${table}?select=${select}`;
  if (filters) url += `&${filters}`;
  const res = await fetch(url, {
    headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} → ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function upsert(table, rows, conflictCols) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    if (RUN) {
      const res = await fetch(`${BASE}/${table}?on_conflict=${conflictCols}`, {
        method: 'POST',
        headers: {
          apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${table} batch ${i}-${i + chunk.length}: HTTP ${res.status} → ${t.slice(0, 500)}`);
      }
    }
    inserted += chunk.length;
  }
  return inserted;
}

console.log(RUN ? `=== IMPORT DELTA (produção — ${ENV.SUPABASE_URL}) ===` : '=== IMPORT DELTA (DRY-RUN — nada será escrito) ===');

// ── âncora: perfis existentes no destino (service_role, sem RLS) ──
const profiles = await getRows('profiles', 'id,email,legacy_firebase_uid,xp');
const byLegacyUid = new Map();
const byEmail = new Map();
for (const p of profiles) {
  if (p.legacy_firebase_uid) byLegacyUid.set(p.legacy_firebase_uid, p);
  if (p.email) byEmail.set(String(p.email).toLowerCase(), p);
}

// resolve usuário firestore→destino: 1) legacy uid (autoritativo) 2) email
const resolveUser = (uid, email) => {
  if (byLegacyUid.has(uid)) return byLegacyUid.get(uid);
  if (email && byEmail.has(email.toLowerCase())) return byEmail.get(email.toLowerCase());
  return null;
};

// ── presença atual no destino (evita re-cópia) ──
const existingProgress = new Set((await getRows('lesson_progress', 'user_id,lesson_id')).map((r) => `${r.user_id}|${r.lesson_id}`));
let existingAchievements = new Set();
try {
  existingAchievements = new Set((await getRows('user_achievements', 'user_id,achievement_id')).map((r) => `${r.user_id}|${r.achievement_id}`));
} catch (e) {
  console.warn(`  [aviso] user_achievements: ${e.message}`);
}

// ── delta: progresso ──
const progress = readJson('user_progress.json');
const progressRows = [];
const pendingProgress = [];
let skipAlreadyProgress = 0;
for (const row of progress) {
  const d = row.__data || {};
  const legacy = resolveUser(d.userId, d.email);
  if (!legacy) { pendingProgress.push({ id: row.__id, uid: d.userId, email: d.email || null }); continue; }
  const key = `${legacy.id}|${d.lessonId}`;
  if (existingProgress.has(key)) { skipAlreadyProgress++; continue; }
  const ts = studyTime(d.timeSpent ?? 0);
  progressRows.push({
    user_id: legacy.id,
    lesson_id: d.lessonId,
    course_id: d.courseId ?? null,
    module_id: d.moduleId ?? null,
    completed: d.completed !== false,
    progress_percentage: d.progressPercentage ?? 100,
    time_spent: ts.value,
    time_spent_legacy: ts.legacy,
    completed_at: iso(d.completedAt),
    updated_at: iso(d.updatedAt ?? d.completedAt) ?? iso(d.completedAt),
    legacy_doc_id: row.__id,
  });
}

// ── delta: conquistas ──
const achievements = readJson('user_achievements.json');
const achRows = [];
const pendingAch = [];
let skipAlreadyAch = 0;
for (const row of achievements) {
  const d = row.__data || {};
  const legacy = resolveUser(d.userId, d.email);
  if (!legacy) { pendingAch.push({ id: row.__id, uid: d.userId }); continue; }
  const key = `${legacy.id}|${d.achievementId}`;
  if (existingAchievements.has(key)) { skipAlreadyAch++; continue; }
  achRows.push({
    user_id: legacy.id,
    achievement_id: d.achievementId,
    earned_at: iso(d.earnedAt) ?? new Date().toISOString(),
  });
}

// ── executa ──
let insertedProgress = 0;
let insertedAch = 0;
try {
  if (progressRows.length) insertedProgress = await upsert('lesson_progress', progressRows, 'user_id,lesson_id');
  if (achRows.length) insertedAch = await upsert('user_achievements', achRows, 'user_id,achievement_id');
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(2);
}

const report = {
  at: new Date().toISOString(),
  mode: RUN ? 'run' : 'dry-run',
  target: RUN ? ENV.SUPABASE_URL : null,
  lesson_progress: {
    source: progress.length,
    alreadyInSupabase: skipAlreadyProgress,
    pendingNoProfile: pendingProgress.length,
    toUpsert: progressRows.length,
    inserted: insertedProgress,
  },
  user_achievements: {
    source: achievements.length,
    alreadyInSupabase: skipAlreadyAch,
    pendingNoProfile: pendingAch.length,
    toUpsert: achRows.length,
    inserted: insertedAch,
  },
  pendingSamples: {
    progress: pendingProgress.slice(0, 10).map((p) => ({ ...p, uid: String(p.uid).slice(0, 8) })),
    achievements: pendingAch.slice(0, 10).map((p) => ({ ...p, uid: String(p.uid).slice(0, 8) })),
  },
  notes: ['Feed (community_projects/likes/comments) é coberto por RUN_THIS.sql + import-community.js, não por este delta.'],
};

fs.mkdirSync(path.join(ROOT, 'migration', 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'import-delta-report.json'), JSON.stringify(report, null, 2));

console.table({
  lesson_progress: `${progressRows.length}/${progress.length} para inserir (já: ${skipAlreadyProgress} | pendente perfil: ${pendingProgress.length})`,
  user_achievements: `${achRows.length}/${achievements.length} para inserir (já: ${skipAlreadyAch} | pendente perfil: ${pendingAch.length})`,
});
if (pendingProgress.length || pendingAch.length) {
  console.log('⚠ registros pendentes por ausência de perfil destino — resolva com relink-identities.mjs e rode de novo.');
}
console.log(`relatório: migration/reports/import-delta-report.json`);