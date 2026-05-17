import MedicationsSection from './MedicationsSection'
import { INK, PAPER, RULE } from '../../styles/colors'
import ModalFrame from '../layout/ModalFrame'

export default function MedicationModal({
  selectedMedications,
  onMedicationsChange,
  onClose,
  onSaved,
}) {
  function handleSave() {
    onClose()
    const cnt = selectedMedications.length
    onSaved(cnt > 0 ? `Score updated — ${cnt} medication${cnt > 1 ? 's' : ''} saved` : 'Medications cleared — showing weather-only score')
  }

  return (
    <ModalFrame
      onClose={onClose}
      overlayStyle={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 24 }}
      panelStyle={{ background: PAPER, borderRadius: 20, padding: '20px 28px 28px', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', animation: 'popIn .25s cubic-bezier(.34,1.56,.64,1)' }}
    >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DDDBD7' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-title)", fontSize: '1.625rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Your medications
          </span>
          <button
            onClick={handleSave}
            style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}
          >×</button>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>
          Select any medications you take regularly. We don't save this data — it's strictly used to calculate your heat risk today.
        </p>

        <MedicationsSection
          selectedMedications={selectedMedications}
          onMedicationsChange={onMedicationsChange}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
          <button
            onClick={() => onMedicationsChange([])}
            style={{ background: 'transparent', border: 'none', fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 500, color: '#8A3F28', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.18s ease', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = INK }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8A3F28' }}
          >
            Clear all
          </button>

          <button
            onClick={handleSave}
            style={{ flex: 1, background: INK, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', boxShadow: '0 4px 16px rgba(15,15,15,0.20)', transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,15,15,0.26)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,15,15,0.20)' }}
          >
            Save & Calculate Risk
          </button>
        </div>
    </ModalFrame>
  )
}
