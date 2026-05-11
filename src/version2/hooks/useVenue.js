import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe-api.onrender.com'

export default function useVenue(id) {
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id == null) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/venue/${id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setVenue(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  return { venue, loading, error }
}
