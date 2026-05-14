/**
 * Floating pill navbar matching the HTML prototype.
 *
 * Layout (3-column grid):
 *   Left   — CoolSafer logo (serif, links to "/")
 *   Center — Today (/today) and Map (/map) tabs
 *   Right  — warm-pill location badge + date
 */
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ locationName }) {
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
      padding: '0 22px',
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
      </div>

      {/* Right — location pill + date */}
      <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 8 }}>
        {displayLocation && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 'var(--text-caption)',
            color: 'var(--color-ink-muted)',
            background: 'var(--color-warm)',
            padding: '6px 12px',
            borderRadius: 16,
            letterSpacing: '0.02em',
            border: '0.5px solid rgba(0,0,0,0.05)',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
          }}>
            <i className="ti ti-map-pin" style={{ fontSize: 14, color: 'var(--color-blue)' }} />
            <span id="nav-loc-text">{displayLocation}, VIC</span>
          </div>
        )}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 'var(--text-caption)',
          color: 'var(--color-ink-muted)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>
          {date}
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
        padding: '8px 18px',
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
    >
      {children}
    </Link>
  )
}
