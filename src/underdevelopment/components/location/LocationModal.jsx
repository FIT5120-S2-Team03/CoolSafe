import { useState } from 'react'

const RULE = '#E5DCC8'
const INK = '#0F0F0F'

export default function LocationModal({ open, onClose, requestGps, fetchByPostcode, canDismiss = false }) {
  const [postcode, setPostcode] = useState('')

  if (!open) return null

  function closeIfAllowed() {
    if (canDismiss) onClose()
  }

  return (
    <div
      onClick={closeIfAllowed}
      style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: canDismiss ? 'pointer' : 'default' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1)', cursor: 'default' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1852B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-3 7-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.625rem', color: INK, textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px', lineHeight: 1.2, fontWeight: 'normal' }}>
          Where are you?
        </h2>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9375rem', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.55, marginBottom: 24 }}>
          We need your location to show nearby cool spaces and personalise your heat risk.
        </p>

        <button
          onClick={() => {
            onClose()
            requestGps()
          }}
          style={{ width: '100%', background: '#1852B4', color: '#fff', border: 'none', borderRadius: 12, padding: 15, fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
        >
          Use my current location
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: RULE }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', color: '#9C9A96' }}>or</span>
          <div style={{ flex: 1, height: 1, background: RULE }} />
        </div>

        <form
          style={{ display: 'flex', gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault()
            if (!postcode.trim()) return
            onClose()
            fetchByPostcode(postcode.trim())
          }}
        >
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Enter postcode (e.g. 3000)"
            style={{ flex: 1, border: `1.5px solid ${RULE}`, borderRadius: 10, padding: '12px 16px', fontFamily: 'var(--sans)', fontSize: '0.9375rem', color: INK, outline: 'none', background: '#FAFAF9', minWidth: 0 }}
          />
          <button
            type="submit"
            style={{ background: INK, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontFamily: 'var(--sans)', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
