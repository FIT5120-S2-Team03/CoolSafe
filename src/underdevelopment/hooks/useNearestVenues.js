import { useMemo } from 'react'
import { getWalkingMinutes } from '../utils/routing/haversine'
import { getDistanceKm, isFountainVenue } from '../utils/venueDisplay'

export function useNearestVenues(venues, lat, lng, limit = 3) {
  return useMemo(() => {
    if (!venues?.length || lat == null || lng == null) return []
    const sorted = venues
      .filter((v) => !isFountainVenue(v))
      .map((v) => {
        const distKm = getDistanceKm(lat, lng, v.lat, v.lng)
        return { ...v, distKm, walkMins: getWalkingMinutes(lat, lng, v.lat, v.lng) }
      })
      .filter((v) => v.distKm != null)
      .sort((a, b) => a.distKm - b.distKm)
    return Number.isFinite(limit) ? sorted.slice(0, limit) : sorted
  }, [venues, lat, lng, limit])
}
