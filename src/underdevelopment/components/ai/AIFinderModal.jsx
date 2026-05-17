import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, SERIF, SANS, MONO } from './AIFinderTheme'
import { SparkleIcon, CloseIcon, BackIcon, RefreshIcon, ArrowRight, CheckIcon } from './AIFinderIcons'
import { VibeChip, SkeletonCard, PlaceCard } from './AIFinderCards'

// ── Option data ────────────────────────────────────────────────────────────
const OPTIONS = [
  { key: 'cool_down',       icon: 'mode_fan',        label: 'Just need to cool down' },
  { key: 'something_to_do', icon: 'explore',         label: 'Something to do today' },
  { key: 'free_nearby',     icon: 'attach_money',    label: 'Free & nearby' },
  { key: 'easy_walk',       icon: 'directions_walk', label: 'Close enough to walk' },
  { key: 'quiet_sit',       icon: 'menu_book',       label: 'Quiet place to sit' },
]

function PanelHeader({ view, onRefine, onClose }) {
  const title = {
    pick:    <span>What sounds <span style={{ fontStyle: 'italic', color: C.blue }}>good?</span></span>,
    loading: <span style={{ fontStyle: 'italic' }}>Finding places…</span>,
    results: <span>Picked <span style={{ fontStyle: 'italic', color: C.blue }}>for you</span></span>,
  }[view]

  const subtitle = {
    pick:    "Pick one — we'll match the rest.",
    loading: "Checking what's open and cool right now",
    results: 'Here are the best matches I found.',
  }[view]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '18px 18px 16px',
      borderBottom: `1px solid ${C.border}`,
      background: C.blueHeader,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: C.selectedBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <SparkleIcon size={18} color={C.blue} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.1, color: C.ink }}>
          {title}
        </div>
        <div style={{ fontSize: 15.5, color: C.textMuted, marginTop: 3 }}>{subtitle}</div>
      </div>

      {view === 'results' && (
        <button
          type="button"
          className="ai-secondary-action"
          onClick={onRefine}
          style={{
            padding: '6px 12px',
            border: `1px solid rgba(80,112,200,0.28)`,
            background: '#fff', borderRadius: 999,
            fontSize: 15.5, fontWeight: 500, color: C.blue,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: SANS, cursor: 'pointer',
            transition: 'background 0.16s ease, border-color 0.16s ease, transform 0.12s ease',
          }}
        >
          <BackIcon size={12} /> Refine
        </button>
      )}

      <button
        type="button"
        className="ai-icon-action"
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#fff', border: `1px solid rgba(80,112,200,0.28)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.blue, cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.12s ease',
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
              fontSize: 'var(--text-label)', fontFamily: SANS,
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
              background: isDone ? C.blue : isActive ? C.selectedBg : C.blueHeader,
              border: isActive ? `1.5px solid ${C.blue}` : 'none',
              color: '#fff',
              flexShrink: 0,
              transition: 'background 0.25s',
            }}>
              {isDone && <CheckIcon size={12} />}
              {isActive && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.blue,
                  animation: 'aiPulseDot 1s ease-in-out infinite',
                }} />
              )}
            </span>
            <span style={{ flex: 1 }}>
              {label}
              {isActive && <span style={{ color: C.blue }}>…</span>}
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
          border-color: #5070C8 !important;
          box-shadow: 0 0 0 3px rgba(80, 112, 200, 0.14);
          outline: none;
        }
        .ai-vibe-chip:hover {
          background: #F4F6FD !important;
          border-color: #9AAAE0 !important;
          box-shadow: 0 8px 18px rgba(51,80,168,0.08);
          transform: translateY(-1px);
        }
        .ai-vibe-chip:active {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 3px 8px rgba(51,80,168,0.08);
        }
        .ai-vibe-chip:focus-visible,
        .ai-primary-action:focus-visible,
        .ai-secondary-action:focus-visible,
        .ai-icon-action:focus-visible {
          outline: 3px solid rgba(80, 112, 200, 0.22);
          outline-offset: 3px;
        }
        .ai-primary-action:not(:disabled):hover {
          background: #3350A8 !important;
          box-shadow: 0 10px 22px rgba(80,112,200,0.26);
          transform: translateY(-1px);
        }
        .ai-find-action:not(:disabled):hover {
          background: #5070C8 !important;
        }
        .ai-primary-action:not(:disabled):active {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 5px 12px rgba(80,112,200,0.2);
        }
        .ai-primary-action:disabled {
          opacity: 0.82;
        }
        .ai-secondary-action:hover,
        .ai-icon-action:hover {
          background: #F4F6FD !important;
          border-color: #9AAAE0 !important;
          color: #3350A8 !important;
          transform: translateY(-1px);
        }
        .ai-secondary-action:active,
        .ai-icon-action:active {
          transform: translateY(0) scale(0.97);
        }
      `}</style>

      <div className="cs-ai-panel" style={{
        position: 'fixed',
        bottom: 96, right: 24, zIndex: 1399,
        width: 370,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'min(720px, calc(100vh - 190px))',
        background: C.bluePanel,
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
              <div style={{ marginTop: 16, marginBottom: 14 }}>
                <label style={{
                  fontSize: 'var(--text-label)', fontWeight: 600, color: C.textMuted,
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
                    width: '100%', padding: '10px 12px', fontSize: 'var(--text-label)',
                    fontFamily: SANS, border: `1px solid ${C.border}`,
                    borderRadius: 10, background: '#fff', color: C.ink,
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
                <div style={{ padding: 20, textAlign: 'center', fontSize: 'var(--text-body-sm)', color: C.textMuted, fontFamily: SANS }}>
                  {error}
                </div>
              )}
              {!error && events.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 'var(--text-body-sm)', color: C.textMuted, fontFamily: SANS }}>
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
                className="ai-secondary-action"
                onClick={onShowDifferent}
                style={{
                  marginTop: 4, padding: 11,
                  background: 'transparent', border: `1px solid ${C.borderStrong}`,
                  borderRadius: 999, color: C.textSecondary,
                  fontSize: 'var(--text-label)', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: SANS, cursor: 'pointer',
                  transition: 'background 0.16s ease, border-color 0.16s ease, transform 0.12s ease',
                }}
              >
                <RefreshIcon size={14} /> Show different picks
              </button>
              {results?.health_reminder && (
                <p style={{
                  fontFamily: SERIF, fontSize: 'var(--text-body-sm)', fontStyle: 'italic',
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
          <div style={{ padding: '14px 18px 16px', borderTop: `1px solid ${C.border}`, background: C.bluePanel }}>
            <button
              type="button"
              className="ai-primary-action ai-find-action"
              onClick={onFind}
              disabled={!selectedIntent}
              style={{
                width: '100%', padding: 14,
                background: selectedIntent ? C.blueDeep : C.bgWarm,
                color: selectedIntent ? '#fff' : C.textMuted,
                border: 'none', borderRadius: 999,
                fontWeight: 500, fontSize: 'var(--text-button)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: selectedIntent ? 'pointer' : 'not-allowed',
                boxShadow: selectedIntent ? '0 8px 18px rgba(80,112,200,0.22)' : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
                fontFamily: SANS,
              }}
            >
              <SparkleIcon size={16} color={selectedIntent ? '#fff' : C.textMuted} />
              {selectedIntent ? 'Find a place' : 'Find places'}
            </button>
            <div style={{
              fontSize: 'var(--text-label)', color: C.textMuted, textAlign: 'center',
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
