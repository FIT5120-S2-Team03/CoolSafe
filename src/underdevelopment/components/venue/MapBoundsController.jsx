import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

function isValidLatLngPair(coord) {
  return (
    Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1])
  )
}

export default function MapBoundsController({ routeCoords, venueLat, venueLng }) {
  const map = useMap()

  useEffect(() => {
    let cancelled = false
    let frameId = 0
    const validRouteCoords = routeCoords.filter(isValidLatLngPair)
    const hasVenueLocation = Number.isFinite(venueLat) && Number.isFinite(venueLng)

    const updateBounds = () => {
      frameId = window.requestAnimationFrame(() => {
        if (cancelled || !map.getContainer()?.isConnected || !map.getPane('mapPane')) return
        map.invalidateSize({ pan: false })

        if (validRouteCoords.length > 0) {
          const bounds = L.latLngBounds(validRouteCoords)
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], animate: false })
          }
          return
        }

        if (hasVenueLocation) {
          map.setView([venueLat, venueLng], 16, { animate: false })
        }
      })
    }

    map.whenReady(updateBounds)

    return () => {
      cancelled = true
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [map, routeCoords, venueLat, venueLng])

  return null
}
