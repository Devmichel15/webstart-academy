import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { achievements } from '../data/achievements.js'
import { courses } from '../data/courses.js'

export async function seedFirestoreContent() {
  const batch = writeBatch(db)

  for (const course of courses) {
    batch.set(doc(db, 'courses', course.id), {
      id: course.id,
      title: course.title,
      slug: course.id,
      description: course.description,
      thumbnail: '',
      difficulty: 'beginner',
      estimatedHours: Math.ceil(course.lessons.reduce((sum, l) => sum + l.duration, 0) / 60),
      totalLessons: course.lessons.length,
    })

    const moduleId = `${course.id}-main`
    batch.set(doc(db, 'modules', moduleId), {
      id: moduleId,
      courseId: course.id,
      title: 'Módulos do curso',
      description: course.description,
      order: 1,
    })

    course.lessons.forEach((lesson, index) => {
      batch.set(doc(db, 'lessons', lesson.id), {
        id: lesson.id,
        moduleId,
        courseId: course.id,
        title: lesson.title,
        slug: lesson.id,
        content: lesson.description,
        illustration: lesson.illustration,
        estimatedTime: lesson.duration,
        order: index + 1,
        resources: [],
        exercise: lesson.exercise || null,
      })
    })
  }

  achievements.forEach((achievement) => {
    batch.set(doc(db, 'achievements', achievement.id), {
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.type === 'xp' ? 50 : 100,
      requirement: achievement.description,
      type: achievement.type,
      target: achievement.target || null,
      courseId: achievement.courseId || null,
    })
  })

  await batch.commit()
}
