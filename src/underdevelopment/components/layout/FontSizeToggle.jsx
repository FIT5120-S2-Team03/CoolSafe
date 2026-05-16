import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../../constants/storageKeys'

const SIZES = {
  sm: { root: '14px', label: 'Small' },
  md: { root: '16px', label: 'Medium' },
  lg: { root: '19px', label: 'Large' },
}

export default function FontSizeToggle() {
  const [active, setActive] = useState(() => localStorage.getItem(STORAGE_KEYS.fontSize) || 'md')

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[active].root
    localStorage.setItem(STORAGE_KEYS.fontSize, active)
  }, [active])

  return (
    <div style={{
      position: 'fixed', bottom: '150px', left: 0, zIndex: 300,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
      borderRadius: '0 12px 12px 0',
      padding: '6px 4px',
      boxShadow: '2px 0 12px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
    }}>
      {[
        { key: 'sm', fontSize: '13px' },
        { key: 'md', fontSize: '16px' },
        { key: 'lg', fontSize: '19px' },
      ].map(({ key, fontSize }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize,
            width: '36px', height: '36px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: active === key ? '#0F0F0F' : 'none',
            color: active === key ? '#fff' : '#3A3A3A',
            transition: 'all 0.15s',
            lineHeight: 1,
          }}
        >
          A
        </button>
      ))}
    </div>
  )
}
