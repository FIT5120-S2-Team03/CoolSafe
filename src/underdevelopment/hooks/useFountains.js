// useFountains — loads all public drinking fountains from the backend and
// tags each entry with category='Fountain' so the map renders them with a
// distinct icon. Cached in sessionStorage for 2 hours.
import { useState, useEffect } from 'react'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'
const CACHE_KEY = SESSION_CACHE_KEYS.fountains
const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, cachedAt } = JSON.parse(raw)
    if (Date.now() - cachedAt > CACHE_TTL_MS) { sessionStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
    // sessionStorage may be unavailable in private browsing.
  }
}

export default function useFountains() {
  const cached = readCache()
  const [fountains, setFountains] = useState(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (readCache()) return // already fresh

    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/fountains`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()).map(f => ({ ...f, category: 'Fountain' }))
        if (!cancelled) { setFountains(data); writeCache(data) }
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
