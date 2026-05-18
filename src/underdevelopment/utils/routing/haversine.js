// haversine — great-circle distance helpers used wherever we need a quick
// "how far / how long" estimate without round-tripping to the OSRM router.

// Straight-line distance between two lat/lng points, in kilometres.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Rough walking-time estimate assuming a 4.5 km/h pace (typical elderly walker).
export function getWalkingMinutes(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  return Math.round((haversineKm(lat1, lng1, lat2, lng2) / 4.5) * 60)
}
