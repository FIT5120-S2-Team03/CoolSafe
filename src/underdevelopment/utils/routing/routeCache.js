const routeCache = new Map()
const routePrefetches = new Map()

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
