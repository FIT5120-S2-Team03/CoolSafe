/**
 * Medication selection UI — radio-card style grid.
 * All state lives in the parent (HomePage/modal).
 * @module MedicationsSection
 */

const MEDICATION_ROWS = [
  ['Blood pressure medication', 'Diuretics / water tablets'],
  ['Antidepressants', 'Diabetes medication'],
  ['Antihistamines', 'Heart medication'],
  ['Antipsychotics', 'Opioid pain medication'],
]

const ALL_MEDS = MEDICATION_ROWS.flat()

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
              transition: 'background 0.15s, border-color 0.15s',
              width: '100%',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${selected ? '#1852B4' : '#C5C3BF'}`,
                background: selected ? '#1852B4' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {selected && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
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
