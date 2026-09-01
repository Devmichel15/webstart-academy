import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TAGS_MAX,
  TITLE_MAX,
  parseTags,
  validateProjectForm,
} from '../../services/communityService.js'

const EMPTY_FORM = {
  title: '',
  description: '',
  projectUrl: '',
  githubUrl: '',
  tags: '',
}

function toFormValues(project) {
  if (!project) return { ...EMPTY_FORM }
  return {
    title: project.title || '',
    description: project.description || '',
    projectUrl: project.projectUrl || '',
    githubUrl: project.githubUrl || '',
    tags: (project.tags || []).join(', '),
  }
}

export function ProjectFormModal({ open, project = null, submitting = false, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [tagsPreview, setTagsPreview] = useState([])

  useEffect(() => {
    if (open) {
      setForm(toFormValues(project))
      setErrors({})
      setTagsPreview(project ? project.tags || [] : [])
    }
  }, [open, project])

  useEffect(() => {
    if (!open) return undefined
    const handler = (event) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, submitting, onClose])

  if (!open) return null

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    if (field === 'tags') {
      const parsed = parseTags(value)
      setTagsPreview(parsed)
      setErrors((current) => ({ ...current, tags: undefined }))
    }
  }

  const handleSave = () => {
    const validation = validateProjectForm({ ...form, tags: tagsPreview })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    onSave(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        projectUrl: form.projectUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        tags: tagsPreview,
      },
      project,
    )
  }

  const inputClass =
    'w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-base text-black dark:border-brand-400 dark:bg-brand-950 dark:text-primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl border-3 border-strong bg-surface p-6 shadow-lg sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-primary">
            {project ? 'Editar projeto' : 'Publicar projeto'}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-1 text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-4" noValidate>
          <div>
            <label htmlFor="project-title" className="mb-1 block text-sm font-bold text-primary">
              Título *
            </label>
            <input
              id="project-title"
              type="text"
              maxLength={TITLE_MAX}
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Weather App"
              className={inputClass}
            />
            {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="project-description" className="mb-1 block text-sm font-bold text-primary">
              Descrição *
            </label>
            <textarea
              id="project-description"
              rows={5}
              maxLength={DESCRIPTION_MAX}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Meu primeiro projeto utilizando uma API externa para obter informações do clima."
              className={`${inputClass} resize-y`}
            />
            <div className="mt-1 flex items-start justify-between gap-4">
              {errors.description ? (
                <p className="text-xs font-bold text-red-500">{errors.description}</p>
              ) : (
                <p className="text-xs text-secondary">Mínimo {DESCRIPTION_MIN} caracteres.</p>
              )}
              <span className="shrink-0 text-xs text-secondary">
                {form.description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="project-url" className="mb-1 block text-sm font-bold text-primary">
              Link do projeto
            </label>
            <input
              id="project-url"
              type="url"
              value={form.projectUrl}
              onChange={(e) => updateField('projectUrl', e.target.value)}
              placeholder="https://weather-app.vercel.app"
              className={inputClass}
            />
            {errors.projectUrl && <p className="mt-1 text-xs font-bold text-red-500">{errors.projectUrl}</p>}
          </div>

          <div>
            <label htmlFor="project-github" className="mb-1 block text-sm font-bold text-primary">
              GitHub
            </label>
            <input
              id="project-github"
              type="url"
              value={form.githubUrl}
              onChange={(e) => updateField('githubUrl', e.target.value)}
              placeholder="https://github.com/utilizador/weather-app"
              className={inputClass}
            />
            {errors.githubUrl && <p className="mt-1 text-xs font-bold text-red-500">{errors.githubUrl}</p>}
            {errors.links && <p className="mt-1 text-xs font-bold text-red-500">{errors.links}</p>}
          </div>

          <div>
            <label htmlFor="project-tags" className="mb-1 block text-sm font-bold text-primary">
              Tags * <span className="font-normal text-secondary">(separadas por vírgula, máx. {TAGS_MAX})</span>
            </label>
            <input
              id="project-tags"
              type="text"
              value={form.tags}
              onChange={(e) => updateField('tags', e.target.value)}
              placeholder="JavaScript, API, HTML, CSS"
              className={inputClass}
            />
            {tagsPreview.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagsPreview.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary dark:bg-surface-hover"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {errors.tags && <p className="mt-1 text-xs font-bold text-red-500">{errors.tags}</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-lg border-2 border-strong px-4 py-2 font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancelar
            </button>
            <ButtonSubmit submitting={submitting} isEdit={Boolean(project)} />
          </div>
        </form>
      </div>
    </div>
  )
}

function ButtonSubmit({ submitting, isEdit }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="brutal-btn inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 font-bold text-white cursor-pointer hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {submitting && <Loader2 size={16} className="animate-spin" />}
      {isEdit ? 'Guardar alterações' : 'Publicar projeto'}
    </button>
  )
}
