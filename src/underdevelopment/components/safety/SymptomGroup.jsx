import { INK, MUTED } from '../../styles/colors'

export default function SymptomGroup({ title, badge, groupStyle, symptoms, selectedSymptoms, onToggle, activeColor, selectedBg }) {
  return (
    <div className="cs-symptom-group" style={{ borderRadius: 24, padding: '22px 20px', ...groupStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-sm)', fontWeight: 'normal', color: INK, margin: 0 }}>
          {title}
        </h2>
        {badge && (
          <span style={{ padding: '5px 12px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="cs-symptom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {symptoms.map(symptom => {
          const selected = selectedSymptoms.includes(symptom.id)
          return (
            <button
              key={symptom.id}
              type="button"
              className="cs-sym-btn"
              onClick={() => onToggle(symptom.id)}
              style={{
                borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                border: selected ? `1.5px solid ${activeColor}` : '1px solid rgba(34,30,26,0.10)',
                background: selected ? selectedBg : '#fff',
                padding: '20px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
            >
              <span className="material-symbols-outlined cs-sym-icon" style={{ fontSize: 24, color: selected ? activeColor : '#6E6358' }}>
                {symptom.icon}
              </span>
              <div className="cs-sym-content">
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-label)', fontWeight: 700, color: selected ? activeColor : INK, lineHeight: 1.25, marginBottom: 3 }}>
                  {symptom.label}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: MUTED, lineHeight: 1.35, fontWeight: 400 }}>
                  {symptom.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
