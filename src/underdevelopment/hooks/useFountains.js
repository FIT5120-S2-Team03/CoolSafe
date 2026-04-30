import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe-api.onrender.com'

export default function useFountains() {
  const [fountains, setFountains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/fountains`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setFountains(data.map(f => ({ ...f, category: 'Fountain' })))
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { fountains, loading, error }
}
