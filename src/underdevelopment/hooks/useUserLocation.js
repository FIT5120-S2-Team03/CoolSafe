import { useEffect, useState } from 'react'
import mockLocation from '../mocks/mockLocation.json'
import { STORAGE_KEYS } from '../constants/storageKeys'

const COORDS_KEY = STORAGE_KEYS.coords
const LOCATION_NAME_KEY = STORAGE_KEYS.locationName
const LOCATION_SOURCE_KEY = STORAGE_KEYS.locationSource

export const LOCATION_UPDATED_EVENT = 'coolsafe:location-updated'

function readSavedCoords() {
  try {
    const raw = localStorage.getItem(COORDS_KEY)
    if (!raw) return null
    const coords = JSON.parse(raw)
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return null
    return coords
  } catch {
    return null
  }
}

function locationNameFromAddress(address) {
  return (
    address?.suburb ??
    address?.town ??
    address?.city_district ??
    address?.city ??
    address?.municipality ??
    address?.state_district ??
    null
  )
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return locationNameFromAddress(data.address)
  } catch {
    return null
  }
}

function saveLocation(coords, locationName) {
  if (mockLocation.enabled) return
  try {
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords))
    if (locationName) localStorage.setItem(LOCATION_NAME_KEY, locationName)
  } catch {
    // localStorage may be unavailable in private browsing.
  }
}

function broadcastLocation(coords, locationName) {
  window.dispatchEvent(new CustomEvent(LOCATION_UPDATED_EVENT, {
    detail: { lat: coords.lat, lng: coords.lng, locationName },
  }))
}

function getInitialLocation() {
  if (mockLocation.enabled) {
    return {
      coords: { lat: mockLocation.lat, lng: mockLocation.lng },
      locationName: mockLocation.suburb,
    }
  }
  return {
    coords: readSavedCoords(),
    locationName: localStorage.getItem(LOCATION_NAME_KEY),
  }
}

export function useUserLocation() {
  const initial = getInitialLocation()
  const [coords, setCoords] = useState(initial.coords)
  const [locationName, setLocationName] = useState(initial.locationName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [gpsBlocked, setGpsBlocked] = useState(false)

  function applyLocation(nextCoords, nextLocationName) {
    setCoords(nextCoords)
    setLocationName(nextLocationName)
    saveLocation(nextCoords, nextLocationName)
    broadcastLocation(nextCoords, nextLocationName)
  }

  useEffect(() => {
    function onLocationUpdated(event) {
      const data = event.detail
      if (!data || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return
      setCoords({ lat: data.lat, lng: data.lng })
      setLocationName(data.locationName ?? null)
      setLoading(false)
      setError(false)
      setGpsBlocked(false)
    }

    window.addEventListener(LOCATION_UPDATED_EVENT, onLocationUpdated)
    return () => window.removeEventListener(LOCATION_UPDATED_EVENT, onLocationUpdated)
  }, [])

  function requestGps() {
    if (mockLocation.enabled) {
      applyLocation({ lat: mockLocation.lat, lng: mockLocation.lng }, mockLocation.suburb)
      return
    }

    setLoading(true)
    setError(false)
    setGpsBlocked(false)

    if (!navigator.geolocation) {
      setGpsBlocked(true)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        const nextName = await reverseGeocode(nextCoords.lat, nextCoords.lng)
        try {
          localStorage.setItem(LOCATION_SOURCE_KEY, 'gps')
        } catch {
          // localStorage may be unavailable in private browsing.
        }
        applyLocation(nextCoords, nextName)
        setLoading(false)
      },
      () => {
        setGpsBlocked(true)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  async function fetchByPostcode(postcode) {
    if (mockLocation.enabled) {
      applyLocation({ lat: mockLocation.lat, lng: mockLocation.lng }, mockLocation.suburb)
      return
    }

    setLoading(true)
    setError(false)
    setGpsBlocked(false)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postcode)}&countrycodes=au&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (!res.ok) throw new Error('Postcode lookup failed')

      const geo = await res.json()
      if (!geo.length) throw new Error('Postcode not found')

      const result = geo[0]
      const nextCoords = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      }
      const nextName = locationNameFromAddress(result.address) ?? result.display_name?.split(',')[0] ?? null
      try {
        localStorage.setItem(LOCATION_SOURCE_KEY, 'suburb')
      } catch {
        // localStorage may be unavailable in private browsing.
      }
      applyLocation(nextCoords, nextName)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return {
    coords,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    locationName,
    loading,
    error,
    gpsBlocked,
    requestGps,
    fetchByPostcode,
  }
}
