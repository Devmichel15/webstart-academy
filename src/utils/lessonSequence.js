export function isLessonUnlockedInSequence(lessons, lessonId, isLessonCompleted) {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId)
  if (lessonIndex < 0 || isLessonCompleted(lessonId)) return true

  return lessons
    .slice(0, lessonIndex)
    .every((lesson) => isLessonCompleted(lesson.id))
}

export function getFirstIncompleteLesson(lessons, isLessonCompleted) {
  return lessons.find((lesson) => !isLessonCompleted(lesson.id)) || null
}
