import { C, SERIF, SANS, MONO } from './AIFinderTheme'
import { ArrowRight, CheckIcon } from './AIFinderIcons'

export function VibeChip({ option, selected, onToggle }) {
  return (
    <button
      type="button"
      className="ai-vibe-chip"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        background: selected ? C.selectedBg : C.optionSurface,
        border: `1px solid ${selected ? C.blue : C.border}`,
        borderRadius: 999,
        fontSize: 15.5,
        fontWeight: selected ? 600 : 500,
        fontFamily: SANS,
        color: selected ? C.blue : C.ink,
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: selected ? 'inset 0 0 0 1px rgba(91,122,140,0.08)' : 'none',
        transition: 'background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease, transform 0.12s ease',
        width: '100%',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 19, lineHeight: 1, color: C.blue, flexShrink: 0 }}>{option.icon}</span>
      <span style={{ flex: 1 }}>{option.label}</span>
      {selected && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: C.blue, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CheckIcon size={12} />
        </span>
      )}
    </button>
  )
}

export function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: C.blue, display: 'inline-block',
          animation: `aiDot 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
  )
}

export function SkeletonCard() {
  return (
    <div style={{ background: C.bgWarm, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 14, width: '70%', background: C.skeletonA, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
      <div style={{ height: 11, width: '50%', background: C.skeletonB, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
      <div style={{ height: 11, width: '85%', background: C.skeletonB, borderRadius: 4, animation: 'aiShimmer 1.4s linear infinite' }} />
    </div>
  )
}

export function PriceChip({ cost }) {
  const isFree = cost?.toLowerCase().startsWith('free')
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      alignSelf: 'flex-start',
      maxWidth: '100%',
      padding: '4px 10px', borderRadius: 999, flexShrink: 0,
      fontSize: 14, fontWeight: 700, fontFamily: SANS,
      lineHeight: 1.2,
      background: isFree ? '#e8f5ee' : C.bgWarm,
      color: isFree ? C.green : C.textSecondary,
      border: `1px solid ${isFree ? '#b8deca' : C.border}`,
      whiteSpace: 'normal',
      overflowWrap: 'break-word',
    }}>
      {isFree && <CheckIcon size={10} />}
      {cost}
    </span>
  )
}

export function PlaceCard({ event, onGo }) {
  return (
    <div style={{
      background: C.optionSurface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, color: C.blueDeep,
          textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.25,
          width: '100%',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
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
      <div style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.45, fontFamily: MONO }}>
        {event.address}
      </div>
      <button
        type="button"
        className="ai-primary-action"
        onClick={onGo}
        style={{
          marginTop: 4, alignSelf: 'stretch',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: C.blue, border: 'none', color: '#fff',
          fontSize: 16, fontWeight: 500, padding: '11px 18px',
          borderRadius: 999, fontFamily: SANS, cursor: 'pointer',
          boxShadow: '0 8px 18px rgba(91,122,140,0.18)',
          transition: 'background 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease',
        }}
      >
        Go <ArrowRight />
      </button>
    </div>
  )
}
