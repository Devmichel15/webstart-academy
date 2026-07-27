import { TRAIL_ORDER } from '../data/trails.js'
import { allLessons } from '../data/lessons/index.js'

export function getFallbackRoadmap(assessment, availableTrails = []) {
  const availableSet = new Set(
    availableTrails.length > 0
      ? availableTrails.map((t) => (typeof t === 'string' ? t : t.id))
      : ['fundamentos-web', 'html', 'html-exercises', 'css', 'javascript', 'php'],
  )

  // Map interest & experience to a recommended course sequence
  let sequence = []
  const { interest, experience, studyTime } = assessment

  if (interest === 'web' || interest === 'undecided') {
    sequence = ['fundamentos-web', 'html', 'html-exercises', 'css', 'javascript', 'php']
  } else if (interest === 'mobile') {
    sequence = ['fundamentos-web', 'javascript', 'html', 'css']
  } else if (interest === 'data_ai') {
    sequence = ['fundamentos-web', 'javascript', 'php']
  } else {
    sequence = ['fundamentos-web', 'html', 'css', 'javascript']
  }

  // Filter sequence to only include available trails
  let recommendedCourses = sequence.filter((id) => availableSet.has(id))

  // If experience is know_basics or built_projects, skip fundamentos-web if user wants
  if ((experience === 'know_basics' || experience === 'built_projects') && recommendedCourses.length > 2) {
    // Keep html & css first for fast progression
  }

  // Ensure at least 3 courses
  if (recommendedCourses.length < 3) {
    for (const trailId of TRAIL_ORDER) {
      if (availableSet.has(trailId) && !recommendedCourses.includes(trailId)) {
        recommendedCourses.push(trailId)
      }
      if (recommendedCourses.length >= 4) break
    }
  }

  // Determine firstStep
  const firstCourseId = recommendedCourses[0] || 'fundamentos-web'
  const firstCourseLessons = allLessons.filter((l) => l.courseId === firstCourseId)
  const firstLessonId = firstCourseLessons.length > 0 ? firstCourseLessons[0].id : `${firstCourseId}-vid-1`

  // Calculate estimated weeks based on study time
  let weeksPerCourse = 2
  if (studyTime === 'less_3h') weeksPerCourse = 4
  else if (studyTime === '3_7h') weeksPerCourse = 2.5
  else if (studyTime === '7_15h') weeksPerCourse = 1.5
  else if (studyTime === '15h_plus') weeksPerCourse = 1

  const estimatedWeeks = Math.max(2, Math.round(recommendedCourses.length * weeksPerCourse))

  const aiSummary = `Com base nas suas respostas, desenhamos um plano sob medida focado em ritmo e consistência. Seu objetivo será alcançado passo a passo, respeitando seu tempo semanal disponível e eliminando a sensação de estar perdido.`

  const welcomeMessage = `Seja muito bem-vindo à WebStart Academy! Seu caminho está traçado. Vamos dar o primeiro passo agora mesmo!`

  return {
    archetype: null, // archetype is calculated separately
    aiSummary,
    recommendedCourses,
    firstStep: {
      courseId: firstCourseId,
      lessonId: firstLessonId,
    },
    estimatedWeeks,
    welcomeMessage,
    generatedBy: 'fallback_rules',
  }
}
