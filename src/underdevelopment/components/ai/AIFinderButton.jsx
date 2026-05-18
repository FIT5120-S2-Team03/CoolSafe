import { useEffect, useState } from 'react'
import { useWeatherData } from '../../hooks/useWeatherData'
import useCoolSpaces from '../../hooks/useCoolSpaces'
import { useAIRecommend } from '../../hooks/useAIRecommend'
import AIFinderModal from './AIFinderModal'
import { TOGGLE_AI_FINDER_EVENT } from './aiFinderEvents'
import { SparkleIcon, CloseIcon } from './AIFinderIcons'

const AI_COLOR = 'var(--color-ai)'
const AI_COLOR_DEEP = 'var(--color-ai-deep)'
const AI_SHADOW = 'rgba(80,112,200,0.24)'

export default function AIFinderButton() {
  const [open, setOpen] = useState(false)

  // ── Persistent state (survives open/close cycles) ──────────────────────
  const [view, setView]                   = useState('pick')
  const [selectedIntent, setSelectedIntent] = useState(null)
  const [extraNote, setExtraNote]         = useState('')
  const [excludedIds, setExcludedIds]     = useState([])

  const { lat, lng, hourly, locationName } = useWeatherData()
  const { venues }                         = useCoolSpaces()
  const { recommend, results, error, candidateCount, usedFallbackCandidates } = useAIRecommend()

  useEffect(() => {
    function onToggleAIFinder() {
      setOpen((value) => !value)
    }
    window.addEventListener(TOGGLE_AI_FINDER_EVENT, onToggleAIFinder)
    return () => window.removeEventListener(TOGGLE_AI_FINDER_EVENT, onToggleAIFinder)
  }, [])

  async function handleFind() {
    setView('loading')
    await recommend({
      intent: selectedIntent,
      extraNote: extraNote.trim(),
      userLat: lat,
      userLng: lng,
      venues,
      weatherData: { hourly, locationName },
      excludeIds: excludedIds,
    })
    setView('results')
  }

  async function handleShowDifferent(currentResults) {
    const shownIds = (currentResults?.events ?? []).map(e => e.venue_id).filter(Boolean)
    const nextExcluded = [...excludedIds, ...shownIds]
    setExcludedIds(nextExcluded)
    setView('loading')
    await recommend({
      intent: selectedIntent,
      extraNote: extraNote.trim(),
      userLat: lat,
      userLng: lng,
      venues,
      weatherData: { hourly, locationName },
      excludeIds: nextExcluded,
    })
    setView('results')
  }

  function handleRefine() {
    setExcludedIds([])
    setView('pick')
  }

  return (
    <>
      {/* Pill trigger */}
      {!open && (
        <button
          type="button"
          className="cs-ai-finder-trigger"
          onClick={() => setOpen(true)}
          aria-label="AI place finder"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 18,
            zIndex: 1400,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px 14px 16px',
            background: AI_COLOR,
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-body)",
            boxShadow: `0 10px 28px ${AI_SHADOW}, 0 2px 6px rgba(30,70,90,0.10)`,
            transition: 'transform 0.15s',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = AI_COLOR_DEEP; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = AI_COLOR; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <SparkleIcon size={22} color="#fff" />
          <span className="cs-ai-finder-label">AI place finder</span>
        </button>
      )}

      {/* Circular close button */}
      {open && (
        <button
          type="button"
          className="cs-ai-finder-trigger"
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 18,
            zIndex: 1400,
            width: 56, height: 56, borderRadius: '50%',
            background: AI_COLOR,
            color: '#fff',
            border: 'none',
            boxShadow: `0 10px 28px ${AI_SHADOW}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = AI_COLOR_DEEP }}
          onMouseLeave={(e) => { e.currentTarget.style.background = AI_COLOR }}
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
          onShowDifferent={() => handleShowDifferent(results)}
          onRefine={handleRefine}
          results={results}
          error={error}
          candidateCount={candidateCount}
          usedFallbackCandidates={usedFallbackCandidates}
        />
      )}
    </>
  )
}
