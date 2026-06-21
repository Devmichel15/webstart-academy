import { ExternalLink } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { supportMaterials, vscodeGuide, learningRoadmap } from '../data/materials'

export default function Materials() {
  return (
    <div>
      <Header
        title="Materiais de Apoio"
        subtitle="Vídeos, livros, ferramentas e guia de configuração."
      />

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-black">Roadmap de aprendizagem</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {learningRoadmap.map((phase) => (
            <Card key={phase.phase}>
              <h3 className="mb-3 font-black text-brand-600">{phase.phase}</h3>
              <ul className="space-y-1 text-sm">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {supportMaterials.map((material) => (
        <section key={material.id} className="mb-8">
          <h2 className="mb-4 text-xl font-black">{material.title}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <h3 className="mb-3 font-black">Vídeos recomendados</h3>
              <ul className="space-y-3">
                {material.videos.map((video) => (
                  <li key={video.url}>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 font-semibold text-brand-700 hover:text-brand-500 dark:text-brand-300"
                    >
                      <ExternalLink size={14} className="mt-1 shrink-0" />
                      <span>
                        {video.title}
                        <span className="block text-xs font-normal text-brand-500">{video.channel}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="mb-3 font-black">Livros sugeridos</h3>
              <ul className="space-y-2 text-sm">
                {material.books.map((book) => (
                  <li key={book.title}>
                    <p className="font-bold">{book.title}</p>
                    <p className="text-brand-600">{book.author}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="mb-3 font-black">Ferramentas úteis</h3>
              <ul className="space-y-2">
                {material.tools.map((tool) => (
                  <li key={tool.url}>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-500 dark:text-brand-300"
                    >
                      <ExternalLink size={12} />
                      {tool.name}
                    </a>
                  </li>
                ))}
              </ul>
              <h4 className="mb-2 mt-4 text-sm font-black">Extensões VS Code</h4>
              <div className="flex flex-wrap gap-1">
                {material.extensions.map((ext) => (
                  <span
                    key={ext}
                    className="rounded border-2 border-brand-800 px-2 py-0.5 text-xs font-bold dark:border-brand-400"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-4 text-xl font-black">{vscodeGuide.title}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {vscodeGuide.steps.map((step) => (
            <Card key={step.title}>
              <h3 className="mb-2 font-black">{step.title}</h3>
              <p className="text-sm text-brand-700 dark:text-brand-300">{step.content}</p>
              {step.extension && (
                <p className="mt-2 text-xs font-bold text-brand-600">Extensão: {step.extension}</p>
              )}
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  Abrir link
                </a>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
