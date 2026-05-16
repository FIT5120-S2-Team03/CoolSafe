import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Polyline, Pane, useMap } from 'react-leaflet'
import Navbar from '../components/layout/Navbar'
import { getWalkingMinutes } from '../utils/haversine'
import useVenue from '../hooks/useVenue'
import ShareRouteModal from '../components/venue/ShareRouteModal'
import mockLocation from '../data/mockLocation.json'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const userPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#64748b"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#64748b"/>
  </svg>`,
})

const venuePinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#003fa4"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#003fa4"/>
  </svg>`,
})

function fmt(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function getHoursDisplay(openingHours) {
  if (!openingHours || Object.keys(openingHours).length === 0) return null
  const todayName = new Date().toLocaleDateString('en-AU', { weekday: 'long' })
  const todayIdx = DAYS.indexOf(todayName)
  const todayHours = openingHours[todayName] ?? null

  const upcoming = []
  for (let i = 1; upcoming.length < 6 && i <= 7; i++) {
    const dayName = DAYS[(todayIdx + i) % 7]
    const h = openingHours[dayName]
    upcoming.push({ day: dayName, hours: h ?? null })
  }

  return { todayName, todayHours, upcoming }
}

function MapBoundsController({ routeCoords, venueLat, venueLng }) {
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

export default function VenueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isShareView = searchParams.get('share') === 'true'
  const shareLat = parseFloat(searchParams.get('from_lat'))
  const shareLng = parseFloat(searchParams.get('from_lng'))

  const { venue, loading, error } = useVenue(id, location.state?.venue)

  const [userLocation, setUserLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showDeniedAlert, setShowDeniedAlert] = useState(false)
  const [routeMode, setRouteMode] = useState('fastest')
  const [routeCoords, setRouteCoords] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)

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
      setRouteCoords([])
    }
  }, [userLocation, routeMode, venue, isShareView])

  useEffect(() => {
    if (!isShareView || !venue || isNaN(shareLat) || isNaN(shareLng)) return
    fetchFastestRoute({ lat: shareLat, lng: shareLng })
  }, [isShareView, venue])

  async function fetchFastestRoute(from) {
    try {
      setRouteLoading(true)
      setRouteError('')
      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Route request failed: HTTP ${res.status}`)
      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No route found.')
      setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setRouteLoading(false)
    }
  }

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
    <div className="flex flex-col min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#003fa4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  )

  if (error || !venue) return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div style={{ textAlign: 'center', fontFamily: "var(--font-body)" }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>Venue not found.</p>
          <button onClick={() => navigate('/map')} style={{ color: '#003fa4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "var(--font-body)" }}>
            Back to Map
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
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{venue.name}</h2>
          <p style={{ margin: '3px 0 0', fontFamily: "var(--font-body)", color: '#64748b', fontSize: '0.9375rem' }}>
            {[venue.suburb, shareWalkMins ? `~${shareWalkMins} min walk` : null].filter(Boolean).join(' · ')}
          </p>
          {routeLoading && (
            <p style={{ margin: '3px 0 0', fontFamily: "var(--font-body)", color: '#94a3b8', fontSize: '0.9375rem' }}>Loading route…</p>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MapContainer center={[venue.lat, venue.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
            {!isNaN(shareLat) && !isNaN(shareLng) && (
              <Marker position={[shareLat, shareLng]} icon={userPinIcon} />
            )}
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} pathOptions={{ color: '#003fa4', weight: 6, opacity: 0.85 }} />
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
    <div className="flex flex-col min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      <main
        className="flex-1"
        style={{
          padding: '112px 24px 72px',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 'min(100%, 760px)',
            margin: '0 auto',
          }}
        >

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-6" style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#64748b' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontFamily: "var(--font-body)", fontSize: 15, padding: 0 }}>
              Home
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontFamily: "var(--font-body)", fontSize: 15, padding: 0 }}>
              Map
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#1e293b', fontWeight: 700 }}>{venue.name}</span>
          </nav>

          {/* Venue name */}
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 900, fontSize: 36, color: '#0f172a', margin: '0 0 24px', lineHeight: 1.15 }}>
            {venue.name}
          </h1>

          {/* Info cards row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'stretch', flexWrap: 'wrap' }}>

            {/* Opening Hours card */}
            <div style={{ flex: '1 1 300px', minWidth: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Opening Hours</span>
              </div>

              {!hoursDisplay ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: '#94a3b8' }}>Hours unavailable</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Today row — highlighted */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      Today ({hoursDisplay.todayName.slice(0, 3)})
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      {hoursDisplay.todayHours ? `${fmt(hoursDisplay.todayHours.open)} – ${fmt(hoursDisplay.todayHours.close)}` : 'Closed'}
                    </span>
                  </div>

                  {/* Rest of the week */}
                  {hoursDisplay.upcoming.map(({ day, hours }) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px' }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#475569' }}>{day}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#475569' }}>
                        {hours ? `${fmt(hours.open)} – ${fmt(hours.close)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location card */}
            <div style={{ flex: '1 1 300px', minWidth: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Location</span>
              </div>

              <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: '#1e293b', margin: 0 }}>
                {[venue.address, venue.suburb].filter(Boolean).join(', ')}
              </p>

              {/* Walking time */}
              {userLocation && walkMins !== null ? (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4" r="2" /><path d="M9 20l1-6-2-3 3-3" /><path d="M15 20l-1-6 2-3-3-3" /><path d="M8 13h8" />
                  </svg>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#64748b' }}>{walkMins} min walk from your location</span>
                </div>
              ) : locationDenied ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "var(--font-body)", fontSize: 15, color: '#003fa4', textDecoration: 'underline', textAlign: 'left' }}>
                    Enable location to see walking time
                  </button>
                  {showDeniedAlert && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: '#dc2626', margin: 0 }}>Location access is required to show walking distance.</p>
                  )}
                </div>
              ) : (
                <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "var(--font-body)", fontSize: 15, color: '#003fa4', textDecoration: 'underline', textAlign: 'left' }}>
                  Enable location to see walking time
                </button>
              )}

              {/* Phone — only shown if venue has one */}
              {venue.phone && (
                <button onClick={() => { window.location.href = `tel:${venue.phone}` }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '13px 16px', fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, color: '#1e40af', cursor: 'pointer', minHeight: 48 }}
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
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 24, color: '#0f172a', margin: '0 0 4px' }}>Get Directions</h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: '#64748b', margin: '0 0 16px' }}>Choose your preferred walking path based on shade.</p>

            {/* Route toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 50, padding: 4, marginBottom: 16 }}>
              {[{ key: 'fastest', label: routeLoading && routeMode === 'fastest' ? '⚡ Loading…' : '⚡ Fastest Route' }, { key: 'coolest', label: '🌲 Coolest Route' }].map(({ key, label }) => (
                <button key={key} onClick={() => setRouteMode(key)}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', background: routeMode === key ? '#fff' : 'transparent', color: routeMode === key ? '#003fa4' : '#64748b', fontWeight: routeMode === key ? 700 : 400, boxShadow: routeMode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: "var(--font-body)", fontSize: 16, minHeight: 48, transition: 'all 0.15s ease' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {routeError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#dc2626', marginBottom: 12 }}>{routeError}</p>
            )}

            {/* Inline map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', height: 300 }}>
              <MapContainer center={[venue.lat, venue.lng]} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
                <MapBoundsController routeCoords={routeCoords} venueLat={venue.lat} venueLng={venue.lng} />
                <Pane name="detail-route" style={{ zIndex: 450 }}>
                  {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} pathOptions={{ color: '#003fa4', weight: 6, opacity: 0.85 }} />
                  )}
                </Pane>
                <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userPinIcon} />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Share This Route with Family button */}
          <button onClick={() => setShareModalOpen(true)}
            style={{ width: '100%', background: '#fff', color: '#16a34a', border: '2px solid #16a34a', borderRadius: 12, padding: '18px 0', fontSize: 18, fontWeight: 700, fontFamily: "var(--font-body)", cursor: 'pointer', minHeight: 48, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share This Route with Family
          </button>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: '#64748b', textAlign: 'center', margin: '0 0 20px' }}>
            Let your family know where you're going
          </p>

          {/* View on Full Map button */}
          <button onClick={() => navigate('/map', { state: { flyTo: { lat: venue.lat, lng: venue.lng }, openVenueId: venue.id } })}
            style={{ width: '100%', background: '#003fa4', color: '#fff', border: 'none', borderRadius: 12, padding: '18px 0', fontSize: 18, fontWeight: 700, fontFamily: "var(--font-body)", cursor: 'pointer', minHeight: 48, marginBottom: 40 }}
          >
            View on Full Map →
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
      />
    </div>
  )
}
