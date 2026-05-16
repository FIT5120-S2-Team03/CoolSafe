import { FAINT, INK, MUTED, RULE } from '../../styles/colors'

const MED_LABELS = {
  'Blood pressure medication': 'Blood pressure',
  'Diuretics / water tablets': 'Water pills',
  Antidepressants: 'Antidepressants',
  'Diabetes medication': 'Diabetes',
  Antihistamines: 'Antihistamines',
  'Heart medication': 'Heart meds',
  Antipsychotics: 'Antipsychotics',
  'Pain relievers (NSAIDs)': 'Pain relievers',
}

const SHIMMER = 'linear-gradient(90deg, #EDE5D4 25%, #F5EFE3 50%, #EDE5D4 75%)'

export function WeatherCallout({ value, label, badge, badgeColor, style: extraStyle }) {
  const loading = value === '—'
  return (
    <div
      className="weather-callout"
      style={{
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${RULE}`,
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: '0 4px 20px rgba(34,30,26,0.10)',
      minWidth: 110,
      cursor: 'default',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      ...extraStyle,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        {loading ? (
          <span style={{ display: 'inline-block', width: 52, height: 20, borderRadius: 6, background: SHIMMER, backgroundSize: '200% 100%', animation: 'cs-shimmer 1.6s ease-in-out infinite' }} />
        ) : (
          <span style={{ fontFamily: "var(--font-title)", fontSize: '1.375rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
        )}
        <span style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</span>
      </div>
      {loading ? (
        <span style={{ display: 'inline-block', width: 68, height: 18, borderRadius: 99, background: SHIMMER, backgroundSize: '200% 100%', animation: 'cs-shimmer 1.6s ease-in-out infinite', animationDelay: '0.2s' }} />
      ) : (
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: `${badgeColor}18`, fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 600, color: badgeColor, alignSelf: 'flex-start' }}>
          {badge}
        </span>
      )}
    </div>
  )
}

export function ThingCard({ icon, iconBg, title, desc, extra, extraBeforeDesc = false, cta, ctaIcon = 'arrow_forward', onClick, windowIntro, windowTime, windowLabel }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 24, padding: 34, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, cursor: 'pointer', transition: 'border-color 0.18s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8A3F28' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE }}
    >
      <div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: INK }}>{icon}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-title-sm)', color: INK, lineHeight: 1.16, marginBottom: windowTime || (extraBeforeDesc && extra) ? 0 : 18, fontWeight: 'normal', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {extraBeforeDesc && extra && <div style={{ marginTop: 16, marginBottom: 16 }}>{extra}</div>}
        {(windowIntro || windowTime) && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.45, margin: '14px 0 12px' }}>
            {windowTime && <strong style={{ color: INK, fontWeight: 700 }}>{windowTime}</strong>}
            {windowTime && windowLabel ? ' ' : ''}
            {windowLabel && <span>{windowLabel}</span>}
            {(windowTime || windowLabel) && windowIntro ? ' — ' : ''}
            {windowIntro}
          </p>
        )}
        <p style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.45, margin: windowIntro || windowTime ? '0' : 0 }}>
          {desc}
        </p>
        {!extraBeforeDesc && extra && <div style={{ marginTop: 12 }}>{extra}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 600, color: INK }}>
        {cta}
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ctaIcon}</span>
      </div>
    </div>
  )
}

export function MedAdviceChips({ medications, activeMed, onSelect, onClear }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {medications.map((med) => (
        <button
          key={med}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(med)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 99,
            background: activeMed === med ? '#B85A3C' : '#FFFCF6',
            border: activeMed === med ? '1px solid #B85A3C' : `1px solid ${RULE}`,
            fontFamily: "var(--font-body)",
            fontSize: '1rem',
            fontWeight: 500,
            color: activeMed === med ? '#fff' : MUTED,
            lineHeight: 1.4,
            cursor: 'pointer',
            transition: 'border-color 0.18s ease, color 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => {
            if (activeMed !== med) {
              e.currentTarget.style.borderColor = '#8A3F28'
              e.currentTarget.style.color = INK
            }
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = activeMed === med ? '#B85A3C' : RULE
            e.currentTarget.style.color = activeMed === med ? '#fff' : MUTED
            e.currentTarget.style.transform = 'none'
          }}
        >
          {MED_LABELS[med] ?? med}
        </button>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#8A3F28',
          fontFamily: 'var(--sans)',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '3px 4px',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          transition: 'color 0.18s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = INK }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#8A3F28' }}
      >
        Clear all
      </button>
    </div>
  )
}
