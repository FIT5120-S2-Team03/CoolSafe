export default function StepRow({ num, numColor, numRight, reverse, title, desc, actions, snippet, textShiftX = 0, snippetShiftX = 0, rotateCard = 0 }) {
  return (
    <div
      className={`cs-step-row${reverse ? ' cs-step-row--rev' : ''}`}
    >
      {/* Decorative oversized background number */}
      <div className="cs-step-num" style={{
        [numRight ? 'right' : 'left']: 0,
        color: numColor,
      }}>
        {num}
      </div>

      <div className="cs-step-copy">
        {/* Text body — title + desc only */}
        <div
          className="cs-step-text"
          style={textShiftX ? { transform: `translateX(${textShiftX}px)` } : {}}
        >
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-card-title-lg)', letterSpacing: 'var(--tracking-title)', color: 'var(--color-ink)', lineHeight: 'var(--leading-heading)', fontWeight: 'normal' }}>
            {title}
          </h3>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink-soft)', maxWidth: 480 }}>
            {desc}
          </p>
        </div>

        {/* Actions — kept with copy on desktop, reordered after snippet on mobile */}
        <div
          className="cs-step-actions"
          style={textShiftX ? { transform: `translateX(${textShiftX}px)` } : {}}
        >
          {actions}
        </div>
      </div>

      {/* Tilted UI snippet card */}
      <div
        className="cs-step-snippet"
        style={snippetShiftX ? { transform: `translateX(${snippetShiftX}px)` } : {}}
      >
        <div
          className="cs-step-snippet-card"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 20,
            boxShadow: '0 24px 48px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)',
            width: '100%',
            maxWidth: 340,
            transform: rotateCard ? `rotate(${rotateCard}deg)` : undefined,
          }}
        >
          {snippet}
        </div>
      </div>

    </div>
  )
}
