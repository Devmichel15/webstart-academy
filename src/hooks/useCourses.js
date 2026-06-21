import { useEffect, useState } from 'react'
import { subscribeToCourses } from '../services/courseService.js'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToCourses(
      (data) => {
        setCourses(data)
        setLoading(false)
      },
      (err) => {
        setError(err?.message || 'Erro ao carregar cursos.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { courses, loading, error }
}
