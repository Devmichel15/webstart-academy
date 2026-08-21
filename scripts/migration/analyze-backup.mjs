// Análise LOCAL dos backups gerados (não toca no Firebase).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const BACKUPS = path.join(ROOT, 'migration', 'backups', 'firebase')

const load = (f) => JSON.parse(fs.readFileSync(path.join(BACKUPS, f), 'utf8'))
const users = load('users.json')
const progress = load('user_progress.json')
const achievements = load('user_achievements.json')
const announcements = load('announcements.json')
const authUsers = load('_auth_users.json')

function fieldStats(docs) {
  const freq = new Map()
  for (const d of docs) {
    for (const k of Object.keys(d.__data)) freq.set(k, (freq.get(k) || 0) + 1)
  }
  return Object.fromEntries([...freq.entries()].sort((a, b) => b[1] - a[1]))
}

const report = { generatedAt: new Date().toISOString(), users: {}, user_progress: {}, user_achievements: {}, auth: {}, announcements: {} }

// ── users ──
report.users.fields = fieldStats(users)
report.users.byRole = {}
report.users.byProvider = {}
report.users.isPublic = { true: 0, false: 0, ausente: 0 }
report.users.firstStepsDone = { true: 0, false: 0, ausente: 0 }
report.users.comEmailVazio = 0
report.users.semUsername = 0
for (const u of users) {
  const d = u.__data
  report.users.byRole[d.role || '(ausente)'] = (report.users.byRole[d.role || '(ausente)'] || 0) + 1
  report.users.byProvider[d.provider || '(ausente)'] = (report.users.byProvider[d.provider || '(ausente)'] || 0) + 1
  const pub = d.isPublic === true ? 'true' : d.isPublic === false ? 'false' : 'ausente'
  report.users.isPublic[pub]++
  const fsd = d.firstStepsDone === true ? 'true' : d.firstStepsDone === false ? 'false' : 'ausente'
  report.users.firstStepsDone[fsd]++
  if (!d.email || !String(d.email).trim()) report.users.comEmailVazio++
  if (!d.username) report.users.semUsername++
}
report.users.xpTotal = users.reduce((s, u) => s + (u.__data.xp || 0), 0)
report.users.xpMax = Math.max(...users.map((u) => u.__data.xp || 0))
report.users.completedLessonsSoma = users.reduce((s, u) => s + (u.__data.completedLessons?.length || 0), 0)

// ── user_progress ──
const userIdSet = new Set(users.map((u) => u.__id))
const progressUsersInvalidos = [...new Set(progress.map((p) => p.__data.userId).filter((id) => !userIdSet.has(id)))]
const docIdInconsistente = progress.filter((p) => p.__id !== `${p.__data.userId}_${p.__data.lessonId}`).length
const courseIdsProgress = [...new Set(progress.map((p) => p.__data.courseId))]
const completedTrue = progress.filter((p) => p.__data.completed !== false).length
report.user_progress = {
  documentos: progress.length,
  usuariosDistintos: new Set(progress.map((p) => p.__data.userId)).size,
  userIdsForaDeUsers: progressUsersInvalidos,
  docIdInconsistente,
  cursosReferenciados: courseIdsProgress,
  completedTrue,
  comCompletedAtAusente: progress.filter((p) => !p.__data.completedAt).length,
}

// ── user_achievements ──
const achIds = [...new Set(achievements.map((a) => a.__data.achievementId))]
const achUsersInvalidos = [...new Set(achievements.map((a) => a.__data.userId).filter((id) => !userIdSet.has(id)))]
report.user_achievements = {
  documentos: achievements.length,
  conquistasDistintas: achIds.sort(),
  usuariosComConquista: new Set(achievements.map((a) => a.__data.userId)).size,
  userIdsForaDeUsers: achUsersInvalidos,
  semEarnedAt: achievements.filter((a) => !a.__data.earnedAt).length,
}

// ── arrays vs coleção (reconciliação R4) ──
const arrayLessonPairs = new Map() // uid -> Set(lessonId)
for (const u of users) {
  const set = new Set(u.__data.completedLessons || [])
  if (set.size) arrayLessonPairs.set(u.__id, set)
}
let both = 0, onlyArray = 0, onlyCollection = 0
for (const [uid, set] of arrayLessonPairs) {
  for (const l of set) {
    const inCol = progress.some((p) => p.__data.userId === uid && p.__data.lessonId === l)
    if (inCol) both++; else onlyArray++
  }
}
for (const p of progress) {
  const inArr = arrayLessonPairs.get(p.__data.userId)?.has(p.__data.lessonId)
  if (!inArr) onlyCollection++
}
report.reconciliacaoAulas = { apenasNoArray: onlyArray, apenasNaColecao: onlyCollection, emAmbas: both }

// ── quizzes/courses arrays ──
report.arraysUsuarios = {
  usuariosComCompletedQuizzes: users.filter((u) => (u.__data.completedQuizzes || []).length > 0).length,
  quizModuleIdsDistintos: [...new Set(users.flatMap((u) => u.__data.completedQuizzes || []))].sort(),
  usuariosComCompletedCourses: users.filter((u) => (u.__data.completedCourses || []).length > 0).length,
  courseIdsEmCompletedCourses: [...new Set(users.flatMap((u) => u.__data.completedCourses || []))].sort(),
}

// ── auth ──
report.auth = {
  total: authUsers.length,
  byProvider: authUsers.reduce((acc, u) => {
    const key = u.providers.join('+') || '(sem provider)'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {}),
  verified: authUsers.filter((u) => u.emailVerified).length,
  disabled: authUsers.filter((u) => u.disabled).length,
  comDisplayName: authUsers.filter((u) => u.displayName).length,
  comPhotoURL: authUsers.filter((u) => u.photoURL).length,
}

// ── announcements (entidade nova) ──
report.announcements = { documentos: announcements.length, docs: announcements.map((a) => ({ id: a.__id, data: a.__data })) }

fs.writeFileSync(path.join(ROOT, 'migration', 'reports', 'backup-analysis.json'), JSON.stringify(report, null, 2))

console.log('=== ANÁLISE DO BACKUP ===\n')
console.log('USERS (81):')
console.log('  campos:', Object.entries(report.users.fields).map(([k, v]) => `${k}(${v})`).join(', '))
console.log('  role:', JSON.stringify(report.users.byRole), '| provider:', JSON.stringify(report.users.byProvider))
console.log('  isPublic:', JSON.stringify(report.users.isPublic), '| firstStepsDone:', JSON.stringify(report.users.firstStepsDone))
console.log(`  email vazio: ${report.users.comEmailVazio} | sem username: ${report.users.semUsername} | xp total: ${report.users.xpTotal} | xp máx: ${report.users.xpMax}`)
console.log('\nUSER_PROGRESS (354):')
console.log(`  usuários distintos: ${report.user_progress.usuariosDistintos} | userIds órfãos: ${progressUsersInvalidos.length}`)
console.log(`  docId inconsistente: ${docIdInconsistente} | completed=true: ${completedTrue} | sem completedAt: ${report.user_progress.comCompletedAtAusente}`)
console.log(`  cursos referenciados: ${courseIdsProgress.join(', ')}`)
console.log('\nUSER_ACHIEVEMENTS (188):')
console.log(`  conquistas distintas (${achIds.length}): ${achIds.join(', ')}`)
console.log(`  usuários c/ conquista: ${report.user_achievements.usuariosComConquista} | userIds órfãos: ${achUsersInvalidos.length} | sem earnedAt: ${report.user_achievements.semEarnedAt}`)
console.log('\nRECONCILIAÇÃO aulas (array users ↔ coleção user_progress):')
console.log(`  em ambas: ${both} | só no array: ${onlyArray} | só na coleção: ${onlyCollection}`)
console.log('\nARRAYS de quiz/course nos users:')
console.log(`  usuários c/ quizzes concluídos: ${report.arraysUsuarios.usuariosComCompletedQuizzes} | módulos distintos: ${report.arraysUsuarios.quizModuleIdsDistintos.join(', ') || '(nenhum)'}`)
console.log(`  usuários c/ courses concluídos: ${report.arraysUsuarios.usuariosComCompletedCourses} | cursos: ${report.arraysUsuarios.courseIdsEmCompletedCourses.join(', ') || '(nenhum)'}`)
console.log('\nAUTH (81):')
console.log(`  providers: ${JSON.stringify(report.auth.byProvider)} | verificados: ${report.auth.verified} | desabilitados: ${report.auth.disabled}`)
console.log('\nANNOUNCEMENTS:')
console.log(JSON.stringify(report.announcements.docs, null, 2))
