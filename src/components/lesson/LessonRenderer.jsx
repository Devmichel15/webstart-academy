import { SectionHeader } from './sections/SectionHeader.jsx'
import { ConceptContent } from './sections/ConceptContent.jsx'
import { HowItWorksSection } from './sections/HowItWorksSection.jsx'
import { ListSection } from './sections/ListSection.jsx'
import { PlaygroundBlock } from './sections/PlaygroundBlock.jsx'
import { ChallengeBlock } from './sections/ChallengeBlock.jsx'
import { QuizBlock } from './sections/QuizBlock.jsx'
import { Card } from '../ui/Card.jsx'
import { CodePreview } from './CodePreview.jsx'
import { ExerciseBlock } from './ExerciseBlock.jsx'

const sections = [
  { key: 'introduction', title: 'Introdução', component: 'concept' },
  { key: 'history', title: 'História', component: 'concept' },
  { key: 'concept', title: 'Conceito', component: 'concept' },
  { key: 'howItWorks', title: 'Como Funciona', component: 'howItWorks' },
  { key: 'objectives', title: 'Objetivos', component: 'list', listType: 'objectives' },
  { key: 'prerequisites', title: 'Pré-requisitos', component: 'list', listType: 'prerequisites' },
  { key: 'realWorldApplications', title: 'Aplicações Reais', component: 'list', listType: 'realWorldApplications' },
  { key: 'bestPractices', title: 'Boas Práticas', component: 'list', listType: 'bestPractices' },
  { key: 'commonMistakes', title: 'Erros Comuns', component: 'list', listType: 'commonMistakes' },
  { key: 'curiosities', title: 'Curiosidades', component: 'list', listType: 'curiosities' },
  { key: 'deepDive', title: 'Aprofundamento', component: 'concept' },
]

export function LessonRenderer({ lesson }) {
  if (!lesson) return null

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const value = lesson[section.key]
        if (!value || (Array.isArray(value) && !value.length)) return null

        return (
          <section key={section.key} className="space-y-3">
            <SectionHeader type={section.key} title={section.title} />
            {section.component === 'concept' && <ConceptContent content={value} />}
            {section.component === 'howItWorks' && <HowItWorksSection content={value} />}
            {section.component === 'list' && <ListSection type={section.listType} items={value} />}
          </section>
        )
      })}

      {lesson.example && (
        <section className="space-y-4">
          <SectionHeader type="example" title="Exemplo" />
          <div className="grid gap-4 lg:grid-cols-2">
            {lesson.example.html && (
              <Card>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">HTML</h3>
                <pre className="overflow-x-auto rounded-lg bg-brand-950 p-4 text-sm text-brand-100">
                  <code>{lesson.example.html}</code>
                </pre>
              </Card>
            )}
            {lesson.example.css && (
              <Card>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">CSS</h3>
                <pre className="overflow-x-auto rounded-lg bg-brand-950 p-4 text-sm text-brand-100">
                  <code>{lesson.example.css}</code>
                </pre>
              </Card>
            )}
          </div>
          <CodePreview html={lesson.example.html} css={lesson.example.css} />
        </section>
      )}

      {lesson.playground && (
        <section className="space-y-4">
          <SectionHeader type="playground" title="Playground" />
          <PlaygroundBlock html={lesson.playground.html} css={lesson.playground.css} />
        </section>
      )}

      {lesson.challenge && (
        <section className="space-y-4">
          <SectionHeader type="challenge" title="Desafio" />
          <ChallengeBlock challenge={lesson.challenge} />
        </section>
      )}

      {lesson.exercise && (
        <section className="space-y-4">
          <SectionHeader type="exercise" title="Exercício" />
          <ExerciseBlock exercise={lesson.exercise} />
        </section>
      )}

      {lesson.quiz && (
        <section className="space-y-4">
          <SectionHeader type="quiz" title="Quiz da Aula" />
          <QuizBlock quiz={lesson.quiz} compact />
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader type="objectives" title="Resumo" />
        <Card>
          {lesson.summary && lesson.summary.length > 0 ? (
            <ul className="space-y-2">
              {lesson.summary.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-brand-600">Nenhum resumo disponível.</p>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader type="objectives" title="Checklist" />
        <Card>
          {lesson.checklist && lesson.checklist.length > 0 ? (
            <ul className="space-y-3">
              {lesson.checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <input type="checkbox" className="h-5 w-5 accent-brand-500" />
                  <span className="text-sm font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-brand-600">Nenhum checklist disponível.</p>
          )}
        </Card>
      </section>
    </div>
  )
}
