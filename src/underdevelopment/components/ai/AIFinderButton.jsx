import { useState } from 'react'
import { useWeatherData } from '../../hooks/useWeatherData'
import useCoolSpaces from '../../hooks/useCoolSpaces'
import { useAIRecommend } from '../../hooks/useAIRecommend'
import AIFinderModal from './AIFinderModal'

const SparkleIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z" fill={color} />
    <path d="M19 4 L19.6 6 L21.5 6.5 L19.6 7 L19 9 L18.4 7 L16.5 6.5 L18.4 6 Z" fill={color} opacity="0.7" />
  </svg>
)

const CloseIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)

export default function AIFinderButton() {
  const [open, setOpen] = useState(false)

  // ── Persistent state (survives open/close cycles) ──────────────────────
  const [view, setView]                   = useState('pick')
  const [selectedIntent, setSelectedIntent] = useState(null)
  const [extraNote, setExtraNote]         = useState('')

  const { lat, lng, hourly, locationName } = useWeatherData()
  const { venues }                         = useCoolSpaces()
  const { recommend, results, error }      = useAIRecommend()

  async function handleFind() {
    setView('loading')
    await recommend({
      intent: selectedIntent,
      extraNote: extraNote.trim(),
      userLat: lat,
      userLng: lng,
      venues,
      weatherData: { hourly, locationName },
    })
    setView('results')
  }

  function handleRefine() {
    setView('pick')
  }

  return (
    <>
      {/* Pill trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Help me find a place"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 90,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px 14px 16px',
            background: '#14110d',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 10px 28px rgba(20,17,13,0.22), 0 2px 6px rgba(20,17,13,0.10)',
            transition: 'transform 0.15s',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#a44a3f',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SparkleIcon size={16} color="#fff" />
          </span>
          Help me find a place
        </button>
      )}

      {/* Circular close button */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 90,
            width: 56, height: 56, borderRadius: '50%',
            background: '#14110d',
            color: '#fff',
            border: 'none',
            boxShadow: '0 10px 28px rgba(20,17,13,0.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <CloseIcon size={22} />
        </button>
      )}

      {/* Modal — only rendered when open, but state lives here so it persists */}
      {open && (
        <AIFinderModal
          onClose={() => setOpen(false)}
          view={view}
          selectedIntent={selectedIntent}
          onSelectIntent={setSelectedIntent}
          extraNote={extraNote}
          onExtraNote={setExtraNote}
          onFind={handleFind}
          onRefine={handleRefine}
          results={results}
          error={error}
        />
      )}
    </>
  )
}
