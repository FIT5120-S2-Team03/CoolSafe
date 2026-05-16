/**
 * Floating pill navbar matching the HTML prototype.
 *
 * Layout (3-column grid):
 *   Left   — CoolSafer logo (serif, links to "/")
 *   Center — Today (/today), Spaces (/spaces), and Health (/health) tabs
 *   Right  — warm-pill location badge + date
 */
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import { openGlobalLocationModal } from '../location/locationModalEvents'

export default function Navbar({ locationName, onLocationClick }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (locationName) localStorage.setItem(STORAGE_KEYS.locationName, locationName)
  }, [locationName])

  const displayLocation = locationName || localStorage.getItem(STORAGE_KEYS.locationName)

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()

  const isHome    = pathname === '/'        || pathname === '/underdevelopment'
  const isToday   = pathname === '/today'   || pathname === '/underdevelopment/today'
  const isSpaces  = pathname === '/spaces'  || pathname === '/underdevelopment/spaces'
  const isHealth  = pathname === '/health'  || pathname === '/underdevelopment/health'
  const handleLocationClick = onLocationClick ?? openGlobalLocationModal

  return (
    <>
    <nav className="cs-navbar" style={{
      position: 'fixed',
      top: 'var(--nav-top)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1200,
      width: 'calc(100% - var(--content-gutter, 32px) * 2)',
      maxWidth: 'var(--content-width, 1120px)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 6px',
      height: 52,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 26,
      boxShadow: '0 1px 16px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
    }}>

      {/* Left — logo */}
      <Link
        className="cs-navbar-logo"
        to="/"
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--color-ink)',
          letterSpacing: '-0.055em',
          textDecoration: 'none',
          justifySelf: 'start',
          alignSelf: 'center',
          paddingLeft: 16,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        CoolSafer
      </Link>

      {/* Center — tabs */}
      <div className="cs-navbar-tabs" style={{ display: 'flex', gap: 2 }}>
        <NavTab to="/today"   active={isToday}>Today</NavTab>
        <NavTab to="/spaces"  active={isSpaces}>Spaces</NavTab>
        <NavTab to="/health"  active={isHealth}>Health</NavTab>
      </div>

      {/* Center — tabs (desktop only, hidden on mobile via CSS) */}
      {/* Right — date + location pill */}
      <div className="cs-navbar-meta" style={{
        justifySelf: 'end',
        paddingRight: 4,
        display: 'inline-flex',
        alignItems: 'center',
        height: 34,
        background: 'rgba(0,0,0,0.04)',
        border: '0.5px solid rgba(0,0,0,0.06)',
        borderRadius: 999,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        {/* Date — static, non-interactive */}
        <span className="cs-navbar-date" style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          color: 'var(--color-ink-muted)',
          letterSpacing: '0.05em',
          padding: '0 10px',
        }}>
          {date}
        </span>

        {/* Location — clickable */}
        {displayLocation && (
          <>
            <div className="cs-navbar-divider" style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
            <button
              type="button"
              className="cs-navbar-location"
              onClick={handleLocationClick}
              aria-label="Change location"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--mono)',
                fontSize: 13,
                color: 'var(--color-blue)',
                letterSpacing: '0.02em',
                background: 'transparent',
                border: 'none',
                padding: '0 10px 0 8px',
                height: '100%',
                cursor: 'pointer',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-blue-deep, #1852B4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-blue)' }}
            >
              <i className="ti ti-map-pin" style={{ fontSize: 14 }} />
              <span id="nav-loc-text">{displayLocation}, VIC</span>
            </button>
          </>
        )}
      </div>
    </nav>

    {/* ── Mobile bottom nav (hidden on desktop via CSS) ── */}
    <nav className="cs-bottom-nav" aria-label="Main navigation">
      <BottomTab to="/"       icon="home"        label="Home"    active={isHome} />
      <BottomTab to="/today"  icon="wb_sunny"    label="Today"   active={isToday} />
      <BottomTab to="/spaces" icon="location_on" label="Spaces"  active={isSpaces} />
      <BottomTab to="/health" icon="favorite"    label="Health"  active={isHealth} />
    </nav>
  </>
  )
}

function BottomTab({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        textDecoration: 'none',
        color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        paddingBottom: 2,
        transition: 'color 0.15s',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 24,
          fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
          transition: 'font-variation-settings 0.15s',
        }}
      >
        {icon}
      </span>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.01em',
        lineHeight: 1,
      }}>
        {label}
      </span>
    </Link>
  )
}

function NavTab({ to, active, children }) {
  return (
    <Link
      className="cs-nav-tab"
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
