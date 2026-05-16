/**
 * Floating pill navbar matching the HTML prototype.
 *
 * Layout (3-column grid):
 *   Left   — CoolSafer logo (serif, links to "/")
 *   Center — Today (/today), Map (/map), and Safety (/safety) tabs
 *   Right  — warm-pill location badge + date
 */
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { openGlobalLocationModal } from '../location/GlobalLocationModal'

export default function Navbar({ locationName, onLocationClick }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (locationName) localStorage.setItem('cs_location', locationName)
  }, [locationName])

  const displayLocation = locationName || localStorage.getItem('cs_location')

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()

  const isToday   = pathname === '/today'  || pathname === '/underdevelopment/today'
  const isMap     = pathname === '/map'    || pathname === '/underdevelopment/map'
  const isSafety  = pathname === '/safety' || pathname === '/underdevelopment/safety'
  const handleLocationClick = onLocationClick ?? openGlobalLocationModal

  return (
    <nav style={{
      position: 'fixed',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 300,
      width: 'calc(100% - var(--content-gutter, 32px) * 2)',
      maxWidth: 'var(--content-width, 1120px)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 7px 0 22px',
      height: 52,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 26,
      boxShadow: '0 1px 16px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
    }}>

      {/* Logo */}
      <Link
        to="/"
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'var(--text-body-lg)',
          fontWeight: 600,
          color: 'var(--color-ink)',
          letterSpacing: 0,
          textDecoration: 'none',
          justifySelf: 'start',
          alignSelf: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          transform: 'translateY(1px)',
          whiteSpace: 'nowrap',
        }}
      >
        CoolSafer
      </Link>

      {/* Center tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <NavTab to="/today" active={isToday}>Today</NavTab>
        <NavTab to="/map"   active={isMap}>Map</NavTab>
        <NavTab to="/safety" active={isSafety}>Safety</NavTab>
      </div>

      {/* Right — date + clickable location */}
      <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          background: 'rgba(34,30,26,0.035)',
          border: '0.5px solid rgba(0,0,0,0.04)',
          borderRadius: 22,
          padding: 3,
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 'var(--text-caption)',
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            padding: '5px 10px',
            borderRadius: 15,
          }}>
            <i className="ti ti-calendar" style={{ fontSize: 16, color: 'var(--color-ink-muted)' }} />
            {date}
          </div>
          {displayLocation && (
            <div style={{ width: 1, height: 20, background: 'rgba(34,30,26,0.10)', margin: '0 3px' }} />
          )}
          {displayLocation && (
            <button
              type="button"
              onClick={handleLocationClick}
              aria-label="Change location"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--mono)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-blue)',
                background: 'transparent',
                padding: '5px 10px',
                borderRadius: 15,
                letterSpacing: '0.02em',
                border: '0.5px solid transparent',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(24,82,180,0.20)'
                e.currentTarget.style.background = 'var(--color-blue-soft)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <i className="ti ti-map-pin" style={{ fontSize: 16, color: 'var(--color-blue)' }} />
              <span id="nav-loc-text">{displayLocation}, VIC</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavTab({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: 'var(--sans)',
        fontSize: 'var(--text-label)',
        fontWeight: active ? 600 : 500,
        color: active ? '#fff' : 'var(--color-ink-soft)',
        padding: '8px 16px',
        cursor: 'pointer',
        borderRadius: 22,
        transition: 'all 0.18s',
        letterSpacing: 0,
        textDecoration: 'none',
        background: active ? 'var(--color-ink)' : 'none',
        border: 'none',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        if (active) return
        e.currentTarget.style.background = 'rgba(34,30,26,0.07)'
        e.currentTarget.style.color = 'var(--color-ink)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--color-ink-soft)'
      }}
    >
      {children}
    </Link>
  )
}
