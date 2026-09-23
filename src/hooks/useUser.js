import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { subscribeToUser } from '../services/userService.js'
import { toUserMessage } from '../utils/errors.js'

export function useUser() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return undefined

    if (!user) {
      setProfile(null)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeToUser(
      user.id,
      (data) => {
        setProfile(data)
        setLoading(false)
      },
      (err) => {
        setError(toUserMessage(err, 'Erro ao carregar o utilizador.'))
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user, authLoading])

  return {
    user: profile,
    loading: authLoading || loading,
    error,
  }
}
