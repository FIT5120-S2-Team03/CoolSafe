import { useMemo, useState } from 'react'
import { useWeatherData } from '../hooks/useWeatherData'
import Navbar from '../components/layout/Navbar'
import MedicationPanel from '../components/safety/MedicationPanel'
import SafetyQuickLinks from '../components/safety/SafetyQuickLinks'
import SafetyResponsePanel from '../components/safety/SafetyResponsePanel'
import SafetyShareModal from '../components/safety/SafetyShareModal'
import SelectedSymptomChips from '../components/safety/SelectedSymptomChips'
import SymptomGroup from '../components/safety/SymptomGroup'
import { EARLY, RESPONSE, SYMPTOMS, URGENT } from '../data/safetyContent'
import { buildSafetyShareText } from '../utils/safetyShare'
import { INK, MUTED, PAPER } from '../styles/colors'
import { STORAGE_KEYS } from '../constants/storageKeys'

// Amber palette for early signs (caution, not safe)
const EARLY_ACTIVE = '#8A5A12'
const EARLY_SEL_BG = '#FDF3D8'

export default function HealthPage() {
  const { locationName: weatherLocationName } = useWeatherData()
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareText, setShareText] = useState('')

  const [selectedMedications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.medications) || '[]') }
    catch { return [] }
  })

  const maxSeverity = useMemo(() => {
    let top = null
    for (const id of selectedSymptoms) {
      const symptom = SYMPTOMS.find((item) => item.id === id)
      if (!symptom) continue
      if (symptom.severity === '000') return '000'
      top = 'nurse'
    }
    return top
  }, [selectedSymptoms])

  function toggleSymptom(id) {
    setSelectedSymptoms(curr => {
      const next = new Set(curr)
      next.has(id) ? next.delete(id) : next.add(id)
      return [...next]
    })
  }

  function handleShare() {
    function openModal(gpsCoords) {
      const text = buildSafetyShareText({
        maxSeverity,
        selectedMedications,
        selectedSymptoms,
        symptoms: SYMPTOMS,
        gpsCoords,
        locationName: weatherLocationName,
      })
      setShareText(text)
      setShareModalOpen(true)
    }

    const locationSource = localStorage.getItem(STORAGE_KEYS.locationSource)
    if (locationSource !== 'suburb' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => openModal({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => openModal(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      )
    } else {
      openModal(null)
    }
  }

  const response = maxSeverity ? RESPONSE[maxSeverity] : null

  return (
    <div style={{ minHeight: '100vh', background: PAPER }}>
      <style>{`
        @keyframes cs-safety-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cs-sym-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .cs-sym-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(34,30,26,0.09); }
        .cs-res-link { transition: background 0.18s ease, transform 0.18s ease; }
        .cs-res-link:hover { background: #F3ECDC !important; transform: translateY(-1px); }
        .cs-share-btn { transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease; }
        .cs-share-btn:hover { background: rgba(255,255,255,0.95) !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,30,26,0.14) !important; }
        .cs-call-link { transition: filter 0.18s ease, transform 0.18s ease; }
        .cs-call-link:hover { filter: brightness(0.88); transform: translateY(-1px); }
        .cs-chip-btn { transition: opacity 0.15s ease; }
        .cs-chip-btn:hover { opacity: 0.75; }
        .cs-med-expand { overflow: hidden; transition: max-height 0.32s ease, opacity 0.28s ease; }
        .cs-med-tab { transition: background 0.18s ease, color 0.18s ease; }
        .cs-med-tab:hover { opacity: 0.85; }
      `}</style>

      <Navbar />

      <SafetyShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareText={shareText}
        maxSeverity={maxSeverity}
      />

      <main className="cs-health-main" style={{ maxWidth: 'var(--content-width)', margin: '0 auto', padding: 'clamp(100px,12vh,130px) var(--content-gutter) clamp(64px,8vw,100px)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(3rem,6vw,5rem)', fontWeight: 'normal', letterSpacing: '-0.03em', lineHeight: 0.98, color: INK, marginBottom: 14 }}>
            How is your body<br />feeling?
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.55, margin: 0 }}>
            Select any symptoms you're feeling right now. Medication notes appear below if you've added any.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="cs-health-symptom-groups" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SymptomGroup
              title="Early signs" badge="Cool down now"
              badgeStyle={{ background: '#FDF3D8', color: EARLY_ACTIVE, border: '1px solid rgba(138,90,18,0.28)' }}
              groupStyle={{ background: '#FEFAF0', border: '1px solid rgba(212,154,58,0.22)' }}
              symptoms={EARLY} selectedSymptoms={selectedSymptoms} onToggle={toggleSymptom}
              activeColor={EARLY_ACTIVE} selectedBg={EARLY_SEL_BG}
            />
            <SymptomGroup
              title="Urgent signs" badge="Call 000"
              badgeStyle={{ background: '#FFF0EE', color: '#C94B1A', border: '1px solid rgba(201,75,26,0.24)' }}
              groupStyle={{ background: '#FFF8F6', border: '1px solid rgba(201,75,26,0.18)' }}
              symptoms={URGENT} selectedSymptoms={selectedSymptoms} onToggle={toggleSymptom}
              activeColor="#C94B1A" selectedBg="#FFF0EE"
            />
          </div>

          <div className="cs-health-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 32, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <SelectedSymptomChips
                selectedSymptoms={selectedSymptoms}
                symptoms={SYMPTOMS}
                onToggle={toggleSymptom}
                onClear={() => setSelectedSymptoms([])}
              />

              <SafetyResponsePanel
                maxSeverity={maxSeverity}
                response={response}
                onShare={handleShare}
              />

              {selectedMedications.length > 0 && (
                <MedicationPanel selectedMedications={selectedMedications} />
              )}
            </div>

            <SafetyQuickLinks />
          </div>
        </div>
      </main>
    </div>
  )
}
