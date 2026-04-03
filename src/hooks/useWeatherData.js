import { useState, useEffect } from 'react'

export function useWeatherData() {
  const [coords, setCoords] = useState(null)
  const [current, setCurrent] = useState(null)
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [gpsBlocked, setGpsBlocked] = useState(false)

  async function fetchWeather(lat, lng) {
    setLoading(true)
    setError(false)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,apparent_temperature&hourly=apparent_temperature` +
        `&daily=temperature_2m_max,apparent_temperature_max&timezone=Australia%2FMelbourne&forecast_days=2`
      const data = await (await fetch(url)).json()
      setCurrent({
        temp: data.current.temperature_2m,
        apparentTemp: data.current.apparent_temperature,
      })
      setHourly(data.hourly)
      setDaily({
        todayMax: data.daily.temperature_2m_max[0],
        tomorrowMax: data.daily.temperature_2m_max[1],
      })
      setCoords({ lat, lng })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setGpsBlocked(true)
        setLoading(false)
      }
    )
  }, [])

  async function fetchByPostcode(postcode) {
    setLoading(true)
    setError(false)
    try {
      const geo = await (
        await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postcode)}&countrycodes=au&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
      ).json()
      if (!geo.length) throw new Error('Postcode not found')
      await fetchWeather(parseFloat(geo[0].lat), parseFloat(geo[0].lon))
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return {
    current,
    hourly,
    daily,
    loading,
    error,
    gpsBlocked,
    fetchByPostcode,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  }
}
