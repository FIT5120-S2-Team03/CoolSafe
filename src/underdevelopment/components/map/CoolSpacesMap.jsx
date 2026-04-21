/**
 * CoolSpacesMap — interactive Leaflet map showing cool spaces across Melbourne.
 * Renders venue pins (CircleMarker) colour-coded by category, plus a user
 * location marker that animates the map to the user's position.
 *
 * Props:
 *   selectedCategory {string} — 'All' or a specific category name to filter pins
 */

import { useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet'
import useCoolSpaces from '../../hooks/useCoolSpaces'
import useFountains from '../../hooks/useFountains'
import { CATEGORY_COLORS } from '../../utils/categoryMapping'

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

export default function CoolSpacesMap({ selectedCategory }) {
  const mapRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)

  const { venues, loading: venuesLoading, error: venuesError } = useCoolSpaces()
  const { fountains, loading: fountainsLoading, error: fountainsError } = useFountains()

  const isLoading = venuesLoading || fountainsLoading
  const error = venuesError || fountainsError

  const allVenues = [...venues, ...fountains]
  const filtered =
    selectedCategory === 'All'
      ? allVenues
      : allVenues.filter((v) => v.category === selectedCategory)

  function handleMyLocation() {
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Non-blocking error notice */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 8,
            padding: '6px 14px',
            fontFamily: "'Lexend', sans-serif",
            fontSize: 13,
            color: '#9a3412',
            pointerEvents: 'none',
          }}
        >
          Some venue data could not be loaded
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
          >
            <Popup>
              <div style={{ fontFamily: "'Public Sans', sans-serif", minWidth: 160 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', margin: '0 0 6px' }}>
                  {venue.name}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: CATEGORY_COLORS[venue.category] ?? '#64748b',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: venue.address ? 6 : 0,
                  }}
                >
                  {venue.category}
                </span>
                {venue.address && (
                  <p
                    style={{
                      fontFamily: "'Lexend', sans-serif",
                      fontSize: 12,
                      color: '#64748b',
                      margin: '6px 0 0',
                    }}
                  >
                    {venue.address}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={locationPinIcon}
          />
        )}
      </MapContainer>

      {/* Loading spinner overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.6)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '4px solid #e2e8f0',
              borderTopColor: '#003fa4',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* My Location button */}
      <button
        onClick={handleMyLocation}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '12px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: '#1e293b',
        }}
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
