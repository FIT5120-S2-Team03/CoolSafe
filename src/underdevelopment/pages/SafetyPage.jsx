import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

const RULE = '#E5DCC8'
const PAPER = '#FAF8F5'
const INK = '#0F0F0F'
const MUTED = '#5A5048'

const SYMPTOMS = [
  { id: 'sweating',  label: 'Heavy sweating',             desc: 'Sweat soaking clothes',        icon: 'water_drop',                  severity: 'nurse' },
  { id: 'headache',  label: 'Headache / Cramps',          desc: 'Muscle aches, throbbing head', icon: 'sentiment_very_dissatisfied', severity: 'nurse' },
  { id: 'dizziness', label: 'Dizziness / Weakness',       desc: 'Lightheaded when standing',    icon: 'airline_seat_recline_normal', severity: 'nurse' },
  { id: 'dry-skin',  label: 'Dry, hot skin',              desc: "No sweat though it's hot",     icon: 'device_thermostat',           severity: '000'   },
  { id: 'confusion', label: 'Confusion / Slurred speech', desc: 'Trouble thinking clearly',     icon: 'psychology_alt',              severity: '000'   },
  { id: 'vomiting',  label: 'Vomiting / Fainting',        desc: 'Throwing up, passing out',     icon: 'sick',                        severity: '000'   },
]

const MED_LEVEL = {
  'Heart medication':          'high',
  'Antipsychotics':            'high',
  'Blood pressure medication': 'moderate',
  'Diuretics / water tablets': 'moderate',
  'Antidepressants':           'moderate',
  'Diabetes medication':       'moderate',
  'Antihistamines':            'mild',
  'Pain relievers (NSAIDs)':   'mild',
}

const LEVEL_META = {
  high:     { label: 'Higher',   sortOrder: 0, color: '#C94B1A', bg: '#FFF0EE', border: 'rgba(201,75,26,0.28)' },
  moderate: { label: 'Moderate', sortOrder: 1, color: '#B87200', bg: '#FFF8EC', border: 'rgba(184,114,0,0.28)'  },
  mild:     { label: 'Mild',     sortOrder: 2, color: '#2A7D4F', bg: '#EDF5EE', border: 'rgba(42,125,79,0.28)'  },
}

const MED_ADVICE = {
  'Blood pressure medication': 'May affect circulation. Move slowly, rest often, and watch for dizziness.',
  'Diuretics / water tablets': 'Can increase fluid loss. Sip water regularly and avoid long periods outside.',
  'Antidepressants':           'Some affect sweating or temperature control. Take heat symptoms seriously.',
  'Diabetes medication':       'Heat can affect blood sugar and medicine storage. Check levels more often.',
  'Antihistamines':            'Some can reduce sweating, making overheating easier to miss. Drink water on a schedule.',
  'Heart medication':          'May affect circulation. Keep activity gentle and seek advice if you feel unwell.',
  'Antipsychotics':            'Can affect how your body controls temperature. Stay cool and avoid strenuous activity.',
  'Pain relievers (NSAIDs)':   'Take care with dehydration. Drink water and follow the label or doctor advice.',
}

const RESPONSE = {
  nurse: {
    status:   'HEAT EXHAUSTION SIGNS',
    headline: 'Rest and take care.',
    bg: '#CFDDE5', border: '#7A9BAD', iconBg: '#2A5C72', icon: 'medical_services', accent: '#1E465A',
    primaryLabel:    'Find a cool space',
    primaryHref:     '/map',
    primaryIsRoute:  true,
    primaryBg:       '#2A7D4F',
    secondaryCallLabel: 'Call 1300 60 60 24',
    secondaryCallHref:  'tel:1300606024',
    whileYouWait: [
      "Stop what you're doing. Sit or lie down somewhere cool.",
      'Sip water slowly. Avoid alcohol and sugary drinks.',
      'Loosen clothing and use a fan or cool cloth.',
    ],
    avoid: [
      "Don't ignore symptoms that keep getting worse.",
      "Don't return to any physical activity today.",
    ],
  },
  '000': {
    status:   'CALL 000 NOW',
    headline: 'This needs emergency help.',
    bg: '#F1D6CE', border: '#C4705A', iconBg: '#C94B1A', icon: 'emergency', accent: '#7A2A18',
    primaryLabel:    'Call 000',
    primaryHref:     'tel:000',
    primaryIsRoute:  false,
    primaryBg:       '#C94B1A',
    secondaryCallLabel: null,
    secondaryCallHref:  null,
    whileYouWait: [
      'Call 000 immediately.',
      'Get into air-conditioning or shade right now.',
      'Apply cool wet cloths to skin while waiting for help.',
    ],
    avoid: [
      "Don't give food or water if confused, fainting, or vomiting.",
      "Don't leave the person alone.",
    ],
  },
}

const EARLY  = SYMPTOMS.filter(s => s.severity === 'nurse')
const URGENT = SYMPTOMS.filter(s => s.severity === '000')

// Amber palette for early signs (caution, not safe)
const EARLY_ACTIVE = '#8A5A12'
const EARLY_SEL_BG = '#FDF3D8'

// ─────────────────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [shareToast, setShareToast] = useState(false)

  const [selectedMedications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coolsafe_medications') || '[]') }
    catch { return [] }
  })

  const maxSeverity = useMemo(() => {
    let top = null
    for (const id of selectedSymptoms) {
      const s = SYMPTOMS.find(x => x.id === id)
      if (!s) continue
      if (s.severity === '000') return '000'
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
    const locationName = localStorage.getItem('cs_location') || ''
    const symptomLabels = selectedSymptoms
      .map(id => SYMPTOMS.find(s => s.id === id))
      .filter(Boolean)
      .map(s => `${s.label} (${s.desc})`)

    let text = maxSeverity === '000'
      ? '🚨 I need emergency help right now.\n\n'
      : "⚠️ I'm not feeling well from the heat.\n\n"

    if (locationName) text += `📍 I'm at: ${locationName}, VIC\n`
    text += `Symptoms: ${symptomLabels.join('; ')}\n`
    if (selectedMedications.length > 0) {
      text += `My medications: ${selectedMedications.join(', ')}\n`
    }
    text += maxSeverity === '000'
      ? '\nPlease call 000 or come to me immediately.'
      : "\nI'm resting in a cool place. Please check on me."

    if (navigator.share) {
      navigator.share({ title: 'CoolSafer — My Condition', text })
    } else {
      navigator.clipboard.writeText(text)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    }
  }

  const resp = maxSeverity ? RESPONSE[maxSeverity] : null

  return (
    <div style={{ minHeight: '100vh', background: PAPER }}>
      <style>{`
        @keyframes cs-safety-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cs-toast-in  { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
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

      {shareToast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#221E1A', color: '#fff', padding: '10px 22px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600, zIndex: 600, animation: 'cs-toast-in 0.25s ease', whiteSpace: 'nowrap' }}>
          Copied to clipboard
        </div>
      )}

      <main style={{ maxWidth: 'var(--content-width)', margin: '0 auto', padding: 'clamp(100px,12vh,130px) var(--content-gutter) clamp(64px,8vw,100px)' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(3rem,6vw,5rem)', fontWeight: 'normal', letterSpacing: '-0.03em', lineHeight: 0.98, color: INK, marginBottom: 14 }}>
            How is your body<br />feeling?
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.55, margin: 0 }}>
            Select any symptoms you're feeling right now. Your medication heat risks appear below.
          </p>
        </div>

        {/* ── Vertical stack ── */}
        <div style={{ display: 'grid', gap: 18 }}>

          {/* ── Full-width symptom groups ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SymptomGroup
              title="Early signs" badge="Manage at home"
              badgeStyle={{ background: '#FDF3D8', color: EARLY_ACTIVE, border: '1px solid rgba(138,90,18,0.28)' }}
              groupStyle={{ background: '#FEFAF0', border: '1px solid rgba(212,154,58,0.22)' }}
              symptoms={EARLY} selectedSymptoms={selectedSymptoms} onToggle={toggleSymptom}
              activeColor={EARLY_ACTIVE} selectedBg={EARLY_SEL_BG}
            />
            <SymptomGroup
              title="Urgent signs" badge="Call for help"
              badgeStyle={{ background: '#FFF0EE', color: '#C94B1A', border: '1px solid rgba(201,75,26,0.24)' }}
              groupStyle={{ background: '#FFF8F6', border: '1px solid rgba(201,75,26,0.18)' }}
              symptoms={URGENT} selectedSymptoms={selectedSymptoms} onToggle={toggleSymptom}
              activeColor="#C94B1A" selectedBg="#FFF0EE"
            />
          </div>

          {/* ── 2-col: status+meds | sidebar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 32, alignItems: 'start' }}>

          {/* ── Left column: chips + status + medication ── */}
          <div style={{ display: 'grid', gap: 18 }}>

            {/* Selected symptom chips + Clear all */}
            {selectedSymptoms.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {selectedSymptoms.map(id => {
                  const s = SYMPTOMS.find(x => x.id === id)
                  if (!s) return null
                  const isUrgent = s.severity === '000'
                  return (
                    <button
                      key={id}
                      type="button"
                      className="cs-chip-btn"
                      onClick={() => toggleSymptom(id)}
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
                      {s.label}
                      <span style={{ fontSize: 15, lineHeight: 1, marginLeft: 1, opacity: 0.65 }}>×</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setSelectedSymptoms([])}
                  style={{ background: 'none', border: 'none', color: '#8A3F28', fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', padding: '5px 2px' }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Status panel */}
            {!resp ? (
              <div key="default" style={{ background: '#F3ECDC', border: `1px solid ${RULE}`, borderRadius: 22, padding: '28px', display: 'flex', alignItems: 'flex-start', gap: 24, animation: 'cs-safety-in 0.25s ease' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Awaiting your check-in
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-sm)', fontWeight: 'normal', color: INK, margin: '0 0 10px', lineHeight: 1.05 }}>
                    No symptoms<br />selected yet.
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.55, margin: 0 }}>
                    Tap anything you feel above to see exactly what to do next.
                  </p>
                </div>
                <svg width="80" height="80" viewBox="0 0 88 88" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}>
                  <circle cx="44" cy="44" r="40" stroke="#C8B98A" strokeWidth="1" fill="#F8F0DC" />
                  <polyline points="4,44 22,44 28,30 36,58 44,20 52,60 58,36 66,44 84,44" stroke="#8A7A56" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            ) : (
              <div key={maxSeverity} style={{ background: resp.bg, border: `1.5px solid ${resp.border}`, borderRadius: 22, padding: '24px 28px', animation: 'cs-safety-in 0.25s ease' }}>

                {/* Status badge pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.45)', border: `1px solid ${resp.border}`, borderRadius: 99, padding: '5px 12px 5px 9px', marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: resp.accent }}>{resp.icon}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: resp.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {resp.status}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-xs)', fontWeight: 'normal', color: INK, margin: '0 0 18px' }}>
                  {resp.headline}
                </h3>

                {/* White sub-cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div style={{ background: 'rgba(255,255,255,0.60)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: resp.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      While you wait
                    </div>
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                      {resp.whileYouWait.map((step, i) => (
                        <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: resp.iconBg, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: INK, lineHeight: 1.45 }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.60)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: resp.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Don't
                    </div>
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                      {resp.avoid.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: resp.iconBg, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: INK, lineHeight: 1.45 }}>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Primary action + Share */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {resp.primaryIsRoute ? (
                    <Link
                      to={resp.primaryHref}
                      className="cs-call-link"
                      style={{ flex: 1, display: 'block', textAlign: 'center', background: resp.primaryBg, color: '#fff', borderRadius: 99, padding: '10px 20px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, textDecoration: 'none' }}
                    >
                      {resp.primaryLabel}
                    </Link>
                  ) : (
                    <a
                      href={resp.primaryHref}
                      className="cs-call-link"
                      style={{ flex: 1, display: 'block', textAlign: 'center', background: resp.primaryBg, color: '#fff', borderRadius: 99, padding: '10px 20px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, textDecoration: 'none' }}
                    >
                      {resp.primaryLabel}
                    </a>
                  )}
                  <button
                    onClick={handleShare}
                    className="cs-share-btn"
                    style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.80)', border: `1.5px solid ${resp.border}`, borderRadius: 99, padding: '9px 16px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600, color: resp.accent, cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
                    Share my condition
                  </button>
                </div>

                {/* Secondary call link (nurse state only) */}
                {resp.secondaryCallLabel && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: resp.accent }}>
                      Still feeling unwell?{' '}
                    </span>
                    <a
                      href={resp.secondaryCallHref}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: resp.accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
                    >
                      {resp.secondaryCallLabel}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Medication panel */}
            {selectedMedications.length > 0 && (
              <MedicationPanel selectedMedications={selectedMedications} />
            )}
          </div>

          {/* ── Right sticky sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76, alignSelf: 'start' }}>
            <Link to="/today" className="cs-res-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#fff', border: `1px solid ${RULE}`, borderRadius: 18, textDecoration: 'none', color: INK }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: MUTED, flexShrink: 0 }}>thermostat</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-body)', color: INK, whiteSpace: 'nowrap' }}>Today's heat risk</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED }}>Check your personal score</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: MUTED, flexShrink: 0 }}>arrow_forward</span>
            </Link>

            <Link to="/map" className="cs-res-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#fff', border: `1px solid ${RULE}`, borderRadius: 18, textDecoration: 'none', color: INK }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: MUTED, flexShrink: 0 }}>ac_unit</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-body)', color: INK, whiteSpace: 'nowrap' }}>Find cool spaces</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED }}>Libraries, parks, centres</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: MUTED, flexShrink: 0 }}>arrow_forward</span>
            </Link>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── SymptomGroup ──────────────────────────────────────────────────────────────

function SymptomGroup({ title, badge, badgeStyle, groupStyle, symptoms, selectedSymptoms, onToggle, activeColor, selectedBg }) {
  return (
    <div style={{ borderRadius: 24, padding: '22px 20px', ...groupStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-body-lg)', fontWeight: 'normal', color: INK, margin: 0 }}>
          {title}
        </h2>
        <span style={{ padding: '5px 12px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', ...badgeStyle }}>
          {badge}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: selected ? activeColor : '#6E6358' }}>
                {symptom.icon}
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, color: selected ? activeColor : INK, lineHeight: 1.25, marginBottom: 3 }}>
                  {symptom.label}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED, lineHeight: 1.35, fontWeight: 400 }}>
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

// ── MedicationPanel ───────────────────────────────────────────────────────────

function MedicationPanel({ selectedMedications }) {
  const sorted = [...selectedMedications].sort((a, b) =>
    (LEVEL_META[MED_LEVEL[a] ?? 'mild'].sortOrder) - (LEVEL_META[MED_LEVEL[b] ?? 'mild'].sortOrder)
  )

  const levels = [...new Set(sorted.map(m => MED_LEVEL[m] ?? 'mild'))]
  const showTabs = levels.length > 1

  const [activeTab, setActiveTab] = useState('all')
  const [expanded, setExpanded] = useState(() => new Set(sorted.slice(0, 2)))

  const displayed = activeTab === 'all'
    ? sorted
    : sorted.filter(m => (MED_LEVEL[m] ?? 'mild') === activeTab)

  function toggleEntry(med) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(med) ? next.delete(med) : next.add(med)
      return next
    })
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 22, padding: '22px 24px', boxShadow: '0 1px 8px rgba(34,30,26,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Medication notes
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED }}>
          {selectedMedications.length} in your plan
        </span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-xs)', fontWeight: 'normal', color: INK, margin: '0 0 16px' }}>
        How yours affect heat.
      </h3>

      {showTabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', background: 'rgba(34,30,26,0.04)', padding: 4, borderRadius: 12 }}>
          {['all', ...levels].map(tab => {
            const meta = tab === 'all' ? null : LEVEL_META[tab]
            const active = activeTab === tab
            return (
              <button
                key={tab}
                className="cs-med-tab"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 9, cursor: 'pointer', border: 'none',
                  background: active ? INK : '#fff',
                  color: active ? '#fff' : MUTED,
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.02em',
                }}
              >
                {tab === 'all' ? 'All' : meta.label}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {displayed.map((med) => {
          const level = MED_LEVEL[med] ?? 'mild'
          const meta = LEVEL_META[level]
          const isExpanded = expanded.has(med)
          return (
            <div key={med} style={{ background: '#FFFCF8', border: `1px solid ${RULE}`, borderRadius: 14, padding: '12px 14px' }}>
              <button
                type="button"
                onClick={() => toggleEntry(med)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 8 }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', fontWeight: 700, color: INK }}>{med}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {meta.label}
                  </span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: MUTED, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.28s ease' }}>
                  expand_more
                </span>
              </button>
              <div className="cs-med-expand" style={{ maxHeight: isExpanded ? '160px' : '0', opacity: isExpanded ? 1 : 0 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.5, margin: '10px 0 2px' }}>
                  {MED_ADVICE[med] ?? 'Ask your doctor or pharmacist how this medicine may affect you in hot weather.'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED, lineHeight: 1.45, margin: '12px 0 0', paddingTop: 12, borderTop: `1px solid ${RULE}`, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, marginTop: 1, flexShrink: 0, color: MUTED }}>info</span>
        These notes are general. Keep taking prescribed medicine unless a clinician tells you otherwise.
      </p>
    </div>
  )
}
