import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { getWalkingMinutes } from '../utils/haversine'
import useVenue from '../hooks/useVenue'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

export default function VenueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { venue, loading, error } = useVenue(id)

  const [userLocation, setUserLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showDeniedAlert, setShowDeniedAlert] = useState(false)
  const [routeMode, setRouteMode] = useState('fastest')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true)
    )
  }, [])

  function requestLocation() {
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
      <Footer />
    </div>
  )

  if (error || !venue) return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div style={{ textAlign: 'center', fontFamily: "'Lexend', sans-serif" }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>Venue not found.</p>
          <button onClick={() => navigate('/map')} style={{ color: '#003fa4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Lexend', sans-serif" }}>
            Back to Map
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )

  const hoursDisplay = getHoursDisplay(venue.opening_hours)
  const walkMins = userLocation
    ? getWalkingMinutes(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
    : null

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      <main className="flex-1 pt-[68px]">
        <div className="mx-auto px-6 py-8" style={{ maxWidth: 800 }}>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-6" style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#64748b' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontFamily: "'Lexend', sans-serif", fontSize: 13, padding: 0 }}>
              Home
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontFamily: "'Lexend', sans-serif", fontSize: 13, padding: 0 }}>
              Map
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#1e293b', fontWeight: 700 }}>{venue.name}</span>
          </nav>

          {/* Venue name */}
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 36, color: '#0f172a', margin: '0 0 24px', lineHeight: 1.15 }}>
            {venue.name}
          </h1>

          {/* Info cards row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">

            {/* Opening Hours card */}
            <div className="flex-1" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Opening Hours</span>
              </div>

              {!hoursDisplay ? (
                <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 14, color: '#94a3b8' }}>Hours unavailable</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Today row — highlighted */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      Today ({hoursDisplay.todayName.slice(0, 3)})
                    </span>
                    <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      {hoursDisplay.todayHours ? `${fmt(hoursDisplay.todayHours.open)} – ${fmt(hoursDisplay.todayHours.close)}` : 'Closed'}
                    </span>
                  </div>

                  {/* Rest of the week */}
                  {hoursDisplay.upcoming.map(({ day, hours }) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px' }}>
                      <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#475569' }}>{day}</span>
                      <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#475569' }}>
                        {hours ? `${fmt(hours.open)} – ${fmt(hours.close)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location card */}
            <div className="flex-1" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Location</span>
              </div>

              <p style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 15, color: '#1e293b', margin: 0 }}>
                {[venue.address, venue.suburb].filter(Boolean).join(', ')}
              </p>

              {/* Walking time */}
              {userLocation && walkMins !== null ? (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4" r="2" /><path d="M9 20l1-6-2-3 3-3" /><path d="M15 20l-1-6 2-3-3-3" /><path d="M8 13h8" />
                  </svg>
                  <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#64748b' }}>{walkMins} min walk from your location</span>
                </div>
              ) : locationDenied ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#003fa4', textDecoration: 'underline', textAlign: 'left' }}>
                    Enable location to see walking time
                  </button>
                  {showDeniedAlert && (
                    <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 12, color: '#dc2626', margin: 0 }}>Location access is required to show walking distance.</p>
                  )}
                </div>
              ) : (
                <button onClick={requestLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#003fa4', textDecoration: 'underline', textAlign: 'left' }}>
                  Enable location to see walking time
                </button>
              )}

              {/* Phone — only shown if venue has one */}
              {venue.phone && (
                <button onClick={() => { window.location.href = `tel:${venue.phone}` }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '13px 16px', fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: 14, color: '#1e40af', cursor: 'pointer', minHeight: 48 }}
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
            <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 24, color: '#0f172a', margin: '0 0 4px' }}>Get Directions</h2>
            <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>Choose your preferred walking path based on shade.</p>

            {/* Route toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 50, padding: 4, marginBottom: 16 }}>
              {[{ key: 'fastest', label: '⚡ Fastest Route' }, { key: 'coolest', label: '🌲 Coolest Route' }].map(({ key, label }) => (
                <button key={key} onClick={() => setRouteMode(key)}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', background: routeMode === key ? '#fff' : 'transparent', color: routeMode === key ? '#003fa4' : '#64748b', fontWeight: routeMode === key ? 700 : 400, boxShadow: routeMode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: "'Lexend', sans-serif", fontSize: 14, minHeight: 48, transition: 'all 0.15s ease' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Inline map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', height: 300 }}>
              <MapContainer center={[venue.lat, venue.lng]} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
                <Marker position={[venue.lat, venue.lng]} icon={venuePinIcon} />
              </MapContainer>
            </div>
          </div>

          {/* View on Full Map button */}
          <button onClick={() => navigate('/map', { state: { flyTo: { lat: venue.lat, lng: venue.lng } } })}
            style={{ width: '100%', background: '#003fa4', color: '#fff', border: 'none', borderRadius: 12, padding: '18px 0', fontSize: 18, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", cursor: 'pointer', minHeight: 48, marginBottom: 40 }}
          >
            View on Full Map →
          </button>

        </div>
      </main>

      <Footer />
    </div>
  )
}
