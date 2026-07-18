import { htmlModules } from './html-modules.js'
import { cssModules } from './css-modules.js'
import { fundamentosModules } from './fundamentos-modules.js'
import { javascriptModules } from './javascript-modules.js'

export { htmlModules, cssModules, fundamentosModules, javascriptModules }
export const allModules = [...htmlModules, ...cssModules, ...fundamentosModules, ...javascriptModules]

export function getModuleById(id) {
  return allModules.find((m) => m.id === id) || null
}

export function getModulesByCourse(courseId) {
  return allModules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order)
}
