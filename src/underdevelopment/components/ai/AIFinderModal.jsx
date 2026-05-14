import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  ink:           '#14110d',
  terracotta:    '#a44a3f',
  bgWarm:        '#efe9dd',
  surface:       '#faf6ef',
  border:        '#e5dccc',
  borderStrong:  '#d4c7af',
  textSecondary: '#514a3f',
  textMuted:     '#8a7f6e',
  green:         '#2d5e3e',
  selectedBg:    '#f4eedd',
  skeletonA:     '#e0d6bf',
  skeletonB:     '#e8debf',
}
const SERIF = "'DM Serif Display', 'Instrument Serif', Georgia, serif"
const SANS  = "'DM Sans', Inter, sans-serif"
const MONO  = "'JetBrains Mono', 'Courier New', monospace"

// ── Icons ──────────────────────────────────────────────────────────────────
const SparkleIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z" fill={color} />
    <path d="M19 4 L19.6 6 L21.5 6.5 L19.6 7 L19 9 L18.4 7 L16.5 6.5 L18.4 6 Z" fill={color} opacity="0.7" />
  </svg>
)
const CloseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)
const BackIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const RefreshIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const WalkIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="13" cy="4" r="2" />
    <path d="M7 22l2-7-2.5-2.2L5 17H3l1.8-5.5c.3-.8.7-1.4 1.5-1.7L11 8l1.5 3 3 1.5V11l-2-1 1.6-3.6c.4-.9 1.5-1.2 2.3-.7l3.6 2.4-1.1 1.6-2.6-1.7-1.6 3.6 2.7 1.5V17h-2v-2.6L12 13l-2 8H8z" />
  </svg>
)
const CoinIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10 M9.5 9.5h4 a2 2 0 0 1 0 4 h-4 a2 2 0 0 0 0 4 h5" />
  </svg>
)
const ArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)
const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ── Option data ────────────────────────────────────────────────────────────
const OPTIONS = [
  { key: 'cool_down',       emoji: '🌬️', label: 'Just need to cool down' },
  { key: 'something_to_do', emoji: '🎯', label: 'Something to do today' },
  { key: 'free_nearby',     emoji: '💰', label: 'Free & nearby' },
  { key: 'easy_walk',       emoji: '🚶', label: 'Close enough to walk' },
  { key: 'quiet_sit',       emoji: '📖', label: 'Quiet place to sit' },
]

// ── Sub-components ─────────────────────────────────────────────────────────
function VibeChip({ option, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        background: selected ? C.selectedBg : C.surface,
        border: `1px solid ${selected ? C.terracotta : C.border}`,
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: selected ? 600 : 500,
        fontFamily: SANS,
        color: selected ? C.terracotta : C.ink,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        width: '100%',
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{option.emoji}</span>
      <span style={{ flex: 1 }}>{option.label}</span>
      {selected && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: C.terracotta, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CheckIcon size={12} />
        </span>
      )}
    </button>
  )
}

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: C.terracotta, display: 'inline-block',
          animation: `aiDot 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: C.bgWarm, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 14, width: '70%', background: C.skeletonA, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
      <div style={{ height: 11, width: '50%', background: C.skeletonB, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
      <div style={{ height: 11, width: '85%', background: C.skeletonB, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
    </div>
  )
}

function PriceChip({ cost }) {
  const isFree = cost?.toLowerCase() === 'free'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999, flexShrink: 0,
      fontSize: 11, fontWeight: 700, fontFamily: SANS,
      background: isFree ? '#e8f5ee' : C.bgWarm,
      color: isFree ? C.green : C.textSecondary,
      border: `1px solid ${isFree ? '#b8deca' : C.border}`,
    }}>
      {isFree && <CheckIcon size={10} />}
      {isFree ? 'FREE' : cost}
    </span>
  )
}

function PlaceCard({ event, onGo }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: C.terracotta,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {event.venue}
        </div>
        <PriceChip cost={event.cost} />
      </div>
      <div style={{
        fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: C.ink,
        letterSpacing: '-0.015em', lineHeight: 1.1,
      }}>
        {event.activity}
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.45, fontFamily: MONO }}>
        {event.address}
      </div>
      <button
        type="button"
        onClick={onGo}
        style={{
          marginTop: 4, alignSelf: 'stretch',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: C.ink, border: 'none', color: '#fff',
          fontSize: 14, fontWeight: 500, padding: '11px 18px',
          borderRadius: 999, fontFamily: SANS, cursor: 'pointer',
        }}
      >
        Go <ArrowRight />
      </button>
    </div>
  )
}

function PanelHeader({ view, selectedCount, onRefine, onClose }) {
  const title = {
    pick:    <span>What sounds <span style={{ fontStyle: 'italic', color: C.terracotta }}>good?</span></span>,
    loading: <span style={{ fontStyle: 'italic' }}>Finding places…</span>,
    results: <span>Picked <span style={{ fontStyle: 'italic', color: C.terracotta }}>for you</span></span>,
  }[view]

  const subtitle = {
    pick:    "Pick one — we'll match the rest.",
    loading: "Checking what's open and cool right now",
    results: `Based on ${selectedCount} preference${selectedCount === 1 ? '' : 's'}`,
  }[view]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '18px 18px 16px',
      borderBottom: `1px solid ${C.border}`,
      background: C.bgWarm,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: C.selectedBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <SparkleIcon size={18} color={C.terracotta} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.1, color: C.ink }}>
          {title}
        </div>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>{subtitle}</div>
      </div>

      {view === 'results' && (
        <button
          type="button"
          onClick={onRefine}
          style={{
            padding: '6px 12px',
            border: `1px solid ${C.borderStrong}`,
            background: 'transparent', borderRadius: 999,
            fontSize: 11.5, fontWeight: 500, color: C.textSecondary,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: SANS, cursor: 'pointer',
          }}
        >
          <BackIcon size={12} /> Refine
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'transparent', border: `1px solid ${C.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.textSecondary, cursor: 'pointer', flexShrink: 0,
        }}
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

// ── Loading steps ──────────────────────────────────────────────────────────
const LOADING_STEPS = [
  'Getting your location',
  'Checking nearby venues',
  'Searching today\'s activities',
  'Looking at opening hours',
  'Checking prices',
  'Picking the best matches',
]

function LoadingSteps() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {LOADING_STEPS.map((label, i) => {
        const isDone    = i < activeIdx
        const isActive  = i === activeIdx
        const isPending = i > activeIdx
        return (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 2px',
              fontSize: 13, fontFamily: SANS,
              color: isPending ? C.textMuted : C.ink,
              fontWeight: isActive ? 600 : 400,
              opacity: isPending ? 0.4 : 1,
              transition: 'opacity 0.3s, color 0.3s',
              animation: isActive ? 'aiStepIn 0.35s ease' : 'none',
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: isDone ? C.terracotta : isActive ? C.selectedBg : C.bgWarm,
              border: isActive ? `1.5px solid ${C.terracotta}` : 'none',
              color: '#fff',
              flexShrink: 0,
              transition: 'background 0.25s',
            }}>
              {isDone && <CheckIcon size={12} />}
              {isActive && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.terracotta,
                  animation: 'aiPulseDot 1s ease-in-out infinite',
                }} />
              )}
            </span>
            <span style={{ flex: 1 }}>
              {label}
              {isActive && <span style={{ color: C.terracotta }}>…</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component — pure presentation, all state lives in AIFinderButton ──
export default function AIFinderModal({
  onClose,
  view,
  selectedIntent, onSelectIntent,
  extraNote, onExtraNote,
  onFind, onShowDifferent, onRefine,
  results, error,
}) {
  const navigate = useNavigate()
  const events = results?.events ?? []

  return (
    <>
      <style>{`
        @keyframes aiPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes aiDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
        @keyframes aiShimmer {
          0%   { opacity: 0.6; }
          50%  { opacity: 1;   }
          100% { opacity: 0.6; }
        }
        @keyframes aiStepIn {
          from { opacity: 0.5; transform: translateX(-4px); }
          to   { opacity: 1;   transform: translateX(0); }
        }
        @keyframes aiPulseDot {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(0.6); opacity: 0.5; }
        }
        .ai-extra-input:focus {
          background: #fff !important;
          border-color: #a44a3f !important;
          outline: none;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 100, right: 28, zIndex: 89,
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 140px)',
        background: C.surface,
        borderRadius: 18,
        boxShadow: '0 24px 60px rgba(20,17,13,0.16), 0 4px 12px rgba(20,17,13,0.06)',
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'aiPopIn 0.22s cubic-bezier(.2,.9,.3,1)',
        transformOrigin: 'bottom right',
      }}>

        <PanelHeader
          view={view}
          selectedCount={selectedIntent ? 1 : 0}
          onRefine={onRefine}
          onClose={onClose}
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 4px' }}>

          {/* Pick */}
          {view === 'pick' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OPTIONS.map(opt => (
                  <VibeChip
                    key={opt.key}
                    option={opt}
                    selected={selectedIntent === opt.key}
                    onToggle={() => onSelectIntent(k => k === opt.key ? null : opt.key)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: C.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'block', marginBottom: 6, fontFamily: SANS,
                }}>
                  Anything else?{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  className="ai-extra-input"
                  type="text"
                  value={extraNote}
                  onChange={(e) => onExtraNote(e.target.value)}
                  placeholder="e.g. no stairs, with seating"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    fontFamily: SANS, border: `1px solid ${C.border}`,
                    borderRadius: 10, background: C.bgWarm, color: C.ink,
                    boxSizing: 'border-box', transition: 'background 0.15s, border-color 0.15s',
                  }}
                />
              </div>
            </>
          )}

          {/* Loading */}
          {view === 'loading' && (
            <div style={{ padding: '14px 4px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <LoadingSteps />
              <SkeletonCard />
            </div>
          )}

          {/* Results */}
          {view === 'results' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
              {error && (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: C.textMuted, fontFamily: SANS }}>
                  {error}
                </div>
              )}
              {!error && events.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: C.textMuted, fontFamily: SANS }}>
                  No results found nearby — try a different preference.
                </div>
              )}
              {!error && events.slice(0, 4).map((event, i) => (
                <PlaceCard
                  key={event.venue_id ?? i}
                  event={event}
                  onGo={() => { onClose(); navigate(`/venue/${event.venue_id}`) }}
                />
              ))}
              <button
                type="button"
                onClick={onShowDifferent}
                style={{
                  marginTop: 4, padding: 11,
                  background: 'transparent', border: `1px solid ${C.borderStrong}`,
                  borderRadius: 999, color: C.textSecondary,
                  fontSize: 13, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: SANS, cursor: 'pointer',
                }}
              >
                <RefreshIcon size={14} /> Show different picks
              </button>
              {results?.health_reminder && (
                <p style={{
                  fontFamily: SERIF, fontSize: 11.5, fontStyle: 'italic',
                  color: C.textMuted, textAlign: 'center', margin: '4px 0 0',
                }}>
                  {results.health_reminder}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA — pick step only */}
        {view === 'pick' && (
          <div style={{ padding: '14px 18px 16px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
            <button
              type="button"
              onClick={onFind}
              disabled={!selectedIntent}
              style={{
                width: '100%', padding: 14,
                background: selectedIntent ? C.ink : C.bgWarm,
                color: selectedIntent ? '#fff' : C.textMuted,
                border: 'none', borderRadius: 999,
                fontWeight: 500, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: selectedIntent ? 'pointer' : 'not-allowed',
                boxShadow: selectedIntent ? '0 4px 14px rgba(20,17,13,0.18)' : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
                fontFamily: SANS,
              }}
            >
              <SparkleIcon size={16} color={selectedIntent ? C.terracotta : C.textMuted} />
              {selectedIntent ? 'Find a place' : 'Find places'}
            </button>
            <div style={{
              fontSize: 11, color: C.textMuted, textAlign: 'center',
              marginTop: 10, fontStyle: 'italic', fontFamily: SERIF,
            }}>
              AI picks — double-check hours before you go.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
