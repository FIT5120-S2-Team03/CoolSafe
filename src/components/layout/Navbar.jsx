/**
 * Fixed top navigation bar with the CoolSafe logo and Home/Map route links.
 */
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  const activeClass =
    "font-['Public_Sans'] font-bold text-[18px] text-[#0056d2] border-b-[4px] border-[#0056d2] pb-[8px]"
  const inactiveClass =
    "font-['Public_Sans'] font-bold text-[18px] text-[#475569]"

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-[68px]"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(195,198,214,0.3)',
      }}
    >
      <div className="relative flex items-center w-full px-6">
        <span
          className="font-['Public_Sans'] text-[24px] text-[#0056d2]"
          style={{ fontWeight: 900, letterSpacing: '-0.6px' }}
        >
          CoolSafe
        </span>
        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-[40px]">
          <Link to="/" className={pathname === '/' ? activeClass : inactiveClass}>
            Home
          </Link>
          <Link to="/map" className={pathname === '/map' ? activeClass : inactiveClass}>
            Map
          </Link>
        </nav>
      </div>
    </header>
  )
}
