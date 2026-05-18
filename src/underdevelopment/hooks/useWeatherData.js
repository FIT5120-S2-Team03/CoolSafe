// useWeatherData — wraps useUserLocation and Open-Meteo's forecast API to
// expose current temp / hourly feels-like / today & tomorrow peak. Refreshes
// every 30 minutes and falls back to mockWeather.json when enabled.
import { useEffect, useState } from 'react'
import mockWeather from '../mocks/mockWeather.json'
import mockLocation from '../mocks/mockLocation.json'
import { useUserLocation } from './useUserLocation'
import { SESSION_CACHE_KEYS } from '../constants/storageKeys'
import { MELBOURNE_COORDS } from '../constants/locations'

const CACHE_KEY = SESSION_CACHE_KEYS.weather
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function sameCoords(a, b) {
  if (!a || !b) return false
  return Math.abs(a.lat - b.lat) < 0.00001 && Math.abs(a.lng - b.lng) < 0.00001
}

function readWeatherCache(coords) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS || !sameCoords(coords, cached.coords)) {
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
    // sessionStorage may be unavailable in private browsing.
  }
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMockHourly() {
  const today = new Date()
  const dateStr = localDateStr(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = localDateStr(tomorrow)
  const temps = mockWeather.hourly.apparent_temperature

  return {
    time: temps.map((_, i) =>
      i < 24
        ? `${dateStr}T${String(i).padStart(2, '0')}:00`
        : `${tomorrowStr}T${String(i - 24).padStart(2, '0')}:00`
    ),
    apparent_temperature: temps,
  }
}

export function useWeatherData() {
  const location = useUserLocation()
  const [current, setCurrent] = useState(null)
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(false)

  const coords = location.coords

  // Fetch current + hourly + daily forecast for the given coords, then cache it.
  async function fetchWeather(lat, lng) {
    const nextCoords = { lat, lng }
    setWeatherLoading(true)
    setWeatherError(false)

    try {
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,apparent_temperature&hourly=apparent_temperature` +
        `&daily=temperature_2m_max,apparent_temperature_max&timezone=Australia%2FMelbourne&forecast_days=2`
      const data = await fetch(weatherUrl).then((r) => r.json())
      const currentData = {
        temp: data.current.temperature_2m,
        apparentTemp: data.current.apparent_temperature,
      }
      const dailyData = {
        todayMax: data.daily.apparent_temperature_max[0],
        tomorrowMax: data.daily.apparent_temperature_max[1],
      }

      setCurrent(currentData)
      setHourly(data.hourly)
      setDaily(dailyData)
      writeWeatherCache({
        current: currentData,
        hourly: data.hourly,
        daily: dailyData,
        coords: nextCoords,
      })
    } catch {
      setWeatherError(true)
    } finally {
      setWeatherLoading(false)
    }
  }

  useEffect(() => {
    if (mockWeather.enabled) {
      const mockHourly = getMockHourly()
      const currentHour = new Date().getHours()
      const hourlyApparent = mockHourly.apparent_temperature[currentHour]

      setCurrent({
        temp: hourlyApparent,
        apparentTemp: hourlyApparent,
      })
      setHourly(mockHourly)
      setDaily({
        todayMax: mockWeather.daily.apparent_temperature_max[0],
        tomorrowMax: mockWeather.daily.apparent_temperature_max[1],
      })
      setWeatherLoading(false)
      setWeatherError(false)
      return
    }

    if (!coords) return

    const cached = readWeatherCache(coords)
    if (cached) {
      setCurrent(cached.current)
      setHourly(cached.hourly)
      setDaily(cached.daily)
      setWeatherLoading(false)
      setWeatherError(false)
      return
    }

    fetchWeather(coords.lat, coords.lng)
  }, [coords])

  useEffect(() => {
    if (mockWeather.enabled || !coords) return undefined

    const timer = setInterval(() => {
      fetchWeather(coords.lat, coords.lng)
    }, CACHE_TTL_MS)

    return () => clearInterval(timer)
  }, [coords])

  const fallbackMockCoords = mockLocation.enabled
    ? { lat: mockLocation.lat, lng: mockLocation.lng }
    : MELBOURNE_COORDS

  return {
    current,
    hourly,
    daily,
    locationName: location.locationName ?? (mockWeather.enabled ? (mockLocation.enabled ? mockLocation.suburb : 'Melbourne') : null),
    loading: location.loading || weatherLoading,
    error: location.error || weatherError,
    gpsBlocked: location.gpsBlocked,
    requestGps: location.requestGps,
    fetchByPostcode: location.fetchByPostcode,
    lat: coords?.lat ?? (mockWeather.enabled ? fallbackMockCoords.lat : null),
    lng: coords?.lng ?? (mockWeather.enabled ? fallbackMockCoords.lng : null),
  }
}
