const EARLY_ACTIVE = '#8A5A12'
const EARLY_SEL_BG = '#FDF3D8'

export default function SelectedSymptomChips({ selectedSymptoms, symptoms, onClear, onToggle }) {
  if (!selectedSymptoms.length) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {selectedSymptoms.map(id => {
        const symptom = symptoms.find((s) => s.id === id)
        if (!symptom) return null
        const isUrgent = symptom.severity === '000'
        return (
          <button
            key={id}
            type="button"
            className="cs-chip-btn"
            onClick={() => onToggle(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: isUrgent ? '#FFF0EE' : EARLY_SEL_BG,
              border: `1px solid ${isUrgent ? 'rgba(201,75,26,0.32)' : 'rgba(138,90,18,0.32)'}`,
              color: isUrgent ? '#C94B1A' : EARLY_ACTIVE,
              borderRadius: 99, padding: '5px 11px',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {symptom.label}
            <span style={{ fontSize: 15, lineHeight: 1, marginLeft: 1, opacity: 0.65 }}>×</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={onClear}
        style={{ background: 'none', border: 'none', color: '#8A3F28', fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', padding: '5px 2px' }}
      >
        Clear all
      </button>
    </div>
  )
}
