import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '../firebase/firebase.js'
import { onAuthStateChanged } from '../services/authService.js'
import { createUserProfile } from '../services/userService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const provider = firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' : 'email'
          await createUserProfile(firebaseUser, {
            name: firebaseUser.displayName,
            provider,
          })
        }
        setUser(firebaseUser)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext must be used within AuthProvider')
  return context
}
