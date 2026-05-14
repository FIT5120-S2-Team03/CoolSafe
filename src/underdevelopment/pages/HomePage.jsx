/**
 * Today / heat risk page  (/today)
 *
 * A regular scrollable editorial page matching the HTML prototype's page-risk design.
 * Sections (in DOM order):
 *   1. Hero        — dynamic slogan + 2×2 weather callout cards
 *   2. Score       — heat-risk score number + gradient slider + breakdown tooltip
 *   3. Three cards — medications, best time window, symptoms check
 *   4. Chart       — hourly temperature chart + morning/midday/evening routine tabs
 *   5. Cool spaces — nearest venue list + map card
 *   6. Symptoms    — symptom selector + action banner (nurse / 000)
 *
 * All data fetching is lifted here; sub-components receive pure props.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import MedicationsSection from '../components/home/MedicationsSection'
import {
  TempChart,
  getWindows,
  todayStr,
} from '../components/home/HourlyForecastStrip'
import { useWeatherData } from '../hooks/useWeatherData'
import { useAirQuality }  from '../hooks/useAirQuality'
import useCoolSpaces      from '../hooks/useCoolSpaces'
import { getRiskLevel, getAqiInfo } from '../utils/riskLevel'
import { calculateHeatSafetyScore } from '../utils/scoreCalculator'
import { getWalkingMinutes } from '../utils/haversine'

// ── Design tokens ────────────────────────────────────────────────────────────

const RULE  = '#E5DCC8'
const PAPER = '#FAF8F5'
const INK   = '#0F0F0F'
const MUTED = '#5A5048'
const FAINT = '#6E6358'
const MAX_W = 1120
const PX    = 'clamp(16px,5vw,40px)'

// Score colour by risk level
const SCORE_COLOR = {
  Low:      '#2A7D4F',
  Moderate: '#B87200',
  High:     '#C94B1A',
  Extreme:  '#8B0000',
}

// UV index derived from risk level (no dedicated API call needed)
const UV_BY_RISK = {
  Low:      { index: 2,  label: 'Low' },
  Moderate: { index: 4,  label: 'Moderate' },
  High:     { index: 7,  label: 'High' },
  Extreme:  { index: 10, label: 'Very High' },
}

// ── Heat band — derived from daily max temperature ────────────────────────────

function heatBand(maxTemp) {
  if (maxTemp == null) return 'mild'
  if (maxTemp >= 35) return 'extreme'
  if (maxTemp >= 30) return 'hot'
  if (maxTemp >= 24) return 'warm'
  return 'mild'
}

// ── Heat copy — all dynamic text keyed to heat band ──────────────────────────

function heatCopy(band) {
  const map = {
    mild: {
      slogan: { before: "You're in the", accent: 'clear today.' },
      desc: "Conditions look mild today. Your plan will adjust if medicines add heat sensitivity.",
      cardTitle: 'Most of today should feel comfortable.',
      windowLabel: '',
      cardDesc: (m) => `Conditions stay around ${m != null ? Math.round(m) : '--'}° through the day. Use the hourly chart if you want to pick the most pleasant time for a walk or errands.`,
      baseVerdict: 'All clear',
      routine: { morning: 'Start steady and check the day.', midday: 'Keep the middle of the day comfortable.', evening: 'Wind down and reset your space.' },
    },
    warm: {
      slogan: { before: 'Take it', accent: 'easy today.' },
      desc: "The day is warming up. Your plan will adjust if medicines add heat sensitivity.",
      cardTitle: 'A comfortable morning, warmer later.',
      windowLabel: 'am good for errands',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. The earlier window may be easier for light errands or time outside.`,
      baseVerdict: 'Mostly safe',
      routine: { morning: 'Use the easier morning window.', midday: 'Pace yourself through the warmer hours.', evening: 'Let the day ease down.' },
    },
    hot: {
      slogan: { before: 'Take it', accent: 'easy today.' },
      desc: "Heat is expected to build today. Medicines can change what extra care you need.",
      cardTitle: 'Use the cooler morning window.',
      windowLabel: 'am best for outdoors',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. Plan walks, errands, or laundry on the line earlier if you can.`,
      baseVerdict: 'Be careful',
      routine: { morning: 'Use the cooler window. Keep it easy.', midday: 'Stay steady while heat builds.', evening: 'Things ease. So can you.' },
    },
    extreme: {
      slogan: { before: 'Stay', accent: 'indoors today.' },
      desc: "High heat can become risky quickly. Medicines can change what extra care you need.",
      cardTitle: 'Morning is your safest window.',
      windowLabel: 'am safest for essentials',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. Keep outdoor tasks early, short, and only if they are necessary.`,
      baseVerdict: 'Stay indoors',
      routine: { morning: 'Use the safest window for essentials.', midday: 'Stay cool and keep plans simple.', evening: 'Recover gently and prepare for tomorrow.' },
    },
  }
  return map[band] ?? map.mild
}

// ── Best 2-hr morning window (lowest avg apparent temp, 6–10 am) ─────────────

function bestMorningWindow(hourly) {
  if (!hourly) return null
  const today = todayStr()
  const candidates = []
  for (let startH = 6; startH <= 10; startH++) {
    const slots = hourly.time
      .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
      .filter((s) => s.date === today && s.h >= startH && s.h < startH + 2)
    if (!slots.length) continue
    const avg = slots.reduce((sum, s) => sum + s.temp, 0) / slots.length
    candidates.push({ startH, avg })
  }
  if (!candidates.length) return null
  return candidates.reduce((a, b) => a.avg < b.avg ? a : b)
}

// ── Morning / Midday / Evening routine tab content ────────────────────────────

function getPeriodContent(period, band) {
  const content = {
    morning: {
      mild: {
        do: ["Drink water when you wake up — even mild days need hydration.", "Check the hourly chart before planning outdoor time."],
        avoid: ["Don't skip hydration just because the day feels comfortable."],
      },
      warm: {
        do: ["Use this cooler window for errands or a walk.", "Drink water before you leave home."],
        avoid: ["Don't leave outdoor plans until after 11 AM when it warms up."],
      },
      hot: {
        do: ["Run errands or walk before 10 AM.", "Drink water before you leave.", "Know where you'll cool down later."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      extreme: {
        do: ["Only go out if absolutely necessary — keep it brief.", "Drink water before you leave.", "Know your nearest cool space."],
        avoid: ["Don't stay outdoors past 9 AM on extreme days."],
      },
    },
    midday: {
      mild: {
        do: ["Light errands are fine — keep water nearby.", "A short walk or outdoor time is perfectly safe."],
        avoid: ["Avoid prolonged direct sun exposure in the middle of the day."],
      },
      warm: {
        do: ["Stay indoors or find shade during the warmest hours.", "Drink water every hour."],
        avoid: ["Avoid strenuous activity outdoors during midday."],
      },
      hot: {
        do: ["Stay indoors or find a cool space with air conditioning.", "Drink a glass of water every hour.", "Close blinds to keep your home cool."],
        avoid: ["Avoid going outdoors during peak heat hours.", "Don't skip meals — eating helps your body regulate temperature."],
      },
      extreme: {
        do: ["Stay inside all day.", "Drink water every 30 minutes.", "Close all blinds and curtains."],
        avoid: ["Never go outdoors during midday in extreme heat.", "Don't wait to feel thirsty before drinking water."],
      },
    },
    evening: {
      mild: {
        do: ["Open windows for fresh airflow.", "Good time for a walk or time in the garden."],
        avoid: ["Don't forget to check tomorrow's forecast before bed."],
      },
      warm: {
        do: ["Open windows once it cools — check outside air first.", "A light walk is fine after 6 PM."],
        avoid: ["Don't overdo it — ease back into activity gently."],
      },
      hot: {
        do: ["Wait until it cools below 30°C before going outside.", "Open windows once the outside air feels cooler."],
        avoid: ["Phone someone to check in if you're not feeling well."],
      },
      extreme: {
        do: ["Open windows once outside air cools below 28°C.", "Phone someone to check in on how you're feeling."],
        avoid: ["Don't assume it's safe just because the sun has set."],
      },
    },
  }

  const eyebrows = {
    morning: 'Morning · 6–11 am',
    midday: 'Midday · 11 am – 4 pm',
    evening: 'Evening · 4–8 pm',
  }

  return {
    eyebrow: eyebrows[period],
    ...(content[period]?.[band] ?? content[period]?.mild),
  }
}

// Average apparent temperature for a given hour range in today's hourly data
function periodAvg(hourly, fromH, toH) {
  if (!hourly) return null
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
    .filter((s) => s.date === today && s.h >= fromH && s.h < toH)
  if (!slots.length) return null
  return slots.reduce((sum, s) => sum + s.temp, 0) / slots.length
}

// ── Venue type helpers ────────────────────────────────────────────────────────

function venueTypeKind(type = '') {
  const t = type.toLowerCase()
  if (t.includes('gallery') || t.includes('museum')) return 'gallery'
  if (t.includes('park') || t.includes('garden') || t.includes('reserve') || t.includes('informal outdoor')) return 'park'
  if (t.includes('library')) return 'library'
  if (t.includes('shopping') || t.includes('community') || t.includes('centre') || t.includes('retail')) return 'community'
  return 'default'
}

function venueTypeLabel(type = '') {
  const kind = venueTypeKind(type)
  if (kind === 'gallery') return 'Art Gallery / Museum'
  if (kind === 'park') return 'Park / Garden / Reserve'
  if (kind === 'library') return 'Library'
  if (kind === 'community') {
    const t = type.toLowerCase()
    return (t.includes('shopping') || t.includes('retail')) ? 'Shopping Centre' : 'Community Centre'
  }
  return type || 'Public space'
}

const VENUE_KIND_COLOR = {
  gallery:   '#8A3F28',
  park:      '#4A6741',
  library:   '#2A5F7A',
  community: '#7A6B28',
  default:   '#5A5048',
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Symptom definitions ───────────────────────────────────────────────────────

const SYMPTOMS = [
  { id: 'sweating',  label: 'Heavy sweating',            icon: 'water_drop',                    severity: 'nurse' },
  { id: 'headache',  label: 'Headache / Cramps',         icon: 'sentiment_very_dissatisfied',   severity: 'nurse' },
  { id: 'dizziness', label: 'Dizziness / Weakness',      icon: 'airline_seat_recline_normal',   severity: 'nurse' },
  { id: 'dry-skin',  label: 'Dry, hot skin (no sweat)',  icon: 'device_thermostat',             severity: '000'   },
  { id: 'confusion', label: 'Confusion / Slurred speech', icon: 'psychology_alt',               severity: '000'   },
  { id: 'vomiting',  label: 'Vomiting / Fainting',       icon: 'sick',                          severity: '000'   },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const {
    current, hourly, daily, locationName,
    loading, gpsBlocked, requestGps, fetchByPostcode,
    lat, lng,
  } = useWeatherData()

  const { aqi }    = useAirQuality({ lat, lng })
  const { venues } = useCoolSpaces()
  const navigate   = useNavigate()

  // ── local state ──
  const [selectedMedications, setSelectedMedications] = useState([])
  const [showMedModal, setShowMedModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(() => !localStorage.getItem('coolsafe_coords'))
  const [locPostcode, setLocPostcode]   = useState('')
  const [showScoreInfo, setShowScoreInfo] = useState(false)
  const [activePeriod, setActivePeriod] = useState(() => {
    const h = new Date().getHours()
    if (h >= 11 && h < 16) return 'midday'
    if (h >= 16 || h < 6) return 'evening'
    return 'morning'
  })
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set())
  const [toastMsg, setToastMsg] = useState('')
  const scoreInfoRef = useRef(null)
  const toastTimerRef = useRef(null)

  // Close location modal as soon as weather data arrives
  useEffect(() => { if (current) setShowLocModal(false) }, [current])

  // Score tooltip is now hover-based — no click-outside handler needed

  // Toast helper
  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 3000)
  }

  // ── derived values ──
  const currentHour = new Date().getHours()

  const risk    = useMemo(() => current ? getRiskLevel(current.temp) : null, [current])
  const uvInfo  = risk ? UV_BY_RISK[risk.level] : null
  const aqiInfo = aqi != null ? getAqiInfo(aqi) : null

  const scoreData = useMemo(() => {
    if (!current) return null
    return calculateHeatSafetyScore({
      apparentTemp: current.apparentTemp,
      hour:         currentHour,
      medications:  selectedMedications,
    })
  }, [current, currentHour, selectedMedications])

  const score      = scoreData?.score ?? 0
  const riskLabel  = scoreData?.riskLabel ?? { label: 'Loading…', color: SCORE_COLOR.Low }
  const breakdown  = scoreData?.breakdown ?? null
  const scoreColor = SCORE_COLOR[risk?.level] ?? SCORE_COLOR.Low

  // Nearest cool venues sorted by distance
  const nearestVenues = useMemo(() => {
    if (!venues?.length || lat == null || lng == null) return []
    return venues
      .map((v) => {
        const distKm = getDistanceKm(lat, lng, v.lat, v.lng)
        return { ...v, distKm, walkMins: getWalkingMinutes(lat, lng, v.lat, v.lng) }
      })
      .filter((v) => v.distKm != null)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3)
  }, [venues, lat, lng])

  const windows = useMemo(() => getWindows(hourly), [hourly])

  const periodTemps = useMemo(() => ({
    morning: periodAvg(hourly, 6,  11),
    midday:  periodAvg(hourly, 11, 16),
    evening: periodAvg(hourly, 16, 20),
  }), [hourly])

  const band = heatBand(daily?.todayMax)
  const copy = heatCopy(band)

  const bestWindow = useMemo(() => bestMorningWindow(hourly), [hourly])

  const middayApparentTemp = useMemo(() => {
    if (!hourly) return null
    const today = todayStr()
    const slot = hourly.time
      .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
      .find((s) => s.date === today && s.h === 12)
    return slot?.temp ?? null
  }, [hourly])

  // Highest symptom severity across selected symptoms
  const maxSeverity = useMemo(() => {
    let top = null
    for (const id of selectedSymptoms) {
      const s = SYMPTOMS.find((x) => x.id === id)
      if (!s) continue
      if (s.severity === '000') return '000'
      top = 'nurse'
    }
    return top
  }, [selectedSymptoms])

  const toggleSymptom = (id) =>
    setSelectedSymptoms((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ── section wrapper style (shared) ──
  const secInner = { maxWidth: MAX_W, margin: '0 auto', padding: `0 ${PX}` }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
      <style>{`
        @keyframes cs-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes popIn { from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .cs-banner { overflow: hidden; transition: opacity 0.28s ease, max-height 0.28s ease; }
        .cs-banner.hidden-banner { opacity: 0; max-height: 0; pointer-events: none; }
        .cs-banner.shown-banner { opacity: 1; max-height: 300px; }
      `}</style>

      <Navbar locationName={locationName} />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO
          Left:  dynamic slogan + description + med CTA
          Right: 2×2 weather callout grid
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{
          ...secInner,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(24px,4vw,60px)',
          alignItems: 'center',
          padding: `clamp(100px,12vh,132px) ${PX} clamp(48px,6vw,80px)`,
        }}>

          {/* Left — slogan */}
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(3rem,6vw,5rem)',
              fontWeight: 'normal',
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              marginBottom: 24,
            }}>
              {copy.slogan.before}{' '}
              <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>{copy.slogan.accent}</em>
            </h1>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.125rem',
              color: MUTED,
              lineHeight: 1.55,
              maxWidth: 520,
              marginBottom: 28,
            }}>
              {current ? copy.desc : 'Loading today\'s conditions for your area…'}
            </p>

            {/* Medication CTA — terracotta filled when baseline, surface when personalised */}
            <button
              onClick={() => setShowMedModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 48,
                padding: '0.85rem 1.35rem',
                borderRadius: 999,
                border: selectedMedications.length > 0 ? `1px solid ${RULE}` : '1px solid rgba(138,63,40,0.22)',
                background: selectedMedications.length > 0 ? '#fff' : '#8A3F28',
                color: selectedMedications.length > 0 ? '#221E1A' : '#fff',
                fontFamily: 'var(--sans)',
                fontWeight: 700,
                fontSize: 'var(--text-label)',
                cursor: 'pointer',
                boxShadow: selectedMedications.length > 0 ? 'var(--shadow-soft)' : '0 10px 24px -18px rgba(138,63,40,0.9)',
                transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
            >
              {selectedMedications.length > 0
                ? `${selectedMedications.length} medication${selectedMedications.length > 1 ? 's' : ''} added`
                : 'Add your medications for accuracy'}
              <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
            </button>
          </div>

          {/* Right — hero illustration with floating weather callout badges */}
          <div style={{ position: 'relative' }}>
            <img
              src="/risk-hero-indoor.png"
              alt="Older Melburnian staying cool indoors during hot weather"
              style={{ width: '100%', borderRadius: 20, display: 'block', objectFit: 'cover' }}
            />
            <WeatherCallout
              value={current ? `${Math.round(current.apparentTemp)}°C` : '—'}
              label="Feels like"
              badge={risk?.label ?? '—'}
              badgeColor={scoreColor}
              style={{ position: 'absolute', top: '14%', left: '-10%' }}
            />
            <WeatherCallout
              value={uvInfo ? String(uvInfo.index) : '—'}
              label="UV index"
              badge={uvInfo?.label ?? '—'}
              badgeColor="#B87200"
              style={{ position: 'absolute', top: '24%', right: '-12%' }}
            />
            <WeatherCallout
              value={daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '—'}
              label="Peak today"
              badge={daily?.todayMax != null
                ? (daily.todayMax >= 35 ? 'Very hot' : daily.todayMax >= 28 ? 'Hot' : 'Mild')
                : '—'}
              badgeColor="#C94B1A"
              style={{ position: 'absolute', top: '56%', left: '-4%' }}
            />
            <WeatherCallout
              value={aqi != null ? String(aqi) : '—'}
              label="AQI"
              badge={aqiInfo?.label ?? '—'}
              badgeColor="#5B7A8C"
              style={{ position: 'absolute', top: '68%', right: '-13%' }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. SCORE BANNER
          Score number + ? tooltip | verdict | gradient slider
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `28px ${PX}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,4vw,48px)', flexWrap: 'wrap' }}>

            {/* Score number */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>
                Your risk today
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(3.5rem,6vw,4.5rem)', color: scoreColor, lineHeight: 0.8, fontWeight: 'normal' }}>
                  {score}
                </span>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.625rem', color: FAINT, lineHeight: 1, marginBottom: 4 }}>/100</span>

                {/* Score breakdown tooltip */}
                <div
                  style={{ position: 'relative', marginLeft: 4, marginBottom: 4 }}
                  ref={scoreInfoRef}
                  onMouseEnter={() => setShowScoreInfo(true)}
                  onMouseLeave={() => setShowScoreInfo(false)}
                >
                  <button
                    style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${RULE}`, background: 'transparent', cursor: 'pointer', fontSize: '0.6875rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >?</button>

                  {showScoreInfo && breakdown && (
                    <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#111827', borderRadius: 14, padding: '16px 20px', minWidth: 248, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 12 }}>
                        How your score is calculated
                      </div>
                      {[
                        { label: 'Weather heat risk', pts: breakdown.weatherPts },
                        { label: 'Time of day',       pts: breakdown.timePts   },
                        { label: 'Medication risk',   pts: breakdown.medPts    },
                      ].map(({ label, pts }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.07)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                          <span>{label}</span>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{pts >= 0 ? '+' : ''}{pts}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: scoreColor }}>{score}</span>
                      </div>
                      <div style={{ marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                        Weather uses today's forecast. Time of day reflects the current hour.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 30,
                width: 'fit-content',
                marginTop: 6,
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                background: selectedMedications.length > 0 ? '#D9DEC0' : '#F3ECDC',
                color: selectedMedications.length > 0 ? '#4F5A2B' : '#6E6358',
                border: selectedMedications.length > 0 ? '1px solid rgba(79,90,43,0.22)' : `1px solid ${RULE}`,
                fontFamily: 'var(--mono)',
                fontSize: 'var(--text-caption)',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}>
                {selectedMedications.length > 0 ? 'Personalised' : 'Baseline only'}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 70, background: RULE, flexShrink: 0 }} />

            {/* Verdict */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>Verdict</div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(1.625rem,3vw,2rem)', color: scoreColor, lineHeight: 1 }}>
                {copy.baseVerdict}
              </div>
            </div>

            {/* Gradient slider */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ position: 'relative', height: 12, borderRadius: 99, background: 'linear-gradient(to right,#6B7A3A 0%,#D49A3A 50%,#B85A3C 100%)' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${Math.min(95, Math.max(5, score))}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 28, height: 28,
                  background: PAPER,
                  border: `3px solid ${INK}`,
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(34,30,26,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'left 0.5s ease',
                  zIndex: 2,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B85A3C' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A' }}>
                {['Calm', 'Mild', 'Moderate', 'High', 'Extreme'].map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. THREE CARDS
          Medications · Day window · Symptoms check
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            Three things shaping{' '}
            <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>your</em> day.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 520 }}>
            Tap a card to see more. Your details stay private.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <ThingCard
              iconBg="#F2DDB3"
              icon="pill"
              title={selectedMedications.length > 0
                ? `${selectedMedications.length} medication${selectedMedications.length > 1 ? 's' : ''} added`
                : copy.cardTitle}
              desc="Some pills reduce sweating or increase fluid loss. Add them to see if you need extra care."
              extra={selectedMedications.length > 0
                ? <MedChips medications={selectedMedications} />
                : null}
              cta="Review medications"
              ctaIcon="arrow_forward"
              onClick={() => setShowMedModal(true)}
            />
            <ThingCard
              iconBg="#D9DEC0"
              icon="schedule"
              title={copy.cardTitle}
              windowTime={band === 'mild'
                ? 'Easy plans all day.'
                : bestWindow ? `${bestWindow.startH} – ${bestWindow.startH + 2}` : null}
              windowLabel={band === 'mild' ? '' : copy.windowLabel}
              desc={copy.cardDesc(middayApparentTemp)}
              cta="View hourly forecast"
              ctaIcon="arrow_downward"
              onClick={() => document.getElementById('sec-chart')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <ThingCard
              iconBg="#CFDDE5"
              icon="favorite"
              title="Anything off? It's worth checking."
              desc="Heat exhaustion can sneak up on you. Dizziness, an unusual headache, dry skin — these are the body's way of asking for help."
              cta="Run a quick check"
              ctaIcon="arrow_forward"
              onClick={() => document.getElementById('sec-symptoms')?.scrollIntoView({ behavior: 'smooth' })}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. HOURLY CHART  +  ROUTINE TABS
          Left panel: SVG temperature chart + tomorrow outlook bar
          Right panel: Morning / Midday / Evening tabs with contextual advice
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="sec-chart" style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>Your</em> day, looked after.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36 }}>
            Tap a time of day to see your plan.
          </p>

          {/* Two-panel card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            height: 600,
            background: '#fff',
            border: `1px solid ${RULE}`,
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          }}>

            {/* Left — chart */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 32px 24px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: FAINT, marginBottom: 20, flexShrink: 0 }}>
                Hourly Temperature · {locationName ?? 'Melbourne'}
              </div>

              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <TempChart hourly={hourly} />
              </div>

              {/* Tomorrow outlook row */}
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B85A3C', animation: 'cs-pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: INK }}>
                    Tomorrow's Outlook
                  </span>
                </div>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.375rem', color: '#B85A3C' }}>
                  {daily?.tomorrowMax != null ? `Max ${Math.round(daily.tomorrowMax)}°C` : '—'}
                </span>
              </div>
            </div>

            {/* Right — routine tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${RULE}` }}>

              {/* Tab pills */}
              <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderBottom: `1px solid ${RULE}`, flexShrink: 0 }}>
                {['morning', 'midday', 'evening'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: `1.5px solid ${activePeriod === p ? INK : RULE}`,
                      background: activePeriod === p ? INK : 'transparent',
                      color: activePeriod === p ? '#fff' : '#3A3A3A',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: activePeriod === p ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Period gradient banner */}
              <div style={{
                height: 160,
                flexShrink: 0,
                background: activePeriod === 'morning'
                  ? 'linear-gradient(160deg,#FDF5E6,#FAF8F5)'
                  : activePeriod === 'midday'
                  ? 'linear-gradient(160deg,#FDF0EB,#FAF3EE)'
                  : 'linear-gradient(160deg,#EEF3FF,#F0F4FA)',
                borderBottom: `1px solid ${RULE}`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '0 20px 16px',
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT }}>
                  {getPeriodContent(activePeriod, band)?.eyebrow}
                </span>
                <span style={{ background: 'rgba(34,30,26,0.85)', color: '#FAF8F5', borderRadius: 99, padding: '4px 12px', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1rem' }}>
                  {periodTemps[activePeriod] != null ? `~${Math.round(periodTemps[activePeriod])}°` : '—°'}
                </span>
              </div>

              {/* Period advice */}
              <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                {(() => {
                  const c = getPeriodContent(activePeriod, band)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Do this box */}
                      <div style={{ background: 'rgba(74,103,65,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(74,103,65,0.15)' }}>
                        <span style={{ display: 'inline-block', fontFamily: 'var(--sans)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4A6741', background: 'rgba(74,103,65,0.12)', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>Do this</span>
                        {c.do.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: i > 0 ? 5 : 0 }}>
                            <span style={{ color: '#4A6741', lineHeight: 1.4, flexShrink: 0 }}>•</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', color: MUTED, lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      {/* Avoid box */}
                      <div style={{ background: 'rgba(201,75,26,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(201,75,26,0.12)' }}>
                        <span style={{ display: 'inline-block', fontFamily: 'var(--sans)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A3F28', background: 'rgba(201,75,26,0.08)', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>Avoid</span>
                        {c.avoid.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: i > 0 ? 5 : 0 }}>
                            <span style={{ color: '#C94B1A', lineHeight: 1.4, flexShrink: 0 }}>•</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', color: MUTED, lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. COOL SPACES
          List of 3 nearest venues + map card
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            Find a cool space near{' '}
            <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>you.</em>
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 520 }}>
            Cool public places and shaded parks near you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

            {/* Venue list — rich rows matching HTML prototype */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {nearestVenues.length > 0
                ? nearestVenues.map((v, idx) => {
                    const kind = venueTypeKind(v.type ?? '')
                    const typeTag = venueTypeLabel(v.type ?? '')
                    const kindColor = VENUE_KIND_COLOR[kind]
                    const address = [v.address, v.suburb].filter(Boolean).join(', ')
                    return (
                      <div
                        key={v.id ?? v.name}
                        onClick={() => navigate('/map')}
                        style={{ position: 'relative', padding: '16px 36px 16px 40px', borderTop: idx === 0 ? 'none' : `1px solid ${RULE}`, cursor: 'pointer', transition: 'background 0.16s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(243,236,220,0.46)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        {/* Numbered circle */}
                        <div style={{ position: 'absolute', left: 0, top: idx === 0 ? 16 : 18, width: 24, height: 24, borderRadius: '50%', background: kindColor, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.6875rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 8px rgba(34,30,26,0.14)' }}>
                          {idx + 1}
                        </div>
                        {/* Name + distance */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 500, color: INK, lineHeight: 1.24 }}>{v.name}</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: FAINT, flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <strong style={{ fontWeight: 500 }}>{v.distKm != null ? v.distKm.toFixed(1) : '—'}</strong>
                            <span style={{ fontSize: '0.6875rem' }}>km</span>
                          </div>
                        </div>
                        {/* Type pill */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 99, background: `${kindColor}18`, fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, color: kindColor, marginBottom: address ? 4 : 0 }}>
                          {typeTag}
                        </div>
                        {/* Address */}
                        {address && (
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: FAINT, marginTop: 2 }}>{address}</div>
                        )}
                      </div>
                    )
                  })
                : (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#9A9A9A', padding: '20px 0' }}>
                      {lat == null ? 'Set your location to see nearby cool spaces.' : 'Finding nearby cool spaces…'}
                    </div>
                  )
              }
            </div>

            {/* Map card — navigates to full map page */}
            <div
              onClick={() => navigate('/map')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/map') }}
              style={{ height: 320, background: '#E8F0F5', borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: 20 }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(91,122,140,0.04) 0%, rgba(91,122,140,0.22) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 99, padding: '9px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
                Open full map →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. SYMPTOMS CHECKER
          6 toggle buttons → action banner (default / nurse / 000)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="sec-symptoms" style={{ paddingBottom: 'clamp(64px,8vw,100px)' }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            How is{' '}
            <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>your body</em> feeling?
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 520 }}>
            Tap any symptom you feel right now.
          </p>

          {/* Symptom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {SYMPTOMS.map((sym) => {
              const active = selectedSymptoms.has(sym.id)
              const severe = sym.severity === '000'
              const activeColor = severe ? '#C94B1A' : '#1852B4'
              return (
                <button
                  key={sym.id}
                  onClick={() => toggleSymptom(sym.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    gap: 10,
                    background: active ? (severe ? '#FDF0EB' : '#EEF3FF') : '#fff',
                    border: `1px solid ${active ? activeColor : RULE}`,
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = '#8A3F28' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = RULE }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: active ? activeColor : FAINT, lineHeight: 1 }}
                  >{sym.icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 500, color: active ? activeColor : INK, textAlign: 'center', lineHeight: 1.4 }}>
                    {sym.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Clear all button */}
          {selectedSymptoms.size > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <button
                onClick={() => setSelectedSymptoms(new Set())}
                style={{ background: 'none', border: `1px solid ${RULE}`, borderRadius: 99, padding: '6px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#B85A3C', cursor: 'pointer' }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Action banner — all 3 always rendered, CSS transitions on visibility */}
          <div className={`cs-banner ${maxSeverity === null ? 'shown-banner' : 'hidden-banner'}`} style={{ background: '#F3ECDC', border: `1px solid ${RULE}`, borderRadius: 20, padding: '20px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED }}>
            Select any symptoms above to see recommended actions.
          </div>

          <div className={`cs-banner ${maxSeverity === 'nurse' ? 'shown-banner' : 'hidden-banner'}`} style={{ background: '#CFDDE5', border: '1px solid #5B7A8C', borderRadius: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#5B7A8C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>medical_services</span>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.25rem', color: INK, marginBottom: 4 }}>Seek medical advice</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#1E465A', lineHeight: 1.5 }}>
                  These may be signs of heat exhaustion. Rest in a cool place, sip water, and call Nurse-On-Call for guidance.
                </div>
              </div>
            </div>
            <a href="tel:1300606024" style={{ display: 'inline-block', background: '#5B7A8C', color: '#fff', borderRadius: 99, padding: '12px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
              Call 1300 60 60 24
            </a>
          </div>

          <div className={`cs-banner ${maxSeverity === '000' ? 'shown-banner' : 'hidden-banner'}`} style={{ background: '#F1D6CE', border: '1px solid #B85A3C', borderRadius: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#B85A3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'cs-pulse 2s ease-in-out infinite' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>emergency</span>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.25rem', color: INK, marginBottom: 4 }}>Medical Emergency</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#8A3F28', lineHeight: 1.5 }}>
                  These may be critical signs of heat stroke. Do not wait. Call emergency services immediately.
                </div>
              </div>
            </div>
            <a href="tel:000" style={{ display: 'inline-block', background: '#B85A3C', color: '#fff', borderRadius: 99, padding: '12px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
              Call 000 Now
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LOCATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showLocModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1)' }}>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1852B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-3 7-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
            </div>

            <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.625rem', color: INK, textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Where are you?
            </h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.55, marginBottom: 24 }}>
              We need your location to show nearby cool spaces and personalise your heat risk.
            </p>

            <button
              onClick={() => { setShowLocModal(false); requestGps() }}
              style={{ width: '100%', background: '#1852B4', color: '#fff', border: 'none', borderRadius: 12, padding: 15, fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
            >
              Use my current location
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E3DF' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#9C9A96' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E5E3DF' }} />
            </div>

            <form
              style={{ display: 'flex', gap: 8 }}
              onSubmit={(e) => { e.preventDefault(); if (!locPostcode.trim()) return; setShowLocModal(false); fetchByPostcode(locPostcode.trim()) }}
            >
              <input
                type="text"
                value={locPostcode}
                onChange={(e) => setLocPostcode(e.target.value)}
                placeholder="Enter postcode (e.g. 3000)"
                style={{ flex: 1, border: '1.5px solid #E5E3DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: INK, outline: 'none', background: '#FAFAF9' }}
              />
              <button
                type="submit"
                style={{ background: INK, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEDICATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: INK,
          color: '#FAF8F5',
          fontFamily: 'var(--sans)',
          fontSize: 'var(--text-label)',
          fontWeight: 500,
          padding: '12px 22px',
          borderRadius: 10,
          zIndex: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'toastIn 0.22s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {showMedModal && (
        <div
          onClick={() => setShowMedModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: PAPER, borderRadius: 20, padding: '20px 28px 28px', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', animation: 'popIn .25s cubic-bezier(.34,1.56,.64,1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DDDBD7' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.625rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                Find your heat profile
              </span>
              <button
                onClick={() => {
                  setShowMedModal(false)
                  const cnt = selectedMedications.length
                  showToast(cnt > 0 ? `Score updated — ${cnt} medication${cnt > 1 ? 's' : ''} saved` : 'Medications cleared — showing weather-only score')
                }}
                style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}
              >×</button>
            </div>

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>
              Tell us what medications you take for personalised heat advice.
            </p>

            <MedicationsSection
              selectedMedications={selectedMedications}
              onMedicationsChange={setSelectedMedications}
            />

            <button
              onClick={() => setSelectedMedications([])}
              style={{ background: 'none', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#1852B4', cursor: 'pointer', padding: '14px 0 6px', textDecoration: 'underline', display: 'block' }}
            >
              Clear all choices
            </button>

            <button
              onClick={() => {
                setShowMedModal(false)
                const cnt = selectedMedications.length
                showToast(cnt > 0 ? `Score updated — ${cnt} medication${cnt > 1 ? 's' : ''} saved` : 'Medications cleared — showing weather-only score')
              }}
              style={{ width: '100%', background: INK, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: '-0.2px' }}
            >
              See my heat profile
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Floating weather callout badge used in the hero illustration */
function WeatherCallout({ value, label, badge, badgeColor, style: extraStyle }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${RULE}`,
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: '0 4px 20px rgba(34,30,26,0.10)',
      minWidth: 110,
      ...extraStyle,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.375rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: `${badgeColor}18`, fontFamily: "'DM Sans', sans-serif", fontSize: '0.625rem', fontWeight: 600, color: badgeColor, alignSelf: 'flex-start' }}>
        {badge}
      </span>
    </div>
  )
}

/** One of the three summary cards in the "Three things" section */
function ThingCard({ icon, iconBg, title, desc, extra, cta, ctaIcon = 'arrow_forward', onClick, windowTime, windowLabel }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, cursor: 'pointer', transition: 'border-color 0.18s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8A3F28' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE }}
    >
      <div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: INK }}>{icon}</span>
        </div>
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.25rem', color: INK, lineHeight: 1.15, marginBottom: windowTime ? 0 : 16, fontWeight: 'normal' }}>
          {title}
        </h3>
        {windowTime && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.75rem,2.5vw,2.25rem)', color: INK, lineHeight: 1 }}>{windowTime}</span>
            {windowLabel && <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', color: FAINT }}>{windowLabel}</span>}
          </div>
        )}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: MUTED, lineHeight: 1.5 }}>
          {desc}
        </p>
        {extra && <div style={{ marginTop: 12 }}>{extra}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 500, color: INK }}>
        {cta}
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ctaIcon}</span>
      </div>
    </div>
  )
}

/** Inline chips showing each selected medication name */
function MedChips({ medications }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {medications.map((med) => (
        <span
          key={med}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 99,
            background: 'rgba(138,63,40,0.08)',
            border: '1px solid rgba(138,63,40,0.18)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#8A3F28',
            lineHeight: 1.4,
          }}
        >
          {med}
        </span>
      ))}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const headingStyle = {
  fontFamily: 'var(--serif)',
  fontSize: 'var(--text-section)',
  fontWeight: 'normal',
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
  color: INK,
  marginBottom: 10,
}
