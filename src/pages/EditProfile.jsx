import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, AlertCircle, KeyRound } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProgress } from '../hooks/useProgress.js'
import { useAuth } from '../hooks/useAuth.js'
import { updateOwnProfile } from '../services/userService.js'
import { changePassword } from '../services/authService.js'
import { useToast } from '../contexts/ToastContext.jsx'
import { toUserMessage } from '../utils/errors.js'
import {
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MIN,
  isIncompleteProfileName,
  isValidUrl,
  normalizeUrl,
  validatePasswordChange,
  validateProfileName,
} from '../utils/profileValidation.js'

const URL_FIELDS = [
  { key: 'githubUrl', label: 'GitHub', placeholder: 'https://github.com/seu-usuario' },
  { key: 'portfolioUrl', label: 'Portfólio', placeholder: 'https://meuportfolio.com' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/seu-usuario' },
  { key: 'twitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/seu-usuario' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/seu-usuario' },
  { key: 'websiteUrl', label: 'Site pessoal', placeholder: 'https://meusite.com' },
]

const PASSWORD_FIELDS = [
  { key: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' },
  { key: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
  { key: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' },
]

function emptyForm(profile) {
  return {
    name: profile.name || '',
    bio: profile.bio || '',
    isPublic: profile.isPublic ?? true,
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    twitterUrl: profile.twitterUrl || '',
    instagramUrl: profile.instagramUrl || '',
    websiteUrl: profile.websiteUrl || '',
  }
}

export default function EditProfile() {
  const { user } = useAuth()
  const profile = useProgress()
  const { showSuccess, showError, showInfo } = useToast()

  const [form, setForm] = useState(() => emptyForm(profile))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)

  // O perfil chega do Supabase depois do primeiro render. Sem isto o formulário
  // ficava com os valores do perfil vazio até recarregar a página.
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current || !profile.profileLoaded) return
    seededRef.current = true
    setForm(emptyForm(profile))
  }, [profile.profileLoaded, profile])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const errs = {}
    const nameValidation = validateProfileName(form.name)
    if (!nameValidation.valid) errs.name = nameValidation.error
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
        name: form.name,
        bio: form.bio.trim() || null,
        isPublic: form.isPublic,
      }
      for (const { key } of URL_FIELDS) {
        data[key] = normalizeUrl(form[key]) || null
      }
      await updateOwnProfile(user.id, data)
      showSuccess('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error('[EditProfile] save error:', err)
      showError(toUserMessage(err, 'Erro ao guardar perfil.'))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (key, value) => {
    setPasswords((prev) => ({ ...prev, [key]: value }))
    if (passwordErrors[key]) setPasswordErrors((prev) => ({ ...prev, [key]: null }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const validation = validatePasswordChange(passwords)
    setPasswordErrors(validation.errors)
    if (!validation.valid) return

    setSavingPassword(true)
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        email: user.email,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showSuccess('Senha alterada com sucesso!')
    } catch (err) {
      console.error('[EditProfile] changePassword error:', err)
      showError(toUserMessage(err, 'Não foi possível alterar a senha.'))
    } finally {
      setSavingPassword(false)
    }
  }

  const incompleteName = isIncompleteProfileName(profile.name)

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

        {incompleteName && (
          <p className="mb-6 flex items-start gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Ainda não escolheste um nome. Sem ele apareces como <strong>Aluno anónimo</strong> na
              classificação semanal.
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="mb-4 text-lg font-black">Dados pessoais</h2>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-bold">Nome *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                minLength={NAME_MIN}
                maxLength={NAME_MAX}
                className="w-full rounded-lg border-2 border bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                placeholder="O teu nome"
              />
              {errors.name ? (
                <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.name}
                </span>
              ) : (
                <span className="mt-1 block text-right text-xs text-secondary">
                  {form.name.trim().length}/{NAME_MAX}
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

            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span className="text-sm">
                <span className="block font-bold">Perfil público</span>
                <span className="block text-xs text-secondary">
                  Desliga se não quiseres que o teu progresso e perfil apareçam na comunidade.
                </span>
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

        <Card className="mb-8">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-black">
            <KeyRound size={18} />
            Alterar senha
          </h2>
          <p className="mb-4 text-sm text-secondary">
            Precisas de confirmar a senha atual. A nova senha tem de ter pelo menos {PASSWORD_MIN}{' '}
            caracteres.
          </p>

          {user?.provider === 'google' ? (
            <p className="rounded-lg border-2 border-brand-400 bg-brand-50 p-4 text-sm font-semibold text-primary dark:bg-brand-950/30">
              A tua conta usa login com Google. Altera a senha nas definições da tua conta Google.
            </p>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              {PASSWORD_FIELDS.map(({ key, label, autoComplete }) => (
                <label key={key} className="mb-4 block">
                  <span className="mb-1 block text-sm font-bold">{label} *</span>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={(e) => handlePasswordChange(key, e.target.value)}
                    autoComplete={autoComplete}
                    className="w-full rounded-lg border-2 border bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                  />
                  {passwordErrors[key] && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} /> {passwordErrors[key]}
                    </span>
                  )}
                </label>
              ))}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  {savingPassword ? 'A alterar...' : 'Alterar senha'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordErrors({})
                    showInfo('Alteração de senha cancelada.')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  )
}
