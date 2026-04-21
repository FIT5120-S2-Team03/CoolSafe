/**
 * Medication selection UI. All state lives in the parent (HomePage).
 * Emits selection changes via onMedicationsChange callback.
 * @module MedicationsSection
 */
import { MED_ADVICE } from '../../utils/scoreCalculator'
import { TYPOGRAPHY } from '../../styles/typography'

const MEDICATION_ROWS = [
  ['Blood pressure medication', 'Diuretics / water tablets'],
  ['Antidepressants', 'Diabetes medication'],
  ['Antihistamines', 'Heart medication'],
  ['Antipsychotics', 'None of the above'],
]

const ALL_MEDS = MEDICATION_ROWS.flat()

export default function MedicationsSection({ selectedMedications, onMedicationsChange }) {
  const activeMeds = selectedMedications.filter((m) => m !== 'None of the above')
  const showAdviceCard = activeMeds.length > 0

  function handleToggle(med) {
    if (med === 'None of the above') {
      onMedicationsChange(
        selectedMedications.includes('None of the above') ? [] : ['None of the above']
      )
      return
    }
    const withoutNone = selectedMedications.filter((m) => m !== 'None of the above')
    if (withoutNone.includes(med)) {
      onMedicationsChange(withoutNone.filter((m) => m !== med))
    } else {
      onMedicationsChange([...withoutNone, med])
    }
  }

  return (
    <div
      id="medications-section"
      className="bg-white shadow-sm"
      style={{
        border: '1px solid rgba(195,198,214,0.5)',
        borderRadius: 8,
        padding: 33,
      }}
    >
      <h2 className={`${TYPOGRAPHY.h2} text-[#0056d2]`} style={{ marginBottom: 8 }}>
        💊 Your Medications & Heat Safety
      </h2>
      <p className={TYPOGRAPHY.body} style={{ marginBottom: 24 }}>
        Some medications affect how your body handles heat. Select any you take to get personalised advice.
      </p>

      {/* Chips grid */}
      <div className="grid grid-cols-2 gap-2">
        {ALL_MEDS.map((med) => {
          const selected = selectedMedications.includes(med)
          return (
            <button
              key={med}
              onClick={() => handleToggle(med)}
              style={{
                minHeight: 48,
                width: '100%',
                border: '1px solid #e8e8ea',
                borderRadius: 4,
                padding: '0 24px',
                background: selected ? '#0056d2' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Selection indicator */}
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  border: selected ? 'none' : '1px solid #e8e8ea',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {selected ? '✓' : ''}
              </span>
              <span
                className={TYPOGRAPHY.dataMedium}
                style={{ color: selected ? 'white' : '#1a1c1e', textAlign: 'left' }}
              >
                {med}
              </span>
            </button>
          )
        })}
      </div>

      {/* Advice card */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: showAdviceCard ? 1000 : 0,
          transition: 'max-height 0.4s ease',
          marginTop: showAdviceCard ? 24 : 0,
        }}
      >
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(195,198,214,0.3)',
            borderRadius: 8,
            padding: 28,
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span className={TYPOGRAPHY.h3}>
              Heat Safety Advice for Your Medications
            </span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeMeds.map((med) => (
              <li key={med} className="flex gap-3 items-start">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0056d2',
                    flexShrink: 0,
                    marginTop: 8,
                  }}
                />
                <p className={TYPOGRAPHY.body} style={{ margin: 0 }}>
                  <strong>{med}: </strong>
                  {MED_ADVICE[med]}
                </p>
              </li>
            ))}
          </ul>

          <div
            style={{ borderTop: '1px solid rgba(195,198,214,0.3)', marginTop: 20, paddingTop: 16 }}
          >
            <p className={TYPOGRAPHY.bodySmall} style={{ margin: 0 }}>
              This is general information only. Always follow your doctor's advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
