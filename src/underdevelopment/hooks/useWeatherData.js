import { useState, useEffect } from 'react'
import mockWeather from '../data/mockWeather.json'

const CACHE_KEY = 'coolsafe_weather'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const LOCATION_UPDATED_EVENT = 'coolsafe:location-updated'

function readWeatherCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached
  } catch {
    return null
  }
}

function writeWeatherCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }))
  } catch {
    // sessionStorage may be unavailable (private browsing quota)
  }
}

export function useWeatherData() {
  const [coords, setCoords] = useState(null)
  const [current, setCurrent] = useState(null)
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [locationName, setLocationName] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [gpsBlocked, setGpsBlocked] = useState(false)

  async function fetchWeather(lat, lng) {
    setLoading(true)
    setError(false)
    try {
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,apparent_temperature&hourly=apparent_temperature` +
        `&daily=temperature_2m_max,apparent_temperature_max&timezone=Australia%2FMelbourne&forecast_days=2`
      const [data, geo] = await Promise.all([
        fetch(weatherUrl).then((r) => r.json()),
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        ).then((r) => r.json()).catch(() => null),
      ])
      const addr = geo?.address
      const name = addr?.suburb ?? addr?.town ?? addr?.city_district ?? addr?.city ?? null
      const currentData = {
        temp: data.current.temperature_2m,
        apparentTemp: data.current.apparent_temperature,
      }
      const dailyData = {
        todayMax: data.daily.temperature_2m_max[0],
        tomorrowMax: data.daily.temperature_2m_max[1],
      }
      setCurrent(currentData)
      setHourly(data.hourly)
      setDaily(dailyData)
      setLocationName(name)
      setCoords({ lat, lng })
      localStorage.setItem('coolsafe_coords', JSON.stringify({ lat, lng }))
      if (name) localStorage.setItem('cs_location', name)
      writeWeatherCache({ current: currentData, hourly: data.hourly, daily: dailyData, locationName: name, lat, lng })
      window.dispatchEvent(new CustomEvent(LOCATION_UPDATED_EVENT, {
        detail: { current: currentData, hourly: data.hourly, daily: dailyData, locationName: name, lat, lng },
      }))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mockWeather.enabled) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      const currentHour = today.getHours()
      const temps = mockWeather.hourly.apparent_temperature
      const mockHourly = {
        time: temps.map((_, i) =>
          i < 24
            ? `${dateStr}T${String(i).padStart(2, '0')}:00`
            : `${tomorrowStr}T${String(i - 24).padStart(2, '0')}:00`
        ),
        apparent_temperature: temps,
      }
      const hourlyApparent = mockWeather.hourly.apparent_temperature[currentHour]
      setCurrent({
        temp: hourlyApparent,
        apparentTemp: hourlyApparent,
      })
      setHourly(mockHourly)
      setDaily({
        todayMax: mockWeather.daily.apparent_temperature_max[0],
        tomorrowMax: mockWeather.daily.apparent_temperature_max[1],
      })
      setLocationName('Melbourne')
      setCoords({ lat: -37.8136, lng: 144.9631 })
      setLoading(false)
      return
    }

    // Restore from session cache first (fast, no network)
    const cached = readWeatherCache()
    if (cached) {
      setCurrent(cached.current)
      setHourly(cached.hourly)
      setDaily(cached.daily)
      setLocationName(cached.locationName)
      setCoords({ lat: cached.lat, lng: cached.lng })
    } else {
      // Fall back to saved coords and re-fetch
      try {
        const saved = localStorage.getItem('coolsafe_coords')
        if (saved) {
          const { lat, lng } = JSON.parse(saved)
          fetchWeather(lat, lng)
        }
      } catch {
        // ignore malformed storage
      }
    }

    // Background refresh every 30 minutes while page is open
    const timer = setInterval(() => {
      try {
        const saved = localStorage.getItem('coolsafe_coords')
        if (saved) {
          const { lat, lng } = JSON.parse(saved)
          fetchWeather(lat, lng)
        }
      } catch {
        // ignore
      }
    }, CACHE_TTL_MS)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function onLocationUpdated(event) {
      const data = event.detail
      if (!data) return
      setCurrent(data.current)
      setHourly(data.hourly)
      setDaily(data.daily)
      setLocationName(data.locationName)
      setCoords({ lat: data.lat, lng: data.lng })
      setLoading(false)
      setError(false)
    }
    window.addEventListener(LOCATION_UPDATED_EVENT, onLocationUpdated)
    return () => window.removeEventListener(LOCATION_UPDATED_EVENT, onLocationUpdated)
  }, [])

  function requestGps() {
    setLoading(true)
    setError(false)
    setGpsBlocked(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setGpsBlocked(true)
        setLoading(false)
      }
    )
  }

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
    locationName,
    loading,
    error,
    gpsBlocked,
    requestGps,
    fetchByPostcode,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  }
}
