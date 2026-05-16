import { useState, useEffect } from 'react'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'
const CACHE_KEY = SESSION_CACHE_KEYS.coolSpaces
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

export default function useCoolSpaces() {
  const cached = readCache()
  const [venues, setVenues] = useState(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (readCache()) return // already fresh

    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/cool-spaces`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) { setVenues(data); writeCache(data) }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { venues, loading, error }
}
