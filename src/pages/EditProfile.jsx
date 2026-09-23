import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProgress } from '../hooks/useProgress.js'
import { useAuth } from '../hooks/useAuth.js'
import { updateUserProfile } from '../services/userService.js'
import { useToast } from '../contexts/ToastContext.jsx'
import { toUserMessage } from '../utils/errors.js'

const URL_FIELDS = [
  { key: 'githubUrl', label: 'GitHub', placeholder: 'https://github.com/seu-usuario' },
  { key: 'portfolioUrl', label: 'Portfólio', placeholder: 'https://meuportfolio.com' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/seu-usuario' },
  { key: 'twitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/seu-usuario' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/seu-usuario' },
  { key: 'websiteUrl', label: 'Site pessoal', placeholder: 'https://meusite.com' },
]

function normalizeUrl(value) {
  if (!value || !value.trim()) return ''
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(value) {
  if (!value) return true
  try {
    const url = new URL(normalizeUrl(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function EditProfile() {
  const { user } = useAuth()
  const profile = useProgress()
  const { showSuccess, showError } = useToast()

  const [form, setForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    githubUrl: profile.github_url || '',
    portfolioUrl: profile.portfolio_url || '',
    linkedinUrl: profile.linkedin_url || '',
    twitterUrl: profile.twitter_url || '',
    instagramUrl: profile.instagram_url || '',
    websiteUrl: profile.website_url || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'O nome é obrigatório.'
    for (const { key } of URL_FIELDS) {
      if (form[key] && !isValidUrl(form[key])) {
        errs[key] = 'URL inválida. Exemplo: https://github.com/usuario'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        bio: form.bio.trim() || null,
      }
      for (const { key } of URL_FIELDS) {
        data[key] = normalizeUrl(form[key]) || null
      }
      await updateUserProfile(user.id, data)
      showSuccess('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error('[EditProfile] save error:', err)
      showError(toUserMessage(err, 'Erro ao guardar perfil.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SEO title="Editar Perfil" description="Edita o teu perfil na WebStart Academy." url="/editar-perfil" />
      <div>
        <Header
          title="Editar Perfil"
          subtitle="Actualiza os teus dados e links de networking."
        />

        <Link
          to="/perfil"
          className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Voltar ao perfil
        </Link>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="mb-4 text-lg font-black">Dados pessoais</h2>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-bold">Nome *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-lg border-2 border bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                placeholder="O teu nome"
              />
              {errors.name && (
                <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.name}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold">Bio</span>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border-2 border bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                placeholder="Conta-nos algo sobre ti..."
              />
              <span className="mt-1 block text-right text-xs text-secondary">
                {form.bio.length}/500
              </span>
            </label>
          </Card>

          <Card className="mb-8">
            <h2 className="mb-4 text-lg font-black">Links de networking</h2>
            <p className="mb-4 text-sm text-secondary">
              Adiciona os teus links para que outros alunos te encontrem.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {URL_FIELDS.map(({ key, label, placeholder }) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-sm font-bold">{label}</span>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-lg border-2 border bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                    placeholder={placeholder}
                  />
                  {errors[key] && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} /> {errors[key]}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </Card>

          <div className="mb-8 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'A guardar...' : 'Guardar alterações'}
            </Button>
            <Link to="/perfil">
              <Button type="button" variant="ghost">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
