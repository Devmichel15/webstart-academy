import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckSquare } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LessonIllustration } from '../components/lesson/LessonIllustration'
import { CodePreview } from '../components/lesson/CodePreview'
import { ExerciseBlock } from '../components/lesson/ExerciseBlock'
import { getLessonById, getNextLesson, getCourseById } from '../data/courses'
import { useProgress } from '../context/ProgressContext'

export default function Lesson() {
  const { lessonId } = useParams()
  const lesson = getLessonById(lessonId)
  const nextLesson = getNextLesson(lessonId)
  const course = lesson ? getCourseById(lesson.courseId) : null
  const { completeLesson, visitLesson, isLessonCompleted } = useProgress()

  useEffect(() => {
    if (lesson) visitLesson(lesson.id)
  }, [lesson, visitLesson])

  if (!lesson) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Aula não encontrada</h1>
        <Link to="/cursos" className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar aos cursos
        </Link>
      </div>
    )
  }

  const completed = isLessonCompleted(lesson.id)

  const handleComplete = () => {
    completeLesson(lesson.id)
  }

  return (
    <div>
      <Link to={`/cursos/${lesson.courseId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {course?.title}
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]"
      >
        <Badge className="mb-4 !border-white/30 !bg-white/20 !text-white">{course?.title}</Badge>
        <h1 className="mb-2 text-3xl font-black md:text-4xl">{lesson.hero.title}</h1>
        <p className="max-w-2xl text-brand-100">{lesson.hero.subtitle}</p>
      </motion.section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <LessonIllustration type={lesson.illustration} />
        <Card>
          <h2 className="mb-4 text-lg font-black">Resumo rápido</h2>
          <ul className="space-y-2">
            {lesson.summary.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckSquare size={16} className="mt-0.5 shrink-0 text-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-black">Explicação</h2>
        {lesson.sections.map((section) => (
          <Card key={section.title}>
            <h3 className="mb-2 font-black">{section.title}</h3>
            <p className="leading-relaxed text-brand-800 dark:text-brand-200">{section.content}</p>
          </Card>
        ))}
      </section>

      {lesson.example && (
        <section className="mb-8 space-y-4">
          <h2 className="text-xl font-black">Exemplo</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">HTML</h3>
              <pre className="overflow-x-auto rounded-lg bg-brand-950 p-4 text-sm text-brand-100">
                <code>{lesson.example.html}</code>
              </pre>
            </Card>
            <Card>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">CSS</h3>
              <pre className="overflow-x-auto rounded-lg bg-brand-950 p-4 text-sm text-brand-100">
                <code>{lesson.example.css}</code>
              </pre>
            </Card>
          </div>
          <CodePreview html={lesson.example.html} css={lesson.example.css} />
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-black">Exercício</h2>
        <ExerciseBlock exercise={lesson.exercise} onComplete={handleComplete} />
      </section>

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-black">Checklist da aula</h2>
        <ul className="space-y-2">
          {lesson.checklist.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-500" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
        {!completed && (
          <Button className="mt-4" onClick={handleComplete}>
            Concluir aula (+{lesson.xp} XP)
          </Button>
        )}
        {completed && (
          <p className="mt-4 font-bold text-brand-600">Aula concluída! +{lesson.xp} XP ganhos.</p>
        )}
      </Card>

      {nextLesson && (
        <div className="flex justify-end">
          <Link to={`/aula/${nextLesson.id}`}>
            <Button>
              Próxima aula: {nextLesson.title}
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
