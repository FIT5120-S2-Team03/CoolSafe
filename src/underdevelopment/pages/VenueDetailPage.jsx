import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Polyline, Pane } from 'react-leaflet'
import Navbar from '../components/layout/Navbar'
import { getWalkingMinutes } from '../utils/haversine'
import useVenue from '../hooks/useVenue'
import ShareRouteModal from '../components/venue/ShareRouteModal'
import MapBoundsController from '../components/venue/MapBoundsController'
import { DAYS, fmt, getHoursDisplay, maneuverIcon, maneuverLabel, fmtDist } from '../utils/venueDetailUtils'
import mockLocation from '../data/mockLocation.json'
import { getCachedRoute, getRouteCacheKey, setCachedRoute } from '../utils/routeCache'

function decodePolyline(str) {
  const coords = []
  let index = 0, lat = 0, lng = 0
  while (index < str.length) {
    let b, shift = 0, result = 0
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    coords.push([lat / 1e5, lng / 1e5])
  }
  return coords
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'
const ROUTE_SIMILARITY_DISTANCE_M = 15
const ROUTE_SIMILARITY_THRESHOLD = 0.8

const userPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#5A5048"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#5A5048"/>
  </svg>`,
})

const venuePinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#1852B4"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#1852B4"/>
  </svg>`,
})

function makeLabelIcon(label, tone = 'blue') {
  const isBlue = tone === 'blue'
  return L.divIcon({
    className: '',
    iconSize: [92, 28],
    iconAnchor: [46, -4],
    html: `<div style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:72px;
      height:28px;
      padding:0 10px;
      border-radius:999px;
      background:rgba(255,255,255,0.95);
      border:1px solid ${isBlue ? 'rgba(24,82,180,0.22)' : 'rgba(90,80,72,0.22)'};
      box-shadow:0 6px 18px rgba(0,0,0,0.10);
      color:${isBlue ? '#1852B4' : '#5A5048'};
      font-family:var(--font-body);
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
    ">${label}</div>`,
  })
}

const startLabelIcon = makeLabelIcon('Start', 'neutral')
const destinationLabelIcon = makeLabelIcon('Destination', 'blue')

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

export default function VenueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isShareView = searchParams.get('share') === 'true'
  const shareLat = parseFloat(searchParams.get('from_lat'))
  const shareLng = parseFloat(searchParams.get('from_lng'))
  const shareRouteType = searchParams.get('route_type') ?? 'fastest'
  const sharePolylineParam = searchParams.get('polyline')

  const { venue, loading, error } = useVenue(id, location.state?.venue)

  const [userLocation, setUserLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showDeniedAlert, setShowDeniedAlert] = useState(false)
  const [routeMode, setRouteMode] = useState(isShareView ? shareRouteType : 'fastest')
  const [routeCoords, setRouteCoords] = useState([])
  const [routeSteps, setRouteSteps] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const directionsRef = useRef(null)

  const fetchFastestRoute = useCallback(async (from) => {
    if (!venue) return
    try {
      setRouteLoading(true)
      setRouteError('')
      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson&steps=true`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Route request failed: HTTP ${res.status}`)
      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No route found.')
      setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
      setRouteSteps(data.routes[0].legs?.[0]?.steps ?? [])
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setRouteLoading(false)
    }
  }, [venue])

  const fetchCoolestRoute = useCallback(async (from) => {
    if (!venue) return
    try {
      setRouteLoading(true)
      setRouteError('')
      const cacheKey = getRouteCacheKey(from, venue)
      const cachedRoute = getCachedRoute(cacheKey)

      if (cachedRoute) {
        setRouteCoords(cachedRoute.coolestCoords)
        setRouteSteps(cachedRoute.coolestSteps ?? [])
        return
      }

      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Coolest route request failed: HTTP ${res.status}`)
      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No coolest route found.')

      const candidateRoutes = data.routes.slice(0, 2).map((route) => ({
        coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance_m: route.distance,
        steps: route.legs?.[0]?.steps ?? [],
      }))

      const routesAreSimilar =
        candidateRoutes.length < 2 ||
        routesAreVisuallySimilar(candidateRoutes[0].coords, candidateRoutes[1].coords)

      if (routesAreSimilar) {
        const waypoint = getOffsetWaypoint(from, venue)
        const waypointUrl = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${waypoint.lng},${waypoint.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson&steps=true`
        const waypointRes = await fetch(waypointUrl)
        if (waypointRes.ok) {
          const waypointData = await waypointRes.json()
          const waypointRoute = waypointData.routes?.[0]
          if (waypointRoute) {
            candidateRoutes.push({
              coords: waypointRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
              distance_m: waypointRoute.distance,
              steps: waypointRoute.legs?.flatMap((leg) => leg.steps ?? []) ?? [],
            })
          }
        }
      }

      const scoreRes = await fetch(`${API_BASE}/api/coolest-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: candidateRoutes.slice(0, 3), routes_are_similar: routesAreSimilar }),
      })
      if (!scoreRes.ok) throw new Error(`Shade score request failed: HTTP ${scoreRes.status}`)
      const scoreData = await scoreRes.json()
      const selectedCoords = scoreData.route?.coords ?? candidateRoutes[scoreData.selected_route_index]?.coords
      const selectedSteps = candidateRoutes[scoreData.selected_route_index]?.steps ?? []
      if (!selectedCoords || selectedCoords.length === 0) throw new Error('No selected coolest route returned.')

      setRouteCoords(selectedCoords)
      setRouteSteps(selectedSteps)
      setCachedRoute(cacheKey, {
        fastestCoords: candidateRoutes[0].coords,
        coolestCoords: selectedCoords,
        coolestSteps: selectedSteps,
        scoreData,
      })
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setRouteLoading(false)
    }
  }, [venue])

  useEffect(() => {
    if (mockLocation.enabled) {
      setUserLocation({ lat: mockLocation.lat, lng: mockLocation.lng })
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true)
    )
  }, [isShareView])

  useEffect(() => {
    if (isShareView || !userLocation || !venue) return
    if (routeMode === 'fastest') {
      fetchFastestRoute(userLocation)
    } else {
      fetchCoolestRoute(userLocation)
    }
  }, [userLocation, routeMode, venue, isShareView, fetchFastestRoute, fetchCoolestRoute])

  useEffect(() => {
    if (!isShareView || !venue) return
    if (sharePolylineParam) {
      setRouteCoords(decodePolyline(sharePolylineParam))
      return
    }
    if (isNaN(shareLat) || isNaN(shareLng)) return
    if (shareRouteType === 'coolest') {
      fetchCoolestRoute({ lat: shareLat, lng: shareLng })
    } else {
      fetchFastestRoute({ lat: shareLat, lng: shareLng })
    }
  }, [isShareView, venue, shareLat, shareLng, shareRouteType, sharePolylineParam, fetchFastestRoute, fetchCoolestRoute])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  function requestLocation() {
    if (mockLocation.enabled) {
      setUserLocation({ lat: mockLocation.lat, lng: mockLocation.lng })
      setLocationDenied(false)
      setShowDeniedAlert(false)
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationDenied(false)
        setShowDeniedAlert(false)
      },
      () => {
        setLocationDenied(true)
        setShowDeniedAlert(true)
      }
    )
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div style={{ width: 40, height: 40, border: '4px solid var(--color-rule)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  )

  if (error || !venue) return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)' }}>
          <p style={{ color: 'var(--color-orange)', marginBottom: 16 }}>Venue not found.</p>
          <button onClick={() => navigate('/spaces')} style={{ color: 'var(--color-blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}>
            Back to Spaces
          </button>
        </div>
      </main>
    </div>
  )

  const hoursDisplay = getHoursDisplay(venue.opening_hours)
  const walkMins = userLocation
    ? getWalkingMinutes(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
    : null
  const shareWalkMins = !isNaN(shareLat) && !isNaN(shareLng)
    ? getWalkingMinutes(shareLat, shareLng, venue.lat, venue.lng)
    : null

  if (isShareView) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
        <div style={{ padding: '14px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rule)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'var(--text-label)', color: 'var(--color-ink)' }}>{venue.name}</h2>
          <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', color: 'var(--color-ink-muted)', fontSize: 'var(--text-body-sm)' }}>
            {[venue.suburb, shareWalkMins ? `~${shareWalkMins} min walk` : null].filter(Boolean).join(' · ')}
          </p>
          {routeLoading && (
            <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', color: 'var(--color-ink-disabled)', fontSize: 'var(--text-body-sm)' }}>Loading route…</p>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MapContainer center={[venue.lat, venue.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
            <Marker position={[venue.lat, venue.lng]} icon={destinationLabelIcon} interactive={false} />
            {!isNaN(shareLat) && !isNaN(shareLng) && (
              <>
                <Marker position={[shareLat, shareLng]} icon={userPinIcon} />
                <Marker position={[shareLat, shareLng]} icon={startLabelIcon} interactive={false} />
              </>
            )}
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} pathOptions={{ color: routeMode === 'coolest' ? '#16a34a' : '#1852B4', weight: 6, opacity: 0.85 }} />
            )}
            {routeCoords.length > 0 && (
              <MapBoundsController routeCoords={routeCoords} venueLat={venue.lat} venueLng={venue.lng} />
            )}
          </MapContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <Navbar />
      <style>{`
        .venue-detail-action,
        .venue-detail-link,
        .venue-route-tab {
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        .venue-detail-action:hover,
        .venue-detail-link:hover,
        .venue-route-tab:hover {
          transform: translateY(-1px);
        }
        .venue-detail-action:hover {
          box-shadow: 0 8px 20px rgba(24,82,180,0.18);
          filter: brightness(0.96);
        }
        .venue-detail-link:hover {
          background: var(--color-blue-soft) !important;
          border-color: var(--color-blue-chip) !important;
        }
        .venue-route-tab:hover {
          color: var(--color-blue) !important;
        }
        .venue-detail-action:active,
        .venue-detail-link:active,
        .venue-route-tab:active {
          transform: translateY(0) scale(0.99);
        }
        .venue-detail-action:focus-visible,
        .venue-detail-link:focus-visible,
        .venue-route-tab:focus-visible {
          outline: 3px solid rgba(24,82,180,0.18);
          outline-offset: 3px;
        }
      `}</style>

      <main
        className="flex-1 cs-venue-detail-main"
        style={{
          padding: '112px 24px 72px',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: 'min(100%, 760px)', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', color: 'var(--color-ink-muted)' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', padding: 0 }}>
              Home
            </button>
            <span style={{ color: 'var(--color-rule)' }}>›</span>
            <button onClick={() => navigate('/spaces')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', padding: 0 }}>
              Spaces
            </button>
            <span style={{ color: 'var(--color-rule)' }}>›</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>{venue.name}</span>
          </nav>

          {/* Venue name */}
          <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: 'var(--text-title-lg)', color: 'var(--color-ink)', margin: '0 0 24px', lineHeight: 1.15 }}>
            {venue.name}
          </h1>

          {/* Info cards row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'stretch', flexWrap: 'wrap' }}>

            {/* Opening Hours card */}
            <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-label)', color: 'var(--color-ink)' }}>Opening Hours</span>
              </div>

              {!hoursDisplay ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-disabled)' }}>Hours unavailable</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Today row — highlighted */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--color-spotlight-green)', border: '1px solid rgba(42,125,79,0.2)' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', fontWeight: 700, color: 'var(--color-green)' }}>
                      Today ({hoursDisplay.todayName.slice(0, 3)})
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', fontWeight: 700, color: 'var(--color-green)' }}>
                      {hoursDisplay.todayHours ? `${fmt(hoursDisplay.todayHours.open)} – ${fmt(hoursDisplay.todayHours.close)}` : 'Closed'}
                    </span>
                  </div>

                  {/* Rest of the week */}
                  {hoursDisplay.upcoming.map(({ day, hours }) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)' }}>{day}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)' }}>
                        {hours ? `${fmt(hours.open)} – ${fmt(hours.close)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location card */}
            <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-label)', color: 'var(--color-ink)' }}>Location</span>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-ink)', margin: 0 }}>
                {[venue.address, venue.suburb].filter(Boolean).join(', ')}
              </p>

              {/* Walking time */}
              {userLocation && walkMins !== null ? (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4" r="2" /><path d="M9 20l1-6-2-3 3-3" /><path d="M15 20l-1-6 2-3-3-3" /><path d="M8 13h8" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)' }}>{walkMins} min walk from your location</span>
                </div>
              ) : locationDenied ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', color: 'var(--color-blue)', textDecoration: 'underline', textAlign: 'left' }}>
                    Enable location to see walking time
                  </button>
                  {showDeniedAlert && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-orange)', margin: 0 }}>Location access is required to show walking distance.</p>
                  )}
                </div>
              ) : (
                <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', color: 'var(--color-blue)', textDecoration: 'underline', textAlign: 'left' }}>
                  Enable location to see walking time
                </button>
              )}

              {/* Phone */}
              {venue.phone && (
                <button onClick={() => { window.location.href = `tel:${venue.phone}` }}
                  className="venue-detail-link"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'var(--color-blue-soft)', border: '1px solid var(--color-blue-chip)', borderRadius: 8, padding: '13px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-label)', color: 'var(--color-blue-navy)', cursor: 'pointer', minHeight: 48 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 5.55 5.55l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                  </svg>
                  {venue.phone}
                </button>
              )}
            </div>
          </div>

          {/* Get Directions section */}
          <div ref={directionsRef} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-title-xs)', color: 'var(--color-ink)', margin: '0 0 4px' }}>Get Directions</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', margin: '0 0 16px', lineHeight: 'var(--leading-body)' }}>Choose your preferred walking path based on shade.</p>

            {/* Route toggle */}
            <div style={{ display: 'flex', background: 'var(--color-warm)', borderRadius: 50, padding: 4, marginBottom: 16 }}>
              {[
                { key: 'fastest', label: routeLoading && routeMode === 'fastest' ? 'Loading…' : 'Fastest Route' },
                { key: 'coolest', label: 'Coolest Route' },
              ].map(({ key, label }) => (
                <button key={key} className="venue-route-tab" onClick={() => setRouteMode(key)}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', background: routeMode === key ? 'var(--color-surface)' : 'transparent', color: routeMode === key ? 'var(--color-blue)' : 'var(--color-ink-muted)', fontWeight: routeMode === key ? 700 : 500, boxShadow: routeMode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', minHeight: 48, transition: 'all 0.15s ease' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {routeError && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-orange)', marginBottom: 12 }}>{routeError}</p>
            )}

            {/* Inline map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', height: 300 }}>
              <MapContainer center={[venue.lat, venue.lng]} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
                <MapBoundsController routeCoords={routeCoords} venueLat={venue.lat} venueLng={venue.lng} />
                <Pane name="detail-route" style={{ zIndex: 450 }}>
                  {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} pathOptions={{ color: routeMode === 'coolest' ? '#16a34a' : '#1852B4', weight: 6, opacity: 0.85 }} />
                  )}
                </Pane>
                <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
                <Marker position={[venue.lat, venue.lng]} icon={destinationLabelIcon} interactive={false} />
                {userLocation && (
                  <>
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userPinIcon} />
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={startLabelIcon} interactive={false} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Step-by-step directions */}
            {routeSteps.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--color-rule)', paddingTop: 16 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-label)', color: 'var(--color-ink-muted)', marginBottom: 10 }}>
                  Step-by-step
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {routeSteps.map((step, i) => {
                    const dist = fmtDist(step.distance)
                    const isLast = i === routeSteps.length - 1
                    const isArrive = step.maneuver?.type === 'arrive'
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: dist ? 'flex-start' : 'center', gap: 12, padding: '10px 0', borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isArrive ? 'var(--color-blue-callout)' : 'var(--color-tint)' }}>
                          <i className={`ti ${maneuverIcon(step.maneuver)}`} style={{ fontSize: 16, color: isArrive ? 'var(--color-blue)' : 'var(--color-ink-muted)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>
                            {maneuverLabel(step)}
                          </p>
                          {dist && (
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                              {dist}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Share This Route with Family button */}
          <button className="venue-detail-link" onClick={() => setShareModalOpen(true)}
            style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-green)', border: '2px solid var(--color-green)', borderRadius: 12, padding: '18px 0', fontSize: 'var(--text-body)', fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', minHeight: 48, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share This Route with Family
          </button>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', textAlign: 'center', margin: '0 0 20px' }}>
            Let your family know where you're going
          </p>

          {/* View on Spaces button */}
          <button className="venue-detail-action" onClick={() => navigate('/spaces', { state: { flyTo: { lat: venue.lat, lng: venue.lng }, openVenueId: venue.id } })}
            style={{ width: '100%', background: 'var(--color-blue)', color: '#fff', border: 'none', borderRadius: 12, padding: '18px 0', fontSize: 'var(--text-body)', fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', minHeight: 48, marginBottom: 40 }}
          >
            View in Spaces →
          </button>

        </div>
      </main>

      <ShareRouteModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        venueId={venue.id}
        venueName={venue.name}
        routeType={routeMode}
        userLocation={userLocation}
        routeCoords={routeCoords}
      />
    </div>
  )
}
