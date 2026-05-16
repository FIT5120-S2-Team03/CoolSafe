import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

export default function MapBoundsController({ routeCoords, venueLat, venueLng }) {
  const map = useMap()
  useEffect(() => {
    if (routeCoords.length > 0) {
      map.fitBounds(L.latLngBounds(routeCoords), { padding: [40, 40] })
    } else {
      map.setView([venueLat, venueLng], 16)
    }
  }, [routeCoords])
  return null
}
