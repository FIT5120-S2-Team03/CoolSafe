import { fmt } from '../../../utils/venueDetailUtils'

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 5.55 5.55l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  )
}

function WalkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M9 20l1-6-2-3 3-3" />
      <path d="M15 20l-1-6 2-3-3-3" />
      <path d="M8 13h8" />
    </svg>
  )
}

export default function VenueInfoCards({
  hoursDisplay,
  locationDenied,
  onRequestLocation,
  showDeniedAlert,
  userLocation,
  venue,
  walkMins,
}) {
  return (
    <div className="venue-info-grid">
      <section className="venue-info-card">
        <div className="venue-info-card-heading">
          <ClockIcon />
          <span>Opening Hours</span>
        </div>

        {!hoursDisplay ? (
          <p className="venue-muted-text">Hours unavailable</p>
        ) : (
          <div className="venue-hours-list">
            <div className="venue-hours-today">
              <span>Today ({hoursDisplay.todayName.slice(0, 3)})</span>
              <span>{hoursDisplay.todayHours ? `${fmt(hoursDisplay.todayHours.open)} - ${fmt(hoursDisplay.todayHours.close)}` : 'Closed'}</span>
            </div>

            {hoursDisplay.upcoming.map(({ day, hours }) => (
              <div key={day} className="venue-hours-row">
                <span>{day}</span>
                <span>{hours ? `${fmt(hours.open)} - ${fmt(hours.close)}` : 'Closed'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="venue-info-card venue-location-card">
        <div className="venue-info-card-heading">
          <PinIcon />
          <span>Location</span>
        </div>

        <p className="venue-address">{[venue.address, venue.suburb].filter(Boolean).join(', ')}</p>

        {userLocation && walkMins !== null ? (
          <div className="venue-walk-time">
            <WalkIcon />
            <span>{walkMins} min walk from your location</span>
          </div>
        ) : locationDenied ? (
          <div className="venue-location-prompt">
            <button onClick={onRequestLocation}>Enable location to see walking time</button>
            {showDeniedAlert && (
              <p>Location access is required to show walking distance.</p>
            )}
          </div>
        ) : (
          <button className="venue-location-button" onClick={onRequestLocation}>
            Enable location to see walking time
          </button>
        )}

        {venue.phone && (
          <button onClick={() => { window.location.href = `tel:${venue.phone}` }} className="venue-detail-link venue-phone-button">
            <PhoneIcon />
            {venue.phone}
          </button>
        )}
      </section>
    </div>
  )
}
