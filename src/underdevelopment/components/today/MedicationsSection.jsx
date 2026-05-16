/**
 * Medication selection UI — radio-card style grid.
 * All state lives in the parent (TodayPage/modal).
 * @module MedicationsSection
 */

const MEDICATION_ROWS = [
  ['Blood pressure medication', 'Diuretics / water tablets'],
  ['Antidepressants', 'Diabetes medication'],
  ['Antihistamines', 'Heart medication'],
  ['Antipsychotics', 'Pain relievers (NSAIDs)'],
]

const ALL_MEDS = MEDICATION_ROWS.flat()

const MED_ICONS = {
  'Blood pressure medication': 'favorite',
  'Diuretics / water tablets': 'water_drop',
  Antidepressants: 'psychology',
  'Diabetes medication': 'monitor_heart',
  Antihistamines: 'local_florist',
  'Heart medication': 'cardiology',
  Antipsychotics: 'pill',
  'Pain relievers (NSAIDs)': 'medication',
}

export default function MedicationsSection({ selectedMedications, onMedicationsChange }) {
  function handleToggle(med) {
    if (selectedMedications.includes(med)) {
      onMedicationsChange(selectedMedications.filter((m) => m !== med))
    } else {
      onMedicationsChange([...selectedMedications, med])
    }
  }

  return (
    <div id="medications-section" className="grid grid-cols-2 gap-2">
      {ALL_MEDS.map((med) => {
        const selected = selectedMedications.includes(med)
        return (
          <button
            key={med}
            onClick={() => handleToggle(med)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: selected ? '#EEF3FF' : '#F7F6F4',
              border: `1.5px solid ${selected ? '#1852B4' : '#E5E3DF'}`,
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: selected ? '0 4px 12px rgba(24,82,180,0.08)' : '0 4px 12px rgba(34,30,26,0.02)',
              transition: 'background 0.15s, border-color 0.15s, transform 0.18s ease, box-shadow 0.18s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = selected ? '0 8px 22px rgba(24,82,180,0.12)' : '0 8px 24px rgba(34,30,26,0.07)'
              e.currentTarget.style.borderColor = selected ? '#1852B4' : 'rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = selected ? '0 4px 12px rgba(24,82,180,0.08)' : '0 4px 12px rgba(34,30,26,0.02)'
              e.currentTarget.style.borderColor = selected ? '#1852B4' : '#E5E3DF'
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: selected ? '#1852B4' : '#6E6358', flexShrink: 0 }}
            >
              {MED_ICONS[med] ?? 'pill'}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: selected ? '#1852B4' : '#0F0F0F',
                lineHeight: 1.35,
              }}
            >
              {med}
            </span>
          </button>
        )
      })}
    </div>
  )
}
