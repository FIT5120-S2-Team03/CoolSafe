import { useState, useEffect } from 'react'

export function useAirQuality({ lat, lng }) {
  const [aqi, setAqi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (lat == null || lng == null) return
    setLoading(true)
    setError(false)

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
        setAqi(idx >= 0 ? data.hourly.european_aqi[idx] : null)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [lat, lng])

  return { aqi, loading, error }
}
