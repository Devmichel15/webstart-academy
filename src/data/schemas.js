export function createRoadmap({
  id,
  title,
  description,
  icon = 'bookOpen',
  color = 'brand',
  order = 1,
  courses = [],
}) {
  return { id, title, description, icon, color, order, courses }
}

export function createTrail({
  id,
  slug,
  title,
  description,
  instructor = null,
  icon = 'code',
  color = 'brand',
  order = 1,
  difficulty = 'beginner',
  estimatedHours = 0,
  modules = [],
  completion,
  status = 'available',
  requiredTrail = null,

  cover = null,
  level = 1,
  xp = 500,
}) {
  return {
    id,
    slug: slug || id,
    title,
    description,
    instructor,
    icon,
    color,
    order,
    difficulty,
    estimatedHours,
    modules,
    status,
    requiredTrail,
    cover,
    level,
    xp,
    completion: completion || {
      finalProject: null,
      finalEvaluation: null,
      nextSteps: null,
    },
  }
}

export function createCourse({
  id,
  title,
  description,
  icon = 'code',
  color = 'brand',
  roadmapId,
  order = 1,
  difficulty = 'beginner',
  estimatedHours = 0,
  modules = [],
  completion,
  status = 'available',
}) {
  return {
    id,
    title,
    description,
    icon,
    color,
    roadmapId,
    order,
    difficulty,
    estimatedHours,
    modules,
    status,
    completion: completion || {
      finalProject: null,
      finalEvaluation: null,
      nextSteps: null,
    },
  }
}

export function createModule({
  id,
  courseId,
  title,
  description,
  order = 1,
  lessons = [],
  quiz = null,
  lab = null,
  miniProject = null,
}) {
  return {
    id,
    courseId,
    title,
    description,
    order,
    lessons,
    quiz,
    lab,
    miniProject,
    type: 'module',
  }
}

export function createQuiz({ id, title, questions = [] }) {
  return { id, title, questions, type: 'quiz' }
}

export function createQuestion({
  question,
  options = [],
  correctIndex = 0,
  explanation = '',
}) {
  return { question, options, correctIndex, explanation }
}

export function createLab({
  id,
  title,
  description,
  context = '',
  starterHtml = '',
  starterCss = '',
  hint = '',
  checklist = [],
}) {
  return {
    id,
    title,
    description,
    context,
    starterHtml,
    starterCss,
    hint,
    checklist,
    type: 'lab',
  }
}

export function createMiniProject({
  id,
  title,
  description,
  context = '',
  requirements = [],
  starterHtml = '',
  starterCss = '',
  hint = '',
  rubric = [],
}) {
  return {
    id,
    title,
    description,
    context,
    requirements,
    starterHtml,
    starterCss,
    hint,
    rubric,
    type: 'miniProject',
  }
}

export function createFinalProject({
  title,
  description,
  context = '',
  requirements = [],
  deliverables = [],
  rubric = [],
}) {
  return { title, description, context, requirements, deliverables, rubric }
}

export function createFinalEvaluation({ questions = [] }) {
  return { questions }
}

export function createNextSteps({ recommendations = [] }) {
  return { recommendations }
}
