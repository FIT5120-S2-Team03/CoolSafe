const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'
const ROUTE_SIMILARITY_DISTANCE_M = 15
const ROUTE_SIMILARITY_THRESHOLD = 0.8
const WALKING_SPEED_KMH = 4.5

export function decodePolyline(str) {
  const coords = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < str.length) {
    let b
    let shift = 0
    let result = 0
    do {
      b = str.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      b = str.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push([lat / 1e5, lng / 1e5])
  }

  return coords
}

export function getWalkingMinutesFromDistance(distanceM) {
  if (distanceM == null) return null
  return Math.max(1, Math.round((distanceM / 1000 / WALKING_SPEED_KMH) * 60))
}

function toLatLngCoords(route) {
  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
}

function toCandidateRoute(route) {
  return {
    coords: toLatLngCoords(route),
    distance_m: route.distance,
    steps: route.legs?.[0]?.steps ?? [],
  }
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function haversineMeters(a, b) {
  const earthRadiusM = 6371000
  const dLat = toRadians(b[0] - a[0])
  const dLng = toRadians(b[1] - a[1])
  const lat1 = toRadians(a[0])
  const lat2 = toRadians(b[0])
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return 2 * earthRadiusM * Math.asin(Math.sqrt(h))
}

function getRouteOverlapRatio(routeA, routeB) {
  if (!routeA?.length || !routeB?.length) return 0

  const sampleStep = Math.max(1, Math.floor(routeA.length / 40))
  let samples = 0
  let overlappingSamples = 0

  for (let i = 0; i < routeA.length; i += sampleStep) {
    samples += 1
    const point = routeA[i]
    const overlaps = routeB.some((candidatePoint) => haversineMeters(point, candidatePoint) <= ROUTE_SIMILARITY_DISTANCE_M)
    if (overlaps) overlappingSamples += 1
  }

  return samples === 0 ? 0 : overlappingSamples / samples
}

function routesAreVisuallySimilar(routeA, routeB) {
  return (
    getRouteOverlapRatio(routeA, routeB) >= ROUTE_SIMILARITY_THRESHOLD &&
    getRouteOverlapRatio(routeB, routeA) >= ROUTE_SIMILARITY_THRESHOLD
  )
}

function getOffsetWaypoint(start, end) {
  const midLat = (start.lat + end.lat) / 2
  const midLng = (start.lng + end.lng) / 2
  const dLat = end.lat - start.lat
  const dLng = end.lng - start.lng
  const magnitude = Math.hypot(dLat, dLng) || 1
  const offset = 0.0018

  return {
    lat: midLat - (dLng / magnitude) * offset,
    lng: midLng + (dLat / magnitude) * offset,
  }
}

export async function fetchFastestRoute(from, venue, { includeSteps = false } = {}) {
  const stepsQuery = includeSteps ? '&steps=true' : ''
  const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson${stepsQuery}`
  const res = await fetch(url)

  if (!res.ok) throw new Error(`Route request failed: HTTP ${res.status}`)

  const data = await res.json()
  if (!data.routes || data.routes.length === 0) throw new Error('No route found.')

  const route = data.routes[0]
  return {
    coords: toLatLngCoords(route),
    distanceM: route.distance,
    durationMin: getWalkingMinutesFromDistance(route.distance),
    steps: includeSteps ? route.legs?.[0]?.steps ?? [] : [],
  }
}

export async function buildCoolestRouteResult(venue, currentLocation) {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${currentLocation.lng},${currentLocation.lat};` +
    `${venue.lng},${venue.lat}` +
    `?overview=full&geometries=geojson&alternatives=true&steps=true`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Coolest route request failed: HTTP ${res.status}`)

  const data = await res.json()
  if (!data.routes || data.routes.length === 0) throw new Error('No coolest route found.')

  const candidateRoutes = data.routes.slice(0, 2).map(toCandidateRoute)
  const routesAreSimilar =
    candidateRoutes.length < 2 ||
    routesAreVisuallySimilar(candidateRoutes[0].coords, candidateRoutes[1].coords)

  if (routesAreSimilar) {
    const waypoint = getOffsetWaypoint(currentLocation, venue)
    const waypointUrl =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${currentLocation.lng},${currentLocation.lat};` +
      `${waypoint.lng},${waypoint.lat};` +
      `${venue.lng},${venue.lat}` +
      `?overview=full&geometries=geojson&steps=true`

    const waypointRes = await fetch(waypointUrl)
    if (waypointRes.ok) {
      const waypointData = await waypointRes.json()
      const waypointRoute = waypointData.routes?.[0]
      if (waypointRoute) {
        candidateRoutes.push({
          coords: toLatLngCoords(waypointRoute),
          distance_m: waypointRoute.distance,
          steps: waypointRoute.legs?.flatMap((leg) => leg.steps ?? []) ?? [],
        })
      }
    }
  }

  let scoreData = null

  try {
    const scoreRes = await fetch(`${API_BASE}/api/coolest-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routes: candidateRoutes.slice(0, 3), routes_are_similar: routesAreSimilar }),
    })

    if (scoreRes.ok) {
      scoreData = await scoreRes.json()
    }
  } catch {
    scoreData = null
  }

  const fallbackRouteIndex = candidateRoutes.length > 1 ? 1 : 0
  const selectedRouteIndex = scoreData?.selected_route_index ?? fallbackRouteIndex
  const selectedCoords = scoreData?.route?.coords ?? candidateRoutes[selectedRouteIndex]?.coords
  const selectedSteps = candidateRoutes[selectedRouteIndex]?.steps ?? []
  if (!selectedCoords || selectedCoords.length === 0) throw new Error('No selected coolest route returned.')

  return {
    fastestCoords: candidateRoutes[0].coords,
    coolestCoords: selectedCoords,
    coolestSteps: selectedSteps,
    scoreData,
    isScored: Boolean(scoreData?.route),
  }
}
