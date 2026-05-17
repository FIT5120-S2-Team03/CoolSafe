import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CATEGORY_UI_BACKGROUNDS,
  CATEGORY_UI_COLORS,
} from '../../../utils/categoryMapping'
import { getWalkingMinutes } from '../../../utils/routing/haversine'

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

export default function VenuePopup({ venue, userLocation, routeDurationMin, onFastestRoute, onCoolestRoute, onPrefetchCoolestRoute, routeLoading, onClose }) {
  const navigate = useNavigate()
  const openStatus = getOpenStatus(venue.opening_hours)
  const [selectedRoute, setSelectedRoute] = useState('fastest')

  useEffect(() => {
    onFastestRoute(venue)
    onPrefetchCoolestRoute?.(venue)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedWalkMins =
    userLocation != null
      ? getWalkingMinutes(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
      : null
  const walkMins = routeDurationMin ?? estimatedWalkMins

  return (
    <div
      className="cs-map-venue-card"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: 20,
        width: 300,
        fontFamily: 'var(--font-body)',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="cs-map-icon-action"
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
          color: 'var(--color-ink-disabled)',
          minWidth: 44,
          minHeight: 44,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-ink)', margin: '0 32px 8px 0' }}>
        {venue.name}
      </p>

      <span style={{
        display: 'inline-block',
        backgroundColor: CATEGORY_UI_BACKGROUNDS[venue.category] ?? 'var(--color-warm)',
        color: CATEGORY_UI_COLORS[venue.category] ?? 'var(--color-ink-muted)',
        borderRadius: 'var(--radius-pill)',
        padding: '4px 10px',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-label)',
        fontWeight: 700,
        marginBottom: 10,
      }}>
        {venue.category}
      </span>

      {venue.address && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', margin: '0 0 12px' }}>
          {venue.address}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', marginBottom: 16 }}>
        {openStatus.status === 'unavailable' ? (
          <span style={{ color: 'var(--color-ink-disabled)' }}>Hours unavailable</span>
        ) : (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: openStatus.status === 'open' ? 'var(--color-green)' : 'var(--color-orange)', flexShrink: 0 }} />
            <span style={{ color: openStatus.status === 'open' ? 'var(--color-green)' : 'var(--color-orange)', fontWeight: 600 }}>
              {openStatus.status === 'open' ? 'Open Now' : 'Closed'}
            </span>
            {openStatus.status === 'open' && (
              <>
                <span style={{ color: 'var(--color-rule)' }}>•</span>
                <span style={{ color: 'var(--color-ink-muted)' }}>Closes {openStatus.closeTime}</span>
              </>
            )}
          </>
        )}
        {walkMins != null && (
          <>
            <span style={{ color: 'var(--color-rule)' }}>•</span>
            <span style={{ color: 'var(--color-ink-muted)' }}>{walkMins} min walk</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => { setSelectedRoute('fastest'); onFastestRoute(venue) }}
          disabled={routeLoading}
          className="cs-map-route-button"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: selectedRoute === 'fastest' ? 'var(--color-green)' : routeLoading ? 'var(--color-warm)' : 'var(--color-surface)',
            border: selectedRoute === 'fastest' ? 'none' : '1px solid var(--color-rule)',
            borderRadius: 10, padding: '10px 0',
            color: selectedRoute === 'fastest' ? '#fff' : 'var(--color-ink)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-label)',
            cursor: routeLoading ? 'not-allowed' : 'pointer', minHeight: 44,
          }}
        >
          {routeLoading && selectedRoute === 'fastest' ? 'Loading...' : 'Fastest'}
        </button>

        <button
          onClick={() => { setSelectedRoute('coolest'); onCoolestRoute(venue) }}
          disabled={routeLoading}
          className="cs-map-route-button"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: selectedRoute === 'coolest' ? 'var(--color-green)' : routeLoading ? 'var(--color-warm)' : 'var(--color-surface)',
            border: selectedRoute === 'coolest' ? 'none' : '1px solid var(--color-rule)',
            borderRadius: 10, padding: '10px 0',
            color: selectedRoute === 'coolest' ? '#fff' : 'var(--color-ink)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-label)',
            cursor: routeLoading ? 'not-allowed' : 'pointer', minHeight: 44,
          }}
        >
          {routeLoading && selectedRoute === 'coolest' ? 'Loading...' : 'Coolest'}
        </button>
      </div>

      <button
        onClick={() => navigate(`/venue/${venue.id}`, { state: { venue } })}
        className="cs-map-primary-action"
        style={{ width: '100%', backgroundColor: 'var(--color-blue)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 'var(--text-button)', fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', minHeight: 44 }}
      >
        View Full Details →
      </button>
    </div>
  )
}
