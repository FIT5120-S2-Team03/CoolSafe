import { useState, useEffect } from 'react'

const CACHE_KEY = 'coolsafe_hvi'
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
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() })) } catch {}
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
        const res = await fetch('https://coolsafe-api.onrender.com/api/hvi')
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
