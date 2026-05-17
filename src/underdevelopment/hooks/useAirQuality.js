import { useState, useEffect } from 'react'
import mockWeather from '../mocks/mockWeather.json'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'

const CACHE_KEY = SESSION_CACHE_KEYS.airQuality
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function readAqiCache(lat, lng) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (
      cached.lat !== lat ||
      cached.lng !== lng ||
      Date.now() - cached.cachedAt > CACHE_TTL_MS
    ) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached
  } catch {
    return null
  }
}

function writeAqiCache(lat, lng, aqi) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, aqi, cachedAt: Date.now() }))
  } catch {
    // sessionStorage may be unavailable
  }
}

export function useAirQuality({ lat, lng }) {
  const [aqi, setAqi] = useState(() => mockWeather.enabled ? mockWeather.aqi.value : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (mockWeather.enabled) return
    if (lat == null || lng == null) return

    // Return cached value if fresh and for same location
    const cached = readAqiCache(lat, lng)
    if (cached) {
      queueMicrotask(() => setAqi(cached.aqi))
      return
    }

    queueMicrotask(() => {
      setLoading(true)
      setError(false)
    })

    const now = new Date()
    const hourStr =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, '0')}-` +
      `${String(now.getDate()).padStart(2, '0')}T` +
      `${String(now.getHours()).padStart(2, '0')}:00`

    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=european_aqi&timezone=Australia%2FMelbourne`
    )
      .then((r) => r.json())
      .then((data) => {
        const idx = data.hourly.time.indexOf(hourStr)
        const value = idx >= 0 ? data.hourly.european_aqi[idx] : null
        setAqi(value)
        writeAqiCache(lat, lng, value)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [lat, lng])

  return { aqi, loading, error }
}
