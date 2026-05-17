import { INK, MUTED, RULE } from '../../styles/colors'

export default function SafetyResponsePanel({ maxSeverity, response, onShare }) {
  if (!response) {
    return (
      <div className="cs-safety-response-panel" key="default" style={{ background: '#EEF4F6', border: '1px solid #C2D4DC', borderRadius: 22, padding: '28px', display: 'flex', alignItems: 'flex-start', gap: 24, animation: 'cs-safety-in 0.25s ease' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-sm)', fontWeight: 'normal', color: INK, margin: '0 0 10px', lineHeight: 1.05 }}>
            Not feeling well?
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.55, margin: 0 }}>
            Select any symptoms above for clear next steps. If you want someone to check in, CoolSafer can prepare a message with your symptoms, location, and medication notes to send in one tap.
          </p>
        </div>
        <svg width="80" height="80" viewBox="0 0 88 88" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
          <circle cx="44" cy="44" r="40" stroke="#9FBECE" strokeWidth="1" fill="#D8EAF0" />
          <polyline points="4,44 22,44 28,30 36,58 44,20 52,60 58,36 66,44 84,44" stroke="#4A7A8C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    )
  }

  return (
    <div className="cs-safety-response-panel" key={maxSeverity} style={{ background: response.bg, border: `1.5px solid ${response.border}`, borderRadius: 22, padding: '24px 28px', animation: 'cs-safety-in 0.25s ease' }}>
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-xs)', fontWeight: 'normal', color: INK, margin: '0 0 18px' }}>
        {response.headline}
      </h3>

      <div className="cs-safety-action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <ResponseList title={response.actionTitle} items={response.whileYouWait} response={response} />
        <ResponseList title={response.avoidTitle} items={response.avoid} response={response} />
      </div>

      {response.primaryIsRoute && (
        <div style={{ marginBottom: 14, fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: response.accent, lineHeight: 'var(--leading-compact)' }}>
          Need somewhere cooler? Use <strong>Find cool spaces</strong> on the right.
        </div>
      )}

      <div className="cs-safety-response-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {!response.primaryIsRoute && (
          <a
            href={response.primaryHref}
            className="cs-call-link"
            style={{ flex: '1 1 0', display: 'block', textAlign: 'center', background: response.primaryBg, color: '#fff', borderRadius: 99, padding: '10px 20px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-button)', fontWeight: 700, textDecoration: 'none' }}
          >
            {response.primaryLabel}
          </a>
        )}
        <button
          onClick={onShare}
          className="cs-share-btn"
          style={{ flex: '1 1 0', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.80)', border: `1.5px solid ${response.border}`, borderRadius: 99, padding: '9px 16px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-button)', fontWeight: 600, color: response.accent, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
          Alert a family member or carer
        </button>
      </div>

      {response.secondaryCallLabel && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: response.accent }}>
            Still feeling unwell?{' '}
          </span>
          <a
            href={response.secondaryCallHref}
            style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: response.accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            {response.secondaryCallLabel}
          </a>
        </div>
      )}
    </div>
  )
}

function ResponseList({ title, items, response }) {
  return (
    <div className="cs-safety-response-list" style={{ background: 'rgba(255,255,255,0.60)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: response.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        {title}
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: response.iconBg, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              {i + 1}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: INK, lineHeight: 1.45 }}>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
