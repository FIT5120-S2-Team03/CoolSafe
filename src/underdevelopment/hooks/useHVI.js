// useHVI — fetches the Melbourne Heat Vulnerability Index GeoJSON used to
// paint the choropleth on the map. Cached for 24 h to match the backend's
// Cache-Control header.
import { useState, useEffect } from 'react'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'

const CACHE_KEY = SESSION_CACHE_KEYS.heatVulnerability
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours (matches server cache header)

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

export default function useHVI() {
  const cached = readCache()
  const [hviData, setHviData] = useState(cached ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (readCache()) return // already fresh

    let cancelled = false
    async function load() {
      try {
        const res = await fetch('https://coolsafe.onrender.com/api/hvi')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) { setHviData(json); writeCache(json) }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { hviData, loading, error }
}
