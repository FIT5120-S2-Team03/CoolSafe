/**
 * CoolSpacesMap — interactive Leaflet map showing cool spaces across Melbourne.
 * Renders venue pins (CircleMarker) colour-coded by category, plus a user
 * location marker that animates the map to the user's position.
 *
 * Props:
 *   selectedCategories {string[]} — empty = show all; otherwise filter to these categories
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
import useCoolSpaces from '../../../hooks/useCoolSpaces'
import useFountains from '../../../hooks/useFountains'
import useHVI from '../../../hooks/useHVI'
import { CATEGORY_MARKER_COLORS } from '../../../utils/categoryMapping'
import mockLocation from '../../../mocks/mockLocation.json'
import { MELBOURNE_CENTER } from '../../../constants/locations'
import { locationPinIcon } from '../../../constants/leafletIcons'
import VenuePopup from './VenuePopupCard'
import {
  clearRoutePrefetch,
  getCachedRoute,
  getRouteCacheKey,
  getRoutePrefetch,
  setCachedRoute,
  setRoutePrefetch,
} from '../../../utils/routing/routeCache'
import {
  buildCoolestRouteResult,
  fetchFastestRoute,
} from '../../../utils/routing/routeUtils'


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

export default function CoolSpacesMap({ selectedCategories, flyTo, showHVI, openVenueId }) {
  const mapRef = useRef(null)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [pinPos, setPinPos] = useState(null)
  const [userLocation, setUserLocation] = useState(
    mockLocation.enabled ? { lat: mockLocation.lat, lng: mockLocation.lng } : null
  )
  const [fastestRouteCoords, setFastestRouteCoords] = useState([])
  const [coolestRouteCoords, setCoolestRouteCoords] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [routeType, setRouteType] = useState('fastest')
  const [routeScore, setRouteScore] = useState(null)
  const [routeIsScored, setRouteIsScored] = useState(false)
  const [fastestDurationMin, setFastestDurationMin] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo([flyTo.lat, flyTo.lng], 16)
    }
  }, [flyTo])

  const { venues, loading: venuesLoading, error: venuesError } = useCoolSpaces()
  const { fountains, loading: fountainsLoading, error: fountainsError } = useFountains()
  const { hviData } = useHVI()

  const needsFountains = selectedCategories.includes('Fountain')
  const isLoading = venuesLoading || (needsFountains && fountainsLoading)
  const error = venuesError || (needsFountains ? fountainsError : null)

  const allVenues = [...venues, ...fountains]
  const filtered =
    selectedCategories.length === 0
      ? venues
      : allVenues.filter((v) => selectedCategories.includes(v.category))

  // Auto-open venue card when arriving from another page.
  useEffect(() => {
    if (!openVenueId || filtered.length === 0 || !mapReady) return
    const target = filtered.find(v => String(v.id) === String(openVenueId))
    if (target) selectVenue(target)
  }, [openVenueId, filtered.length, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  function keepVenueCardInView(venue) {
    if (!mapRef.current || !venue) return

    const map = mapRef.current
    const pin = map.latLngToContainerPoint([venue.lat, venue.lng])
    const { x: mapW, y: mapH } = map.getSize()
    const cardW = 340
    const cardH = 420
    const gap = 40
    const pad = 28

    const cardLeft = pin.x - cardW / 2
    const cardRight = pin.x + cardW / 2
    const cardTop = pin.y - gap - cardH
    const cardBottom = pin.y - gap

    const overflowLeft = pad - cardLeft
    const overflowRight = cardRight - (mapW - pad)
    const overflowTop = pad - cardTop
    const overflowBottom = cardBottom - (mapH - pad)

    const panX = overflowRight > 0 ? overflowRight : overflowLeft > 0 ? -overflowLeft : 0
    const panY = overflowBottom > 0 ? overflowBottom : overflowTop > 0 ? -overflowTop : 0

    if (panX !== 0 || panY !== 0) {
      map.panBy([panX, panY], { animate: true })
    }
  }

  function selectVenue(venue) {
    clearRoute()
    setSelectedVenue(venue)
    keepVenueCardInView(venue)
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
    setFastestRouteCoords([])
    setCoolestRouteCoords([])
    setRouteError('')
    setRouteScore(null)
    setRouteIsScored(false)
    setFastestDurationMin(null)
  }

  async function handleFastestRoute(venue) {
    try {
      setRouteLoading(true)
      setRouteError('')
      setRouteType('fastest')
      setRouteScore(null)
      setRouteIsScored(false)

      const currentLocation = userLocation || (await getCurrentLocation())
      setUserLocation(currentLocation)

      const route = await fetchFastestRoute(currentLocation, venue)
      setFastestRouteCoords(route.coords)
      setCoolestRouteCoords([])
      setFastestDurationMin(route.durationMin)

      if (mapRef.current && route.coords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(route.coords), {
          paddingTopLeft: [60, 440],
          paddingBottomRight: [60, 260],
        })
        setTimeout(() => keepVenueCardInView(venue), 350)
      }
    } catch (err) {
      setRouteError(err.message)
      window.alert(err.message)
    } finally {
      setRouteLoading(false)
    }
  }

  async function prefetchCoolestRoute(venue) {
    try {
      const currentLocation = userLocation || (await getCurrentLocation())
      const cacheKey = getRouteCacheKey(currentLocation, venue)

      if (getCachedRoute(cacheKey)) return
      if (getRoutePrefetch(cacheKey)) return getRoutePrefetch(cacheKey)

      const prefetchPromise = buildCoolestRouteResult(venue, currentLocation)
        .then((result) => {
          if (result) setCachedRoute(cacheKey, result)
          return result
        })
        .catch(() => null)
        .finally(() => {
          clearRoutePrefetch(cacheKey)
        })

      setRoutePrefetch(cacheKey, prefetchPromise)
      return prefetchPromise
    } catch {
      return null
    }
  }

  async function handleCoolestRoute(venue) {
    try {
      setRouteLoading(true)
      setRouteError('')
      setRouteType('coolest')
      setRouteScore(null)

      const currentLocation = userLocation || (await getCurrentLocation())
      setUserLocation(currentLocation)
      const cacheKey = getRouteCacheKey(currentLocation, venue)

      const result =
        getCachedRoute(cacheKey) ??
        (await getRoutePrefetch(cacheKey)) ??
        (await buildCoolestRouteResult(venue, currentLocation))

      setCachedRoute(cacheKey, result)
      setFastestRouteCoords(result.fastestCoords)
      setCoolestRouteCoords(result.coolestCoords)
      setRouteScore(result.scoreData)
      setRouteIsScored(result.isScored)

      if (mapRef.current && result.coolestCoords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(result.coolestCoords), {
          paddingTopLeft: [60, 440],
          paddingBottomRight: [60, 260],
        })
        setTimeout(() => keepVenueCardInView(venue), 350)
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
      <style>{`
        .cs-map-venue-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .cs-map-venue-card:hover {
          box-shadow: 0 24px 70px rgba(0,0,0,0.18) !important;
        }
        .cs-map-route-button,
        .cs-map-primary-action,
        .cs-map-location-button,
        .cs-map-icon-action {
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease, filter 0.16s ease;
        }
        .cs-map-route-button:not(:disabled):hover,
        .cs-map-location-button:hover,
        .cs-map-icon-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(34,30,26,0.10);
        }
        .cs-map-primary-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(24,82,180,0.20);
          filter: brightness(0.96);
        }
        .cs-map-route-button:not(:disabled):active,
        .cs-map-primary-action:active,
        .cs-map-location-button:active,
        .cs-map-icon-action:active {
          transform: translateY(0) scale(0.99);
        }
        .cs-map-route-button:focus-visible,
        .cs-map-primary-action:focus-visible,
        .cs-map-location-button:focus-visible,
        .cs-map-icon-action:focus-visible {
          outline: 3px solid rgba(24,82,180,0.18);
          outline-offset: 3px;
        }
      `}</style>

      {/* Venue card — positioned above the pin, follows map movement via pinPos */}
      {selectedVenue && pinPos && (
        <div
          style={{
            position: 'absolute',
            left: pinPos.x,
            top: pinPos.y,
            transform: 'translate(-50%, calc(-100% - 40px))',
            zIndex: 1600,
            pointerEvents: 'auto',
          }}
        >
          <VenuePopup
            key={selectedVenue.id}
            venue={selectedVenue}
            userLocation={userLocation}
            routeDurationMin={fastestDurationMin}
            onFastestRoute={handleFastestRoute}
            onCoolestRoute={handleCoolestRoute}
            onPrefetchCoolestRoute={prefetchCoolestRoute}
            routeLoading={routeLoading}
            onClose={closeVenue}
          />
        </div>
      )}

      {/* Non-blocking error notice */}
      {error && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 14px', fontFamily: "var(--font-body)", fontSize: 15, color: '#9a3412', pointerEvents: 'none' }}>
          Some venue data could not be loaded
        </div>
      )}

      {/* Route error notice */}
      {routeError && (
        <div style={{ position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 14px', fontFamily: "var(--font-body)", fontSize: 15, color: '#991b1b', pointerEvents: 'none' }}>
          {routeError}
        </div>
      )}

      {routeType === 'fastest' && fastestDurationMin != null && selectedVenue && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 32px)',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(24, 82, 180, 0.18)',
            borderRadius: 999,
            padding: '10px 16px',
            boxShadow: '0 10px 28px rgba(24, 82, 180, 0.14)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontFamily: 'var(--font-body)',
            color: '#1d4ed8',
            pointerEvents: 'none',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#17304f', whiteSpace: 'nowrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb', boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.14)' }} />
            Navigating to {selectedVenue.name}
          </span>
          <span style={{ width: 1, height: 18, backgroundColor: 'rgba(29, 78, 216, 0.16)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
            ⚡ Fastest route
          </span>
          <span style={{ width: 1, height: 18, backgroundColor: 'rgba(29, 78, 216, 0.16)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {fastestDurationMin} min
          </span>
        </div>
      )}

      {routeType === 'coolest' && coolestRouteCoords.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 32px)',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(22, 163, 74, 0.18)',
            borderRadius: 999,
            padding: '10px 16px',
            boxShadow: '0 10px 28px rgba(22, 101, 52, 0.14)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontFamily: 'var(--font-body)',
            color: '#166534',
            pointerEvents: 'none',
          }}
        >
          {selectedVenue && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#173326', whiteSpace: 'nowrap' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.14)' }} />
                Navigating to {selectedVenue.name}
              </span>
              <span style={{ width: 1, height: 18, backgroundColor: 'rgba(22, 101, 52, 0.16)' }} />
            </>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {routeIsScored ? '🌿 Coolest route' : '🌿 Cool route candidate'}
          </span>
          {routeIsScored ? (
            <>
              <span style={{ width: 1, height: 18, backgroundColor: 'rgba(22, 101, 52, 0.16)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {routeScore.route.shade_coverage_percent}% shade
              </span>
              <span style={{ fontSize: 14, color: '#15803d', whiteSpace: 'nowrap' }}>
                {(routeScore.route.shaded_length_m / 1000).toFixed(2)} km shaded
              </span>
              {routeScore.same_as_fastest && (
                <span style={{ fontSize: 13, color: '#4b7f62', whiteSpace: 'nowrap' }}>
                  also fastest
                </span>
              )}
            </>
          ) : (
            null
          )}
        </div>
      )}

      <MapContainer
        center={MELBOURNE_CENTER}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        {/* Tracks pin screen position so the card overlay follows map movement */}
        <PinTracker venue={selectedVenue} onPosition={setPinPos} />

        <Pane name="route" style={{ zIndex: 450 }}>
          {routeType === 'fastest' && fastestRouteCoords.length > 0 && (
            <Polyline
              positions={fastestRouteCoords}
              pathOptions={{ color: '#003fa4', weight: 6, opacity: 0.85 }}
            />
          )}
          {routeType === 'coolest' && coolestRouteCoords.length > 0 && (
            <Polyline
              positions={coolestRouteCoords}
              pathOptions={{ color: '#16a34a', weight: 6, opacity: 0.9 }}
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
              fillColor: CATEGORY_MARKER_COLORS[venue.category] ?? '#64748b',
              color: 'white',
              weight: 2,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => selectVenue(venue),
              mouseover: (e) => {
                e.target.setRadius(venue.category === 'Fountain' ? 7 : 10)
                e.target.setStyle({ weight: 3 })
              },
              mouseout: (e) => {
                e.target.setRadius(venue.category === 'Fountain' ? 5 : 8)
                e.target.setStyle({ weight: 2 })
              },
            }}
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
        className="cs-map-location-button"
        aria-label="Go to my location"
      >
        <svg className="cs-map-location-pin" width="22" height="28" viewBox="0 0 28 36" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#003fa4"/>
          <circle cx="14" cy="14" r="6" fill="white"/>
          <circle cx="14" cy="14" r="3.5" fill="#003fa4"/>
        </svg>
        <span className="cs-map-location-label">My Location</span>
      </button>
    </div>
  )
}
