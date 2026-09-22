// Passo 1 (ampliado) — Inventário completo dos 116 perfis + 13 auth users.
// Classifica cada perfil e lista os 88 com dados sem conta de auth (import candidates)
// + com conta já existente. Apenas leitura. Salva em migration/reports/inventory-116.json.
import fs from 'node:fs';
import path from 'node:path';

const BACK_DIR = fs.readdirSync(path.join(process.cwd(), 'supabase', 'backups'))
  .filter((n) => /^supabase-backup-\d+$/.test(n))
  .map((n) => path.join(process.cwd(), 'supabase', 'backups', n))
  .sort((a, b) => b.localeCompare(a))[0];

const read = (name) => JSON.parse(fs.readFileSync(path.join(BACK_DIR, `${name}.json`), 'utf8'));
const profiles = read('profiles');
const authUsers = read('auth_users');

const isV5 = (id) => id && String(id).split('-')[2]?.[0] === '5';
const HARD_DATA = (p) =>
  (p.xp || 0) > 0 || (p.streak || 0) > 0 ||
  [p.completed_lessons, p.completed_courses, p.completed_quizzes].some(
    (a) => Array.isArray(a) && a.length > 0) ||
  (p.total_study_time || 0) > 0 || (p.completed_exercises || 0) > 0 ||
  (p.completed_projects || 0) > 0;

const authByEmail = new Map(authUsers.map((u) => [(u.email || '').trim().toLowerCase(), u]));

function classify(p) {
  const em = (p.email || '').trim().toLowerCase();
  const authUser = authByEmail.get(em);
  if (p.auth_user_id) {
    const self = p.auth_user_id === p.id;
    return HARD_DATA(p)
      ? (self ? 'admin_ou_self_com_dados' : 'linked_com_dados')
      : (self ? 'self_sem_dados' : 'linked_sem_dados');
  }
  const isLegacy = !!p.legacy_firebase_uid && isV5(p.id);
  if (authUser && !isLegacy) return 'ativo_espera_login'; // profile id = auth uid? (não deve)
  if (HARD_DATA(p)) return authUser ? 'dados_com_auth_mas_nao_linkado' : 'dados_sem_conta_auth';
  return authUser ? 'vazio_com_conta_auth' : 'vazio_sem_conta_auth';
}

const rows = profiles.map((p) => {
  const em = (p.email || '').trim().toLowerCase();
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    authUid: p.auth_user_id || null,
    temContaAuth: authByEmail.has(em),
    isLegacyV5: isV5(p.id),
    xp: p.xp, streak: p.streak,
    lessons: (p.completed_lessons || []).length,
    studyTime: p.total_study_time || 0,
    exercicios: p.completed_exercises || 0,
    status: classify(p),
  };
});

const byStatus = rows.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});

const report = {
  geradoEm: new Date().toISOString(),
  backupDir: BACK_DIR,
  total: rows.length,
  byStatus,
  perfis: rows,
  resumo: {
    comContaAuth: rows.filter((r) => r.temContaAuth).length,
    semContaAuth: rows.filter((r) => !r.temContaAuth).length,
    dadosSemContaAuth_ImportCandidates: rows.filter((r) => r.status === 'dados_sem_conta_auth'),
    linkedComDados: rows.filter((r) => r.status === 'linked_com_dados').length,
  },
};

const out = path.join(process.cwd(), 'migration', 'reports', 'inventory-116.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log(`Inventário: ${out}\n`);
console.log('CLASSIFICAÇÃO:');
console.table(byStatus);
console.log('\nCOM conta de auth:', report.resumo.comContaAuth, '| SEM conta de auth:', report.resumo.semContaAuth);
console.log('\n=== IMPORT CANDIDATES (dados reais, sem conta de auth = fora do escopo / próx import) ===');
for (const r of report.resumo.dadosSemContaAuth_ImportCandidates) {
  console.log(`  ${r.email.padEnd(42)} xp=${String(r.xp).padEnd(5)} streak=${r.streak} lessons=${r.lessons} studyTime=${r.studyTime} ex=${r.exercicios}  (${r.id.slice(0, 8)})`);
}
console.log(`\nTotal import candidates: ${report.resumo.dadosSemContaAuth_ImportCandidates.length}`);