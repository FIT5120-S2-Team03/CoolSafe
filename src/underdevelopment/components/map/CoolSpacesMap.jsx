/**
 * CoolSpacesMap — interactive Leaflet map showing cool spaces across Melbourne.
 * Renders venue pins (CircleMarker) colour-coded by category, plus a user
 * location marker that animates the map to the user's position.
 *
 * Props:
 *   selectedCategory {string} — 'All' or a specific category name to filter pins
 */

import { useRef, useState, useEffect } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Marker,
  Pane,
  Polyline,
  useMap,
} from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import useCoolSpaces from '../../hooks/useCoolSpaces'
import useFountains from '../../hooks/useFountains'
import useHVI from '../../hooks/useHVI'
import { CATEGORY_COLORS } from '../../utils/categoryMapping'
import { getWalkingMinutes } from '../../utils/haversine'
import mockLocation from '../../data/mockLocation.json'

const locationPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#003fa4"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#003fa4"/>
  </svg>`,
})

const MELBOURNE = [-37.8136, 144.9631]

function getOpenStatus(openingHours) {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return { status: 'unavailable' }
  }

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long' })
  const hours = openingHours[today]

  if (!hours) {
    return { status: 'closed' }
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`

  const isOpen = currentTime >= hours.open && currentTime < hours.close

  return isOpen
    ? { status: 'open', closeTime: hours.close }
    : { status: 'closed' }
}

function VenuePopup({ venue, userLocation, onFastestRoute, routeLoading, onClose }) {
  const navigate = useNavigate()
  const openStatus = getOpenStatus(venue.opening_hours)
  const [selectedRoute, setSelectedRoute] = useState('fastest')

  useEffect(() => {
    onFastestRoute(venue)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const walkMins =
    userLocation != null
      ? getWalkingMinutes(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
      : null

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: 20,
        width: 300,
        fontFamily: "'Lexend', sans-serif",
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          minWidth: 44,
          minHeight: 44,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#1e293b', margin: '0 32px 8px 0' }}>
        {venue.name}
      </p>

      <span style={{ display: 'inline-block', backgroundColor: CATEGORY_COLORS[venue.category] ?? '#64748b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
        {venue.category}
      </span>

      {venue.address && (
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
          {venue.address}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, marginBottom: 16 }}>
        {openStatus.status === 'unavailable' ? (
          <span style={{ color: '#94a3b8' }}>Hours unavailable</span>
        ) : (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: openStatus.status === 'open' ? '#16a34a' : '#ef4444', flexShrink: 0 }} />
            <span style={{ color: openStatus.status === 'open' ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
              {openStatus.status === 'open' ? 'Open Now' : 'Closed'}
            </span>
            {openStatus.status === 'open' && (
              <>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: '#64748b' }}>Closes {openStatus.closeTime}</span>
              </>
            )}
          </>
        )}
        {walkMins != null && (
          <>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#64748b' }}>{walkMins} min walk</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => { setSelectedRoute('fastest'); onFastestRoute(venue) }}
          disabled={routeLoading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: selectedRoute === 'fastest' ? '#16a34a' : routeLoading ? '#f1f5f9' : '#fff',
            border: selectedRoute === 'fastest' ? 'none' : '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 0',
            color: selectedRoute === 'fastest' ? '#fff' : '#1e293b',
            fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: 13,
            cursor: routeLoading ? 'not-allowed' : 'pointer', minHeight: 44,
          }}
        >
          {routeLoading && selectedRoute === 'fastest' ? 'Loading...' : '⚡ Fastest'}
        </button>

        <button
          onClick={() => setSelectedRoute('coolest')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: selectedRoute === 'coolest' ? '#16a34a' : '#fff',
            border: selectedRoute === 'coolest' ? 'none' : '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 0',
            color: selectedRoute === 'coolest' ? '#fff' : '#1e293b',
            fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: 13,
            cursor: 'pointer', minHeight: 44,
          }}
        >
          🌲 Coolest
        </button>
      </div>

      <button
        onClick={() => navigate(`/venue/${venue.id}`)}
        style={{ width: '100%', backgroundColor: '#003fa4', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", cursor: 'pointer', minHeight: 44 }}
      >
        View Full Details →
      </button>
    </div>
  )
}

// Tracks the screen position of the selected venue pin and updates on map move/zoom.
function PinTracker({ venue, onPosition }) {
  const map = useMap()

  useEffect(() => {
    if (!venue) {
      onPosition(null)
      return
    }

    const update = () => {
      const pt = map.latLngToContainerPoint([venue.lat, venue.lng])
      onPosition({ x: pt.x, y: pt.y })
    }

    update()
    map.on('move', update)
    map.on('zoomend', update)

    return () => {
      map.off('move', update)
      map.off('zoomend', update)
    }
  }, [venue?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

const HVI_COLORS = {
  1: '#ffffb2',
  2: '#fecc5c',
  3: '#fd8d3c',
  4: '#e31a1c',
}

function hviStyle(feature) {
  return {
    fillColor: HVI_COLORS[feature.properties.hvi] ?? '#cccccc',
    fillOpacity: 0.5,
    color: 'white',
    weight: 0.5,
  }
}

export default function CoolSpacesMap({ selectedCategory, flyTo, showHVI, openVenueId }) {
  const mapRef = useRef(null)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [pinPos, setPinPos] = useState(null)
  const [userLocation, setUserLocation] = useState(
    mockLocation.enabled ? { lat: mockLocation.lat, lng: mockLocation.lng } : null
  )
  const [routeCoords, setRouteCoords] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo([flyTo.lat, flyTo.lng], 16)
    }
  }, [flyTo])

  const { venues, loading: venuesLoading, error: venuesError } = useCoolSpaces()
  const { fountains, loading: fountainsLoading, error: fountainsError } = useFountains()
  const { hviData } = useHVI()

  const isLoading = venuesLoading || fountainsLoading
  const error = venuesError || fountainsError

  const allVenues = [...venues, ...fountains]
  const filtered =
    selectedCategory === 'All'
      ? allVenues
      : allVenues.filter((v) => v.category === selectedCategory)

  // Auto-open venue card when arriving from detail page
  useEffect(() => {
    if (!openVenueId || filtered.length === 0) return
    const target = filtered.find(v => String(v.id) === String(openVenueId))
    if (target) setSelectedVenue(target)
  }, [openVenueId, filtered.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectVenue(venue) {
    clearRoute()
    setSelectedVenue(venue)
  }

  function closeVenue() {
    setSelectedVenue(null)
    setPinPos(null)
    clearRoute()
  }

  function handleMyLocation() {
    if (mockLocation.enabled) {
      const { lat, lng } = mockLocation
      setUserLocation({ lat, lng })
      mapRef.current?.flyTo([lat, lng], 16)
      return
    }

    if (!navigator.geolocation) {
      window.alert('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLocation({ lat, lng })
        mapRef.current?.flyTo([lat, lng], 16)
      },
      () => {
        window.alert('Location access denied. Please enable location in your browser settings.')
      }
    )
  }

  function getCurrentLocation() {
    if (mockLocation.enabled) {
      return Promise.resolve({ lat: mockLocation.lat, lng: mockLocation.lng })
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          reject(new Error('Location access denied. Please enable location in your browser settings.'))
        }
      )
    })
  }

  function clearRoute() {
    setRouteCoords([])
    setRouteError('')
  }

  async function handleFastestRoute(venue) {
    try {
      setRouteLoading(true)
      setRouteError('')

      const currentLocation = userLocation || (await getCurrentLocation())
      setUserLocation(currentLocation)

      const url = `https://router.project-osrm.org/route/v1/foot/${currentLocation.lng},${currentLocation.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)

      if (!res.ok) throw new Error(`Route request failed: HTTP ${res.status}`)

      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No route found.')

      const coords = data.routes[0].geometry.coordinates.map((point) => [point[1], point[0]])
      setRouteCoords(coords)

      if (mapRef.current && coords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(coords), {
          paddingTopLeft: [60, 280],
          paddingBottomRight: [60, 60],
        })
      }
    } catch (err) {
      setRouteError(err.message)
      window.alert(err.message)
    } finally {
      setRouteLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* Venue card — positioned above the pin, follows map movement via pinPos */}
      {selectedVenue && pinPos && (
        <div
          style={{
            position: 'absolute',
            left: pinPos.x,
            top: pinPos.y,
            transform: 'translate(-50%, calc(-100% - 16px))',
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <VenuePopup
            key={selectedVenue.id}
            venue={selectedVenue}
            userLocation={userLocation}
            onFastestRoute={handleFastestRoute}
            routeLoading={routeLoading}
            onClose={closeVenue}
          />
        </div>
      )}

      {/* Non-blocking error notice */}
      {error && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 14px', fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#9a3412', pointerEvents: 'none' }}>
          Some venue data could not be loaded
        </div>
      )}

      {/* Route error notice */}
      {routeError && (
        <div style={{ position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 14px', fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#991b1b', pointerEvents: 'none' }}>
          {routeError}
        </div>
      )}

      <MapContainer
        center={MELBOURNE}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        {/* Tracks pin screen position so the card overlay follows map movement */}
        <PinTracker venue={selectedVenue} onPosition={setPinPos} />

        <Pane name="route" style={{ zIndex: 450 }}>
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#003fa4', weight: 6, opacity: 0.85 }}
            />
          )}
        </Pane>

        <Pane name="hvi" style={{ zIndex: 350 }}>
          {showHVI && hviData && (
            <GeoJSON key="hvi-layer" data={hviData} style={hviStyle} interactive={false} />
          )}
        </Pane>

        {filtered.map((venue, i) => (
          <CircleMarker
            key={`${venue.category}-${i}`}
            center={[venue.lat, venue.lng]}
            radius={venue.category === 'Fountain' ? 5 : 8}
            pathOptions={{
              fillColor: CATEGORY_COLORS[venue.category] ?? '#64748b',
              color: 'white',
              weight: 2,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => selectVenue(venue) }}
          />
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={locationPinIcon} />
        )}
      </MapContainer>

      {/* Loading spinner */}
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 1000 }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#003fa4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* My Location button */}
      <button
        onClick={handleMyLocation}
        style={{ position: 'absolute', bottom: 32, right: 32, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 16, color: '#1e293b' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003fa4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        My Location
      </button>
    </div>
  )
}
