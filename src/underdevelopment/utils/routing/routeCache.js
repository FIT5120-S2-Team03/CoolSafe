// routeCache — process-lifetime memo for computed routes. We also keep an
// in-flight prefetches map so hovering a venue can warm the cache without
// firing duplicate OSRM requests when the user actually clicks.

const routeCache = new Map()
const routePrefetches = new Map()

// Cache key combines coords (rounded to ~1 m) with venue id so coord drift
// from GPS noise still hits the same cache entry.
export function getRouteCacheKey(location, venue) {
  return `${location.lat.toFixed(5)},${location.lng.toFixed(5)}:${venue.id}`
}

export function getCachedRoute(key) {
  return routeCache.get(key)
}

export function setCachedRoute(key, value) {
  routeCache.set(key, value)
}

export function getRoutePrefetch(key) {
  return routePrefetches.get(key)
}

export function setRoutePrefetch(key, promise) {
  routePrefetches.set(key, promise)
}

export function clearRoutePrefetch(key) {
  routePrefetches.delete(key)
}
