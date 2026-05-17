import { useMemo } from 'react'
import { getWalkingMinutes } from '../utils/haversine'
import { getDistanceKm, isFountainVenue } from '../utils/venueDisplay'

export function useNearestVenues(venues, lat, lng, limit = 3) {
  return useMemo(() => {
    if (!venues?.length || lat == null || lng == null) return []
    return venues
      .filter((v) => !isFountainVenue(v))
      .map((v) => {
        const distKm = getDistanceKm(lat, lng, v.lat, v.lng)
        return { ...v, distKm, walkMins: getWalkingMinutes(lat, lng, v.lat, v.lng) }
      })
      .filter((v) => v.distKm != null)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, limit)
  }, [venues, lat, lng, limit])
}
