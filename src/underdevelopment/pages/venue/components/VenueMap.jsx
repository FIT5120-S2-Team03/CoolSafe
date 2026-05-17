import { MapContainer, Marker, Pane, Polyline, TileLayer } from 'react-leaflet'
import { BLUE } from '../../../styles/colors'
import MapBoundsController from './MapBoundsController'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO'

export default function VenueMap({
  center,
  destinationLabelIcon,
  height = '100%',
  routeCoords,
  routeMode,
  startLabelIcon,
  userLocation,
  userPinIcon,
  venue,
  venuePinIcon,
  zoom = 16,
  zoomControl = false,
}) {
  const hasUserLocation = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)

  return (
    <MapContainer center={center ?? [venue.lat, venue.lng]} zoom={zoom} className="venue-map" style={{ height, width: '100%' }} zoomControl={zoomControl}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <MapBoundsController routeCoords={routeCoords} venueLat={venue.lat} venueLng={venue.lng} />
      <Pane name="detail-route" style={{ zIndex: 450 }}>
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: routeMode === 'coolest' ? '#16a34a' : BLUE, weight: 6, opacity: 0.85 }} />
        )}
      </Pane>
      <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
      <Marker position={[venue.lat, venue.lng]} icon={destinationLabelIcon} interactive={false} />
      {hasUserLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPinIcon} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={startLabelIcon} interactive={false} />
        </>
      )}
    </MapContainer>
  )
}
