import { useState, useEffect, useCallback } from 'react'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'
const DETAIL_CACHE_PREFIX = SESSION_CACHE_KEYS.venueDetailPrefix
const LIST_CACHE_KEYS = [SESSION_CACHE_KEYS.coolSpaces, SESSION_CACHE_KEYS.fountains]
const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function readDetailCache(id) {
  const cached = readJson(`${DETAIL_CACHE_PREFIX}${id}`)
  if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null
  return cached.data
}

function writeDetailCache(id, data) {
  try {
    sessionStorage.setItem(`${DETAIL_CACHE_PREFIX}${id}`, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
    // sessionStorage may be unavailable in private browsing.
  }
}

function findCachedVenue(id) {
  for (const key of LIST_CACHE_KEYS) {
    const cached = readJson(key)
    if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS || !Array.isArray(cached.data)) continue
    const found = cached.data.find((venue) => String(venue.id) === String(id))
    if (found) return found
  }
  return null
}

export default function useVenue(id, initialVenue = null) {
  const getInitialVenue = useCallback(() => {
    if (initialVenue && String(initialVenue.id) === String(id)) return initialVenue
    return readDetailCache(id) ?? findCachedVenue(id)
  }, [id, initialVenue])

  const [venue, setVenue] = useState(getInitialVenue)
  const [loading, setLoading] = useState(() => !getInitialVenue())
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id == null) {
      setLoading(false)
      return
    }

    let cancelled = false
    const cached = getInitialVenue()
    if (cached) {
      setVenue(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/venue/${id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        writeDetailCache(id, data)
        if (!cancelled) setVenue(data)
      } catch (err) {
        if (!cancelled && !cached) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, getInitialVenue])

  return { venue, loading, error }
}
