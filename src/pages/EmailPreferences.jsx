import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function EmailPreferences() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const [marketingOptOut, setMarketingOptOut] = useState(false)
  const [notificationsOptOut, setNotificationsOptOut] = useState(false)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error')
      setMessage('Parâmetros inválidos.')
      return
    }

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
    fetch(`${appUrl}/api/email-preferences?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.text()
      })
      .then(() => {
        setStatus('ready')
      })
      .catch(() => {
        setStatus('error')
        setMessage('Link inválido ou expirado.')
      })
  }, [uid, token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('saving')

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
    try {
      const res = await fetch(`${appUrl}/api/email-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          token,
          marketingOptOut,
          notificationsOptOut,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('saved')
        setMessage('Preferências guardadas com sucesso!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Erro ao guardar.')
      }
    } catch {
      setStatus('error')
      setMessage('Erro de conexão.')
    }
  }

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loading}>A carregar...</p>
        </div>
      </div>
    )
  }

  if (status === 'error' && !uid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Preferências de Email</h1>
          <div style={styles.error}>{message}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Preferências de Email</h1>
        <p style={styles.subtitle}>Escolhe que tipo de emails queres receber da WebStart Academy:</p>

        {status === 'saved' ? (
          <div style={styles.success}>{message}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={!marketingOptOut}
                onChange={(e) => setMarketingOptOut(!e.target.checked)}
                style={styles.checkbox}
              />
              <span>Emails de reativação (lembrar quando paraste de estudar)</span>
            </label>

            <label style={styles.label}>
              <input
                type="checkbox"
                checked={!notificationsOptOut}
                onChange={(e) => setNotificationsOptOut(!e.target.checked)}
                style={styles.checkbox}
              />
              <span>Notificações de novas aulas</span>
            </label>

            <button type="submit" style={styles.button} disabled={status === 'saving'}>
              {status === 'saving' ? 'A guardar...' : 'Guardar preferências'}
            </button>

            {status === 'error' && <div style={styles.error}>{message}</div>}
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '20px',
  },
  card: {
    maxWidth: 480,
    width: '100%',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#064e3b',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 24px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
    cursor: 'pointer',
    fontSize: 14,
    color: '#1a1a1a',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: '#064e3b',
  },
  button: {
    background: '#064e3b',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
    marginTop: 8,
    width: '100%',
  },
  success: {
    background: '#d1fae5',
    color: '#064e3b',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginTop: 12,
  },
  loading: {
    textAlign: 'center',
    color: '#64748b',
  },
}
