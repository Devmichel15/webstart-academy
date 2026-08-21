// ETAPA 5b — Seed de conteúdo derivado do catálogo ESTÁTICO (src/data/**).
// Gera migration/normalized/content/*.jsonl e valida integridade com o backup.
// Determinístico. Não acessa rede nem banco.
// Uso: node scripts/migration/seed-content-from-static.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'migration', 'normalized', 'content');
const REPORTS = path.join(ROOT, 'migration', 'reports');
const IN = path.join(ROOT, 'migration', 'backups', 'firebase');

const imp = (p) => import(pathToFileURL(p).href);
const { trails } = await imp(path.join(ROOT, 'src', 'data', 'trails.js'));
const modulesIdx = await imp(path.join(ROOT, 'src', 'data', 'modules', 'index.js'));
const lessonsIdx = await imp(path.join(ROOT, 'src', 'data', 'lessons', 'index.js'));
const achv = await imp(path.join(ROOT, 'src', 'data', 'achievements.js'));

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REPORTS, { recursive: true });

const errors = [];
const warn = (m) => { errors.push(m); console.warn('⚠ ' + m); };

// ── módulos: index exporta named por trilha + possivelmente agregado ──
const moduleFiles = ['html-modules', 'css-modules', 'fundamentos-modules',
  'javascript-modules', 'php-modules', 'git-modules'];
let mods = [];
for (const f of moduleFiles) {
  const m = await imp(path.join(ROOT, 'src', 'data', 'modules', `${f}.js`));
  const arr = Object.values(m).find(v => Array.isArray(v));
  if (arr) mods.push(...arr);
}
mods.sort((a, b) => (a.courseId + String(a.order).padStart(3, '0')).localeCompare(b.courseId + String(b.order).padStart(3, '0')));

const byId = new Map();
for (const l of [...lessonsIdx.allLessons, ...lessonsIdx.allVideoLessons]) byId.set(l.id, l);

const courseIds = new Set(trails.map(t => t.id));
const modIds = new Set(mods.map(m => m.id));

// ── courses ──
const coursesRows = trails.map(t => ({
  id: t.id,
  title: t.title,
  slug: t.slug ?? t.id,
  description: t.description ?? null,
  thumbnail: t.cover ?? '',
  difficulty: t.difficulty ?? 'beginner',
  estimated_hours: t.estimatedHours ?? 0,
  total_lessons: [...byId.values()].filter(l => l.courseId === t.id).length,
  icon: t.icon ?? 'code',
  color: t.color ?? 'brand',
  status: t.status ?? 'available',
  sort_order: t.order ?? 1,
  instructor: t.instructor ?? null,
  required_trail: t.requiredTrail ?? null,
  extra: {
    level: t.level ?? 1,
    xp: t.xp ?? 0,
    completion: t.completion ?? null
  }
}));

// ── modules ──
const modRows = mods.map(m => ({
  id: m.id,
  course_id: m.courseId,
  title: m.title ?? '',
  description: m.description ?? null,
  order: m.order ?? 1,
  extra: { quiz: m.quiz ?? null, lab: m.lab ?? null, miniProject: m.miniProject ?? null }
}));

// ── lessons ──
const lessonRows = [...byId.values()].sort((a, b) =>
  (a.courseId + String(a.order).padStart(4, '0') + a.id).localeCompare(b.courseId + String(b.order).padStart(4, '0') + b.id)
).map(l => ({
  id: l.id,
  module_id: l.moduleId ?? null,
  course_id: l.courseId,
  title: l.title,
  slug: null,
  content: l.content ?? l.description ?? null,
  illustration: null,
  estimated_time: l.duration ? Number(String(l.duration).replace(/\D/g, '')) || null : null,
  order: l.order ?? 1,
  resources: { objectives: l.objectives ?? [], materials: l.materials ?? [] },
  exercise: l.exercise ?? null,
  extra: {
    type: l.type ?? 'videoLesson',
    youtubeUrl: l.youtubeUrl ?? null,
    embedUrl: l.embedUrl ?? null,
    duration: l.duration ?? ''
  }
}));

// ── achievements ──
const achvRows = achv.achievements.map(a => ({
  id: a.id,
  title: a.title,
  description: a.description ?? null,
  icon: a.icon ?? null,
  xp_reward: a.xpReward ?? 0,
  requirement: null,
  type: a.type,
  target: a.target ?? null,
  course_id: a.courseId ?? null
}));

// ── validações ──
for (const r of modRows) if (!courseIds.has(r.course_id)) warn(`module ${r.id} → courseId inexistente ${r.course_id}`);
for (const r of lessonRows) {
  if (!courseIds.has(r.course_id)) warn(`lesson ${r.id} → courseId inexistente ${r.course_id}`);
  if (r.module_id && !modIds.has(r.module_id)) warn(`lesson ${r.id} → moduleId inexistente ${r.module_id}`);
}
for (const r of achvRows) if (r.course_id && !courseIds.has(r.course_id)) warn(`achievement ${r.id} → curso inexistente ${r.course_id}`);

// FKs exigidas pelo import de progresso: aulas removidas do catálogo que ainda
// possuem progresso REAL precisam existir na tabela p/ não perdermos registros.
// Regra ZERO-PERDA: sintetiza linha "legacy" em lessons (FK satisfeita).
let legacyCount = 0;
if (fs.existsSync(path.join(IN, 'user_progress.json'))) {
  const progress = JSON.parse(fs.readFileSync(path.join(IN, 'user_progress.json'), 'utf8'));
  const missingLessons = new Map(); const missingCourses = new Set(); const missingMods = new Set();
  const guessCourse = (id) => id.startsWith('html-') ? 'html'
    : id.startsWith('css-') ? 'css'
    : id.startsWith('js-') || id.startsWith('javascript-') ? 'javascript'
    : 'fundamentos-web';
  const titleize = (id) => id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  function d0Course(prog, lessonId) {
    const hit = prog.find(p => p.__data.lessonId === lessonId && p.__data.courseId);
    return hit ? hit.__data.courseId : null;
  }
  for (const row of progress) {
    const d = row.__data;
    if (!byId.has(d.lessonId)) missingLessons.set(d.lessonId, (missingLessons.get(d.lessonId) || 0) + 1);
    if (d.courseId && !courseIds.has(d.courseId)) missingCourses.add(d.courseId);
    if (d.moduleId && !modIds.has(d.moduleId)) missingMods.add(d.moduleId);
  }
  for (const [lessonId] of [...missingLessons].sort()) {
    const cid = d0Course(progress, lessonId) ?? guessCourse(lessonId);
    lessonRows.push({
      id: lessonId,
      module_id: null,
      course_id: cid,
      title: `${titleize(lessonId)} (aula legada)`,
      slug: null,
      content: null,
      illustration: null,
      estimated_time: null,
      order: 0,
      resources: { objectives: [], materials: [] },
      exercise: null,
      extra: { legacy: true, reason: 'aula removida do catálogo; preservada por histórico de progresso' }
    });
    legacyCount++;
  }
  // módulos legados: mesmo tratamento (FK de lesson_progress.module_id)
  for (const moduleId of [...missingMods].sort()) {
    const hit = progress.find(p => p.__data.moduleId === moduleId && p.__data.courseId);
    modRows.push({
      id: moduleId,
      course_id: hit ? hit.__data.courseId : guessCourse(moduleId),
      title: `${titleize(moduleId)} (módulo legado)`,
      description: 'Módulo removido do catálogo; preservado por histórico de progresso.',
      order: 0,
      extra: { legacy: true }
    });
  }
  if (missingLessons.size) console.log(`→ ${missingLessons.size} aulas legadas sintetizadas (zero-perda)`);
  if (missingMods.size) console.log(`→ ${missingMods.size} módulos legados sintetizados (zero-perda)`);
  if (missingCourses.size) warn(`progress referencia cursos fora do catálogo: ${[...missingCourses].join(', ')}`);
  var fkReport = {
    synthesizedLegacyLessons: [...new Set(lessonRows.filter(r => r.extra?.legacy).map(r => r.id))],
    synthesizedLegacyModules: [...modRows.filter(r => r.extra?.legacy).map(r => r.id)],
    missingLessonIds: [], missingCourseIds: [...missingCourses]
  };
}

function writeJsonl(name, rows) {
  fs.writeFileSync(path.join(OUT, name), rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
}
writeJsonl('courses.jsonl', coursesRows);
writeJsonl('modules.jsonl', modRows);
writeJsonl('lessons.jsonl', lessonRows);
writeJsonl('achievements.jsonl', achvRows);

const summary = {
  generatedAt: new Date().toISOString(),
  counts: { courses: coursesRows.length, modules: modRows.length, lessons: lessonRows.length, achievements: achvRows.length },
  availableCourses: coursesRows.filter(c => c.status === 'available').length,
  legacyLessonsSynthesized: legacyCount,
  fkReport: fkReport ?? null,
  errorsCount: errors.length,
  ok: errors.length === 0
};
fs.writeFileSync(path.join(REPORTS, 'seed-content-summary.json'), JSON.stringify(summary, null, 2));
console.table(summary.counts);
if (fkReport) console.log('FK p/ progress:', JSON.stringify(fkReport));
console.log(summary.ok ? '✓ conteúdo OK' : '✗ problemas no conteúdo');
process.exit(summary.ok ? 0 : 1);
