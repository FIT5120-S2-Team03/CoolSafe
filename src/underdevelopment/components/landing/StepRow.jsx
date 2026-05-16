import { useState } from 'react'

export default function StepRow({ num, numColor, numRight, reverse, title, desc, actions, rotateCard, snippet, textShiftX = 0, snippetShiftX = 0 }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`cs-step-row${reverse ? ' cs-step-row--rev' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative oversized background number */}
      <div className="cs-step-num" style={{
        [numRight ? 'right' : 'left']: 0,
        color: numColor,
      }}>
        {num}
      </div>

      {/* Text body — title + desc only */}
      <div
        className="cs-step-text"
        style={textShiftX ? { transform: `translateX(${textShiftX}px)` } : {}}
      >
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.65rem, 2.2vw, 2rem)', letterSpacing: '-0.5px', color: 'var(--color-ink)', lineHeight: 1.1, fontWeight: 'normal' }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body)', lineHeight: 1.5, color: 'var(--color-ink-soft)', maxWidth: 480 }}>
          {desc}
        </p>
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
            boxShadow: hovered
              ? '0 32px 64px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)'
              : '0 24px 48px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)',
            transform: hovered ? 'rotate(0deg) translateY(-8px)' : `rotate(${rotateCard}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
            width: '100%',
            maxWidth: 340,
          }}
        >
          {snippet}
        </div>
      </div>

      {/* Actions — sibling so mobile can place them after the snippet */}
      <div
        className="cs-step-actions"
        style={textShiftX ? { transform: `translateX(${textShiftX}px)` } : {}}
      >
        {actions}
      </div>
    </div>
  )
}
