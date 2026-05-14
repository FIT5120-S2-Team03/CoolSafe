/**
 * Floating pill navbar — matches coolsafe_v9 prototype design.
 * Accepts optional locationName prop; persists it to localStorage so
 * other pages (MapPage, WhyItMattersPage) always show a location.
 */
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ locationName }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (locationName) {
      localStorage.setItem('cs_location', locationName)
    }
  }, [locationName])

  const displayLocation = locationName || localStorage.getItem('cs_location')

  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <nav
      style={{
        position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 200, width: 'calc(100% - 48px)', maxWidth: 960,
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
        padding: '0 24px', height: 56,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        boxShadow: '0 2px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.125rem', color: '#0F0F0F', letterSpacing: '-0.3px' }}>
        CoolSafer
      </span>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        <NavTab to="/" active={pathname === '/'}>Home</NavTab>
        <NavTab to="/map" active={pathname === '/map'}>Find Cool Spaces</NavTab>
        <NavTab to="/why" active={pathname === '/why'}>Why It Matters</NavTab>
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.8125rem', color: '#5C5C5C', letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {displayLocation ? `${displayLocation.toUpperCase()} · ${date}` : date}
      </div>
    </nav>
  )
}

function NavTab({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem',
        fontWeight: active ? 600 : 500,
        color: active ? '#fff' : '#3A3A3A',
        padding: '7px 14px', cursor: 'pointer',
        borderRadius: 20, transition: 'all 0.2s',
        letterSpacing: '0.01em', textDecoration: 'none',
        background: active ? '#0F0F0F' : 'transparent',
      }}
    >
      {children}
    </Link>
  )
}
