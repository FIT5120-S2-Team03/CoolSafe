import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'

const RULE = '#E5DCC8'
const PAPER = '#FAF8F5'
const INK = '#0F0F0F'
const MUTED = '#5A5048'

const SYMPTOMS = [
  { id: 'sweating', label: 'Heavy sweating', icon: 'water_drop', severity: 'nurse' },
  { id: 'headache', label: 'Headache / Cramps', icon: 'sentiment_very_dissatisfied', severity: 'nurse' },
  { id: 'dizziness', label: 'Dizziness / Weakness', icon: 'airline_seat_recline_normal', severity: 'nurse' },
  { id: 'dry-skin', label: 'Dry, hot skin (no sweat)', icon: 'device_thermostat', severity: '000' },
  { id: 'confusion', label: 'Confusion / Slurred speech', icon: 'psychology_alt', severity: '000' },
  { id: 'vomiting', label: 'Vomiting / Fainting', icon: 'sick', severity: '000' },
]

const MED_ADVICE = {
  'Blood pressure medication': 'May affect circulation. Move slowly, rest often, and watch for dizziness.',
  'Diuretics / water tablets': 'Can increase fluid loss. Sip water regularly and avoid long periods outside.',
  Antidepressants: 'Some can affect sweating or temperature control. Take heat symptoms seriously.',
  'Diabetes medication': 'Heat can affect blood sugar and medicine storage. Check levels more often.',
  Antihistamines: 'Some can reduce sweating or make overheating easier to miss.',
  'Heart medication': 'May affect circulation. Keep activity gentle and seek advice if you feel unwell.',
  Antipsychotics: 'Some can affect body temperature control. Stay cool and avoid strenuous activity.',
  'Pain relievers (NSAIDs)': 'Take care with dehydration. Drink water and follow the label or doctor advice.',
}

const DEFAULT_STEPS = [
  'Move to a cooler place if you can.',
  'Sip water slowly.',
  'Rest and check how you feel again in 10 minutes.',
]

export default function SafetyPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [selectedMedications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coolsafe_medications') || '[]')
    } catch {
      return []
    }
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

  const banner = maxSeverity === '000'
    ? {
      key: '000',
      bg: '#F1D6CE',
      border: '#B85A3C',
      iconBg: '#B85A3C',
      icon: 'emergency',
      title: 'Medical Emergency',
      text: 'These may be critical signs of heat stroke. Do not wait. Call emergency services immediately.',
      textColor: '#8A3F28',
      href: 'tel:000',
      cta: 'Call 000 Now',
    }
    : maxSeverity === 'nurse'
      ? {
        key: 'nurse',
        bg: '#CFDDE5',
        border: '#5B7A8C',
        iconBg: '#5B7A8C',
        icon: 'medical_services',
        title: 'Seek medical advice',
        text: 'These may be signs of heat exhaustion. Rest in a cool place, sip water, and call Nurse-On-Call for guidance.',
        textColor: '#1E465A',
        href: 'tel:1300606024',
        cta: 'Call 1300 60 60 24',
      }
      : {
        key: 'default',
        bg: '#F3ECDC',
        border: RULE,
        title: null,
        text: 'Select any symptoms above to see recommended actions.',
        textColor: MUTED,
      }

  const responseSteps = useMemo(() => {
    if (maxSeverity === '000') {
      return [
        'Call 000 now.',
        'Move to shade or air-conditioning while waiting.',
        'Cool the body with wet cloths or a fan if available.',
        'Do not give food or drink if the person is confused, fainting, or vomiting.',
      ]
    }
    if (maxSeverity === 'nurse') {
      return [
        'Stop activity and sit or lie down somewhere cool.',
        'Sip water. Avoid alcohol or very sugary drinks.',
        'Loosen tight clothing and use a fan or cool cloth.',
        'Call Nurse-On-Call if symptoms do not improve soon.',
      ]
    }
    return DEFAULT_STEPS
  }, [maxSeverity])

  function toggleSymptom(id) {
    setSelectedSymptoms((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return [...next]
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: PAPER }}>
      <Navbar />
      <main style={{ width: 'calc(100% - var(--content-gutter) * 2)', maxWidth: 'var(--content-width)', margin: '0 auto', padding: 'clamp(116px,14vh,148px) 0 clamp(64px,8vw,100px)' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(3rem,6vw,5rem)', fontWeight: 'normal', letterSpacing: '-0.03em', lineHeight: 0.98, color: INK, marginBottom: 18 }}>
          How is your body feeling?
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: MUTED, lineHeight: 1.55, marginBottom: 42, maxWidth: 560 }}>
          Tap any symptom you feel right now.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {SYMPTOMS.map((symptom) => {
            const selected = selectedSymptoms.includes(symptom.id)
            const emergency = symptom.severity === '000'
            return (
              <button
                key={symptom.id}
                type="button"
                onClick={() => toggleSymptom(symptom.id)}
                style={{
                  minHeight: 104,
                  borderRadius: 20,
                  border: selected ? `1.5px solid ${emergency ? '#C94B1A' : '#1852B4'}` : `1px solid ${RULE}`,
                  background: selected ? (emergency ? '#FFF0EE' : '#EEF3FF') : '#fff',
                  color: selected ? (emergency ? '#C94B1A' : '#1852B4') : INK,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.16s ease, border-color 0.16s ease, background 0.16s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: selected ? (emergency ? '#C94B1A' : '#1852B4') : '#6E6358' }}>
                  {symptom.icon}
                </span>
                {symptom.label}
              </button>
            )
          })}
        </div>

        {selectedSymptoms.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedSymptoms([])}
            style={{ display: 'block', margin: '0 auto 40px', border: 'none', background: 'transparent', color: '#8A3F28', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Clear all
          </button>
        )}

        <div
          key={banner.key}
          style={{
            background: banner.bg,
            border: `1px solid ${banner.border}`,
            borderRadius: 22,
            padding: banner.title ? '24px 28px' : '20px 24px',
            minHeight: banner.title ? 104 : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: banner.title ? 'space-between' : 'center',
            gap: 20,
            fontFamily: 'var(--font-body)',
            color: banner.textColor,
          }}
        >
          {banner.title ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: banner.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>{banner.icon}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', color: INK, marginBottom: 4 }}>{banner.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: banner.textColor, lineHeight: 1.5 }}>
                    {banner.text}
                  </div>
                </div>
              </div>
              <a href={banner.href} style={{ display: 'inline-block', background: banner.iconBg, color: '#fff', borderRadius: 99, padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                {banner.cta}
              </a>
            </>
          ) : (
            <span>{banner.text}</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedMedications.length > 0 ? 'minmax(0,1.1fr) minmax(320px,0.9fr)' : '1fr', gap: 20, marginTop: 24 }}>
          <section style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 22, padding: '24px 28px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 'normal', color: INK, margin: '0 0 14px' }}>
              What to do now
            </h2>
            <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 10, fontFamily: 'var(--font-body)', fontSize: '1rem', color: MUTED, lineHeight: 1.5 }}>
              {responseSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          {selectedMedications.length > 0 && (
            <section style={{ background: '#F6F1E8', border: `1px solid ${RULE}`, borderRadius: 22, padding: '24px 28px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 800, color: '#6E6358', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Medication notes
              </div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', fontWeight: 'normal', color: INK, margin: '0 0 14px' }}>
                {selectedMedications.length} selected
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {selectedMedications.map((medication) => (
                  <div key={medication} style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, color: INK, marginBottom: 4 }}>
                      {medication}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: MUTED, lineHeight: 1.45, margin: 0 }}>
                      {MED_ADVICE[medication] ?? 'Ask your doctor or pharmacist how this medicine may affect you in hot weather.'}
                    </p>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: MUTED, lineHeight: 1.45, margin: '16px 0 0' }}>
                These notes are general. Keep taking prescribed medicine unless a clinician tells you otherwise.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
