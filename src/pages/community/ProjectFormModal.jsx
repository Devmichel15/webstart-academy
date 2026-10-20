import { useEffect, useMemo, useRef, useState } from 'react'
import { Github, ImageIcon, Link as LinkIcon, Loader2, Plus, User, X } from 'lucide-react'
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TAGS_MAX,
  TITLE_MAX,
  parseTags,
  validateProjectForm,
} from '../../services/communityService.js'
import {
  POST_IMAGE_TYPES,
  POST_IMAGES_MAX,
  projectImageUrl,
  validateImageFile,
} from '../../services/projectImageService.js'

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
    tags: '',
  }
}

export function ProjectFormModal({ open, project = null, author = null, submitting = false, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})
  const [tagsLimitError, setTagsLimitError] = useState(null)
  const [tagsPreview, setTagsPreview] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [keptPaths, setKeptPaths] = useState([])
  const [imageErrors, setImageErrors] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const fileInputRef = useRef(null)
  const panelRef = useRef(null)
  const titleRef = useRef(null)
  const [fileUrls, setFileUrls] = useState(() => new Map())
  const fileUrlsRef = useRef(fileUrls)

  useEffect(() => {
    fileUrlsRef.current = fileUrls
  }, [fileUrls])

  const revokeFileUrls = (map = fileUrlsRef.current) => {
    map.forEach((url) => URL.revokeObjectURL(url))
    setFileUrls(new Map())
  }

  useEffect(() => {
    if (open) {
      const nextForm = toFormValues(project)
      setForm(nextForm)
      setTouched({})
      setTagsLimitError(null)
      setTagsPreview(project ? project.tags || [] : [])
      setImageFiles([])
      setKeptPaths(project ? (project.imagePaths || []) : [])
      setImageErrors([])
      setActiveIndex(0)
      setConfirmDiscard(false)
      setDragActive(false)
      setInitialSnapshot(
        JSON.stringify({
          form: nextForm,
          tags: project ? project.tags || [] : [],
          kept: project ? project.imagePaths || [] : [],
          files: 0,
        }),
      )
    } else {
      revokeFileUrls()
      setImageFiles([])
      setKeptPaths([])
      setImageErrors([])
    }
  }, [open, project])

  useEffect(() => {
    if (!open) return undefined
    const timer = requestAnimationFrame(() => titleRef.current?.focus())
    return () => cancelAnimationFrame(timer)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    const handler = (event) => {
      if (event.key !== 'Tab' || !panel) return
      const nodes = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const handler = (event) => {
      if (event.key !== 'Escape' || submitting) return
      if (confirmDiscard) {
        setConfirmDiscard(false)
        return
      }
      if (isDirty) setConfirmDiscard(true)
      else onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  useEffect(() => {
    const urls = fileUrlsRef
    return () => urls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const effectiveTags = useMemo(() => {
    const merged = [...tagsPreview]
    const seen = new Set(merged)
    for (const tag of parseTags(form.tags)) {
      if (!seen.has(tag) && merged.length < TAGS_MAX) {
        seen.add(tag)
        merged.push(tag)
      }
    }
    return merged
  }, [tagsPreview, form.tags])

  const validation = useMemo(
    () =>
      validateProjectForm({
        ...form,
        tags: effectiveTags,
        images: imageFiles,
        imagePaths: keptPaths,
      }),
    [form, effectiveTags, imageFiles, keptPaths],
  )

  const isDirty =
    Boolean(open) &&
    Boolean(initialSnapshot) &&
    JSON.stringify({ form, tags: tagsPreview, kept: keptPaths, files: imageFiles.length }) !==
      initialSnapshot

  const canPublish = validation.valid && !submitting

  const imageEntries = useMemo(
    () => [
      ...keptPaths.map((path) => ({
        key: `path:${path}`,
        type: 'path',
        src: projectImageUrl(path),
        path,
      })),
      ...imageFiles.map((file, index) => ({
        key: `file:${file.name}:${file.lastModified}:${index}`,
        type: 'file',
        src: fileUrls.get(file),
        file,
      })),
    ],
    [keptPaths, imageFiles, fileUrls],
  )

  const currentIndex = Math.min(activeIndex, Math.max(0, imageEntries.length - 1))
  const currentEntry = imageEntries[currentIndex]

  if (!open) return null

  const imageTotal = keptPaths.length + imageFiles.length

  const requestClose = () => {
    if (submitting) return
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const addFiles = (picked) => {
    if (!picked.length || submitting) return

    const messages = []
    const accepted = []
    let total = keptPaths.length + imageFiles.length

    for (const file of picked) {
      const invalid = validateImageFile(file)
      if (invalid) {
        messages.push(`«${file.name}»: ${invalid}`)
        continue
      }
      if (total >= POST_IMAGES_MAX) {
        messages.push(`Só podes anexar até ${POST_IMAGES_MAX} imagens por publicação.`)
        break
      }
      accepted.push(file)
      total += 1
    }

    if (accepted.length) {
      setFileUrls((current) => {
        const next = new Map(current)
        accepted.forEach((file) => next.set(file, URL.createObjectURL(file)))
        return next
      })
      setImageFiles((current) => [...current, ...accepted])
      setActiveIndex(keptPaths.length)
    }
    setImageErrors(messages)
  }

  const handleFilesSelected = (event) => {
    const picked = Array.from(event.target.files || [])
    event.target.value = ''
    addFiles(picked)
  }

  const removeNewFile = (file) => {
    setFileUrls((current) => {
      const url = current.get(file)
      if (url) URL.revokeObjectURL(url)
      const next = new Map(current)
      next.delete(file)
      return next
    })
    setImageFiles((current) => current.filter((item) => item !== file))
  }

  const removeKeptPath = (path) => {
    setKeptPaths((current) => current.filter((item) => item !== path))
  }

  const removeImageEntry = (entry) => {
    if (entry.type === 'path') removeKeptPath(entry.path)
    else removeNewFile(entry.file)
  }

  const absorbPendingTag = () => {
    const parsed = parseTags(form.tags)
    if (!parsed.length) return
    setTagsPreview((current) => {
      const next = [...current]
      for (const tag of parsed) {
        if (next.length >= TAGS_MAX) break
        if (!next.includes(tag)) next.push(tag)
      }
      return next
    })
    setForm((current) => ({ ...current, tags: '' }))
    setTagsLimitError(null)
  }

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      absorbPendingTag()
      return
    }
    if (event.key === 'Backspace' && !form.tags && tagsPreview.length) {
      setTagsPreview((current) => current.slice(0, -1))
    }
  }

  const removeTag = (tag) => {
    setTagsPreview((current) => current.filter((item) => item !== tag))
    setTagsLimitError(null)
  }

  const handleSave = () => {
    if (submitting || !canPublish) return
    onSave(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        projectUrl: form.projectUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        tags: effectiveTags,
        images: imageFiles,
        imagePaths: keptPaths,
      },
      project,
    )
  }

  const fieldError = (field) => (touched[field] ? validation.errors[field] : undefined)
  const showLinksError =
    (touched.projectUrl || touched.githubUrl) && validation.errors.links

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={POST_IMAGE_TYPES.join(',')}
      multiple
      className="hidden"
      onChange={handleFilesSelected}
      disabled={submitting}
    />
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface max-[859px]:border-0 sm:h-[min(90vh,660px)] sm:max-w-[980px] sm:rounded-2xl sm:border-2 sm:border-strong sm:shadow-brutal-lg"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <button
            type="button"
            aria-label="Fechar"
            disabled={submitting}
            onClick={requestClose}
            className="rounded-full p-1.5 text-secondary transition-colors hover:bg-surface-hover hover:text-primary disabled:opacity-50"
          >
            <X size={20} />
          </button>
          <h2 id="project-modal-title" ref={titleRef} tabIndex={-1} className="text-base font-black text-primary outline-none">
            {project ? 'Editar projeto' : 'Novo projeto'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canPublish}
            className="brutal-btn inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {project ? 'Guardar' : 'Publicar'}
          </button>
        </div>

        <form
          id="project-publish-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          noValidate
          className="flex min-h-0 flex-1 flex-col max-[859px]:overflow-y-auto min-[860px]:grid min-[860px]:grid-cols-[1.2fr_1fr]"
        >
          <div
            className="relative flex min-h-[220px] flex-col overflow-hidden border-b border-border bg-canvas min-[860px]:min-h-0 min-[860px]:border-b-0 min-[860px]:border-r"
            onDragOver={(e) => {
              e.preventDefault()
              if (!submitting) setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              addFiles(Array.from(e.dataTransfer?.files || []))
            }}
          >
            {imageEntries.length === 0 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center transition-colors disabled:cursor-not-allowed ${
                  dragActive ? 'bg-accent-soft' : ''
                }`}
              >
                <ImageIcon size={48} strokeWidth={1.4} className="text-secondary" />
                <span className="text-lg font-black text-primary">Mostra o teu projeto</span>
                <span className="text-sm text-secondary">
                  Até {POST_IMAGES_MAX} imagens · JPEG, PNG ou WebP · 5 MB cada
                </span>
                <span className="brutal-btn rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white">
                  Escolher imagens
                </span>
              </button>
            ) : (
              <>
                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  <img
                    src={currentEntry?.src}
                    alt="Pré-visualização do projeto"
                    className="h-full w-full object-contain"
                  />
                  {imageEntries.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {imageEntries.map((entry, index) => (
                        <button
                          key={entry.key}
                          type="button"
                          aria-label={`Ver imagem ${index + 1}`}
                          onClick={() => setActiveIndex(index)}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            index === currentIndex ? 'bg-accent' : 'bg-primary/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-black/75 disabled:opacity-50"
                  >
                    Trocar
                  </button>
                </div>
                <div className="flex items-center gap-2 border-t border-border p-2">
                  <span className="px-1 text-xs font-semibold text-secondary">
                    {imageTotal}/{POST_IMAGES_MAX}
                  </span>
                  {imageEntries.map((entry, index) => (
                    <div
                      key={entry.key}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                        index === currentIndex ? 'border-accent' : 'border-border'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className="h-full w-full"
                        aria-label={`Seleccionar imagem ${index + 1}`}
                      >
                        <img
                          src={entry.src}
                          alt={entry.type === 'path' ? 'Imagem existente' : 'Nova imagem seleccionada'}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => removeImageEntry(entry)}
                        aria-label="Remover imagem"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/65 p-0.5 text-white transition-colors hover:bg-black/85 disabled:opacity-50"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {imageTotal < POST_IMAGES_MAX && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Adicionar imagem"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-strong text-secondary transition-colors hover:bg-surface-hover hover:text-primary disabled:opacity-50"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </>
            )}
            {fileInput}
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto">
            <div className="flex items-center gap-2.5 px-4 py-3">
              {author?.photoURL ? (
                <img
                  src={author.photoURL}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-border object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent-soft">
                  <User size={15} className="text-secondary" />
                </div>
              )}
              <span className="truncate text-sm font-bold text-primary">{author?.name || 'Aluno'}</span>
            </div>

            <div className="px-4">
              <input
                id="project-title"
                type="text"
                aria-label="Título do projeto"
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => markTouched('title')}
                placeholder="Nome do projeto"
                disabled={submitting}
                className="w-full bg-transparent text-lg font-black text-primary outline-none placeholder:font-normal placeholder:text-muted"
              />
              {fieldError('title') && (
                <p className="mt-1 text-xs text-red-500">{validation.errors.title}</p>
              )}
            </div>

            <div className="flex flex-1 flex-col px-4 pt-2">
              <textarea
                id="project-description"
                aria-label="Descrição"
                rows={5}
                maxLength={DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                onBlur={() => markTouched('description')}
                placeholder="Conta o que construíste, o que aprendeste, o que foi difícil…"
                disabled={submitting}
                className="min-h-[110px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-primary outline-none placeholder:text-muted"
              />
              <div className="flex justify-end pb-1">
                <span className="text-xs text-secondary">
                  {form.description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              {fieldError('description') && (
                <p className="mb-1 text-xs text-red-500">{validation.errors.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
              {tagsPreview.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  disabled={submitting}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remover tag ${tag}`}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                >
                  #{tag}
                  <X size={11} />
                </button>
              ))}
              <input
                id="project-tags"
                type="text"
                aria-label="Tags"
                value={form.tags}
                onChange={(e) => {
                  updateField('tags', e.target.value)
                  setTagsLimitError(null)
                }}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  markTouched('tags')
                  absorbPendingTag()
                }}
                placeholder="Adicionar #tags (Enter)"
                disabled={submitting}
                className="min-w-[120px] flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
              />
              {(fieldError('tags') || tagsLimitError) && (
                <p className="w-full text-xs text-red-500">{tagsLimitError || validation.errors.tags}</p>
              )}
            </div>

            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <LinkIcon size={16} className="shrink-0 text-secondary" />
                <input
                  id="project-url"
                  type="url"
                  aria-label="Link do projeto"
                  value={form.projectUrl}
                  onChange={(e) => updateField('projectUrl', e.target.value)}
                  onBlur={() => markTouched('projectUrl')}
                  placeholder="Link do projeto"
                  disabled={submitting}
                  className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                />
              </div>
              {fieldError('projectUrl') && (
                <p className="mt-1 pl-7 text-xs text-red-500">{validation.errors.projectUrl}</p>
              )}
            </div>

            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Github size={16} className="shrink-0 text-secondary" />
                <input
                  id="project-github"
                  type="url"
                  aria-label="Repositório no GitHub"
                  value={form.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  onBlur={() => markTouched('githubUrl')}
                  placeholder="Repositório no GitHub"
                  disabled={submitting}
                  className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                />
              </div>
              {fieldError('githubUrl') && (
                <p className="mt-1 pl-7 text-xs text-red-500">{validation.errors.githubUrl}</p>
              )}
              {showLinksError && <p className="mt-1 pl-7 text-xs text-red-500">{validation.errors.links}</p>}
            </div>

            <div className="border-t border-border px-4 py-3">
              {imageTotal >= POST_IMAGES_MAX && (
                <p className="mb-1 text-xs text-secondary">Limite de {POST_IMAGES_MAX} imagens atingido.</p>
              )}
              {imageErrors.map((message) => (
                <p key={message} className="mb-1 text-xs text-red-500">{message}</p>
              ))}
              <p className="text-xs text-secondary">
                Título, descrição (mín. {DESCRIPTION_MIN} caracteres), pelo menos 1 tag e um link são obrigatórios.
              </p>
            </div>
          </div>
        </form>

        {confirmDiscard && (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-black/60 p-4"
            role="alertdialog"
            aria-modal="true"
            aria-label="Descartar alterações"
          >
            <div className="w-full max-w-xs rounded-2xl border-2 border-strong bg-surface p-5 text-center shadow-brutal">
              <p className="mb-1 font-black text-primary">Descartar alterações?</p>
              <p className="mb-5 text-sm text-secondary">
                {project ? 'As alterações ao projeto serão perdidas.' : 'O teu projeto ainda não foi publicado.'}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDiscard(false)
                    onClose()
                  }}
                  className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition-colors hover:bg-red-600"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="rounded-lg border-2 border-strong px-4 py-2 font-bold text-primary transition-colors hover:bg-surface-hover"
                >
                  Continuar a editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
