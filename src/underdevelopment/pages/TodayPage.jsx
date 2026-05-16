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
import { Link, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import Navbar from '../components/layout/Navbar'
import MedicationsSection from '../components/today/MedicationsSection'
import LocationModal from '../components/location/LocationModal'
import { WeatherCallout, ThingCard } from '../components/today/TodayCards'
import {
  TempChart,
  getWindows,
  todayStr,
} from '../components/today/HourlyForecastStrip'
import { useWeatherData } from '../hooks/useWeatherData'
import { useAirQuality }  from '../hooks/useAirQuality'
import useCoolSpaces      from '../hooks/useCoolSpaces'
import { getRiskLevel, getAqiInfo } from '../utils/riskLevel'
import { calculateHeatSafetyScore } from '../utils/scoreCalculator'
import { getWalkingMinutes } from '../utils/haversine'
import {
  CATEGORY_MARKER_COLORS,
  CATEGORY_UI_BACKGROUNDS,
  CATEGORY_UI_COLORS,
  getCategoryFromSubTheme,
} from '../utils/categoryMapping'
import mockLocation from '../data/mockLocation.json'

// ── Design tokens ────────────────────────────────────────────────────────────

const RULE  = '#E5DCC8'
const PAPER = '#FAF8F5'
const INK   = '#0F0F0F'
const MUTED = '#5A5048'
const FAINT = '#6E6358'
const MAX_W = 'var(--content-width)'
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
  Low:      { index: 2,  label: 'Low',       color: '#6B7A3A' },
  Moderate: { index: 4,  label: 'Moderate',  color: '#B87200' },
  High:     { index: 7,  label: 'High',      color: '#C94B1A' },
  Extreme:  { index: 10, label: 'Very High', color: '#8B0000' },
}

const MED_ADVICE = {
  'Blood pressure medication':
    'Some blood pressure medicines can affect circulation and temperature regulation. Watch for dizziness and keep plans gentle in heat.',
  'Diuretics / water tablets':
    'Diuretics can increase fluid loss. Drink regularly and watch for signs of dehydration.',
  Antidepressants:
    'Some antidepressants can affect sweating or temperature control. Take extra care if you feel unusually hot or unwell.',
  'Diabetes medication':
    'Heat can affect blood sugar and some diabetes medicines. Check levels more often and keep medication stored safely.',
  Antihistamines:
    'Some antihistamines can reduce sweating or make overheating easier to miss.',
  'Heart medication':
    'Some heart medicines affect circulation. Avoid exertion in hotter hours and seek medical advice if you feel unwell.',
  Antipsychotics:
    'Some antipsychotic medicines can affect heat regulation or awareness of overheating.',
  'Pain relievers (NSAIDs)':
    'Regular NSAIDs, such as ibuprofen or naproxen, can be harder on the kidneys when fluids are low. Keep hydrated and ask a doctor or pharmacist if you use them often.',
}

const ROUTINE_META = {
  morning: {
    title: 'A lovely window. Use it.',
    bg: 'linear-gradient(180deg,#FAEEDA 0%,#F6E4B7 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <circle cx="320" cy="120" fill="#F2DDB3" r="70" />
        <circle cx="320" cy="120" fill="#D49A3A" r="48" />
        <path d="M0 130 Q80 110 160 125 T320 120 L400 125 L400 160 L0 160 Z" fill="#6B7A3A" />
        <path d="M0 140 Q100 130 200 138 T400 135 L400 160 L0 160 Z" fill="#4F5A2B" />
        <path d="M90 60 Q95 55 100 60 Q105 55 110 60" fill="none" stroke="#221E1A" strokeLinecap="round" strokeWidth="2" />
        <path d="M140 75 Q145 70 150 75 Q155 70 160 75" fill="none" stroke="#221E1A" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
  midday: {
    title: 'Stay cool while heat is loudest.',
    bg: 'linear-gradient(180deg,#FAEEDA 0%,#F6D0BD 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <circle cx="200" cy="60" fill="#FAEEDA" r="44" />
        <circle cx="200" cy="60" fill="#B85A3C" r="32" />
        <g stroke="#B85A3C" strokeLinecap="round" strokeWidth="3">
          <line x1="200" x2="200" y1="0" y2="14" />
          <line x1="140" x2="156" y1="60" y2="60" />
          <line x1="244" x2="260" y1="60" y2="60" />
          <line x1="158" x2="168" y1="18" y2="28" />
          <line x1="242" x2="232" y1="18" y2="28" />
        </g>
        <path d="M0 130 Q50 122 100 130 T200 130 T300 130 T400 130 L400 160 L0 160 Z" fill="#D4783A" />
        <path d="M0 140 Q50 132 100 140 T200 140 T300 140 T400 140 L400 160 L0 160 Z" fill="#A8503E" />
      </svg>
    ),
  },
  evening: {
    title: 'Wind down and reset your space.',
    bg: 'linear-gradient(180deg,#B9B0A1 0%,#8FA3B1 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <path d="M0 0 L400 0 L400 100 L0 100 Z" fill="#B9B0A1" />
        <circle cx="100" cy="50" fill="#FAF6EE" r="22" />
        <circle cx="108" cy="46" fill="#B9B0A1" r="22" />
        <circle cx="280" cy="35" fill="#FAF6EE" r="2" />
        <circle cx="340" cy="55" fill="#FAF6EE" r="1.5" />
        <circle cx="220" cy="25" fill="#FAF6EE" r="1.8" />
        <path d="M0 100 Q60 80 120 95 Q180 75 240 92 Q300 78 360 90 Q380 88 400 95 L400 160 L0 160 Z" fill="#5B7A8C" />
        <path d="M0 120 Q80 105 160 118 T320 115 L400 120 L400 160 L0 160 Z" fill="#3F5564" />
      </svg>
    ),
  },
}

function scoreColour(score) {
  if (score >= 75) return '#B85A3C'
  if (score >= 50) return '#D49A3A'
  return '#6B7A3A'
}

function peakTempBadgeInfo(maxTemp) {
  if (maxTemp == null) return { label: '—', color: FAINT }
  if (maxTemp >= 35) return { label: 'Very hot', color: '#8B0000' }
  if (maxTemp >= 30) return { label: 'Hot', color: '#C94B1A' }
  if (maxTemp >= 24) return { label: 'Warm', color: '#B87200' }
  return { label: 'Mild', color: '#6B7A3A' }
}

function aqiBadgeColor(info) {
  if (!info) return FAINT
  if (info.label === 'Good' || info.label === 'Fair') return '#6B7A3A'
  if (info.label === 'Moderate') return '#B87200'
  if (info.label === 'Poor') return '#C94B1A'
  return '#8B0000'
}

function scoreVerdict(score, hasMed, band) {
  if (!hasMed) return heatCopy(band).baseVerdict
  if (score >= 90 || band === 'extreme') return 'Stay indoors'
  if (score >= 75) return 'Take action'
  if (score >= 50) return 'Be careful'
  return 'Mostly safe'
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
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      warm: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      hot: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      extreme: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
    },
    midday: {
      mild: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      warm: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      hot: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      extreme: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
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
    evening: 'Evening · 4–9 pm',
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

function periodRange(hourly, fromH, toH, fallback) {
  if (!hourly) return fallback
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
    .filter((s) => s.date === today && s.h >= fromH && s.h < toH && Number.isFinite(s.temp))
  if (!slots.length) return fallback
  const temps = slots.map((s) => Math.round(s.temp))
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return min === max ? `${min}°` : `${min}-${max}°`
}

function tomorrowOutlook(maxTemp) {
  if (maxTemp == null) return 'Checking forecast...'
  if (maxTemp >= 35) return 'High risk persists.'
  if (maxTemp >= 30) return 'Warm conditions continue.'
  if (maxTemp >= 24) return 'Milder, but keep checking in.'
  return 'Cooler conditions expected.'
}

// ── Venue type helpers ────────────────────────────────────────────────────────

function venueTypeSource(venueOrType = '') {
  if (typeof venueOrType === 'string') return venueOrType
  return [
    venueOrType.name,
    venueOrType.type,
    venueOrType.category,
    venueOrType.sub_theme,
    venueOrType.subTheme,
    venueOrType.theme,
  ].filter(Boolean).join(' ')
}

function isFountainVenue(venue) {
  return venueTypeSource(venue).toLowerCase().includes('fountain')
}

function venueTypeKind(venueOrType = '') {
  const t = venueTypeSource(venueOrType).toLowerCase()
  if (typeof venueOrType === 'object' && venueOrType !== null) {
    if (venueOrType.category && CATEGORY_MARKER_COLORS[venueOrType.category]) return venueOrType.category
    const mapped = getCategoryFromSubTheme(venueOrType.sub_theme ?? venueOrType.subTheme ?? venueOrType.type)
    if (mapped) return mapped
  }
  if (t.includes('gallery') || t.includes('museum') || t.includes('arts & culture') || t.includes('theatre') || t.includes('cinema')) return 'Arts & Culture'
  if (t.includes('park') || t.includes('garden') || t.includes('reserve') || t.includes('informal outdoor') || t.includes('recreation') || t.includes('aquarium')) return 'Recreation'
  if (t.includes('library') || t.includes('learning') || t.includes('education')) return 'Learning'
  if (t.includes('visitor info') || t.includes('visitor centre') || t.includes('conference') || t.includes('exhibition')) return 'Visitor Info'
  if (t.includes('community') || t.includes('support') || t.includes('public building') || t.includes('hospital')) return 'Community Support'
  return 'default'
}

function venueTypeLabel(venueOrType = '') {
  const source = venueTypeSource(venueOrType)
  const kind = venueTypeKind(venueOrType)
  if (typeof venueOrType === 'object' && venueOrType !== null) {
    const subTheme = venueOrType.sub_theme ?? venueOrType.subTheme ?? venueOrType.type
    if (subTheme) return subTheme
  }
  return kind === 'default' ? (source || 'Public space') : kind
}

const VENUE_KIND_COLOR = {
  ...CATEGORY_UI_COLORS,
  default: '#6E6358',
}

const VENUE_KIND_PILL = {
  'Arts & Culture':    { background: CATEGORY_UI_BACKGROUNDS['Arts & Culture'], color: CATEGORY_UI_COLORS['Arts & Culture'] },
  Recreation:          { background: CATEGORY_UI_BACKGROUNDS.Recreation, color: CATEGORY_UI_COLORS.Recreation },
  Learning:            { background: CATEGORY_UI_BACKGROUNDS.Learning, color: CATEGORY_UI_COLORS.Learning },
  'Community Support': { background: CATEGORY_UI_BACKGROUNDS['Community Support'], color: CATEGORY_UI_COLORS['Community Support'] },
  'Visitor Info':      { background: CATEGORY_UI_BACKGROUNDS['Visitor Info'], color: CATEGORY_UI_COLORS['Visitor Info'] },
  Fountain:            { background: CATEGORY_UI_BACKGROUNDS.Fountain, color: CATEGORY_UI_COLORS.Fountain },
  default:             { background: '#F0EDE8', color: '#5A5048' },
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

export default function TodayPage() {
  const {
    current, hourly, daily, locationName,
    loading, gpsBlocked, requestGps, fetchByPostcode,
    lat, lng,
  } = useWeatherData()

  const { aqi }    = useAirQuality({ lat, lng })
  const { venues } = useCoolSpaces()
  const navigate   = useNavigate()

  // ── local state ──
  const [selectedMedications, setSelectedMedications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coolsafe_medications') || '[]')
    } catch {
      return []
    }
  })
  const [showMedModal, setShowMedModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(() => !mockLocation.enabled && !localStorage.getItem('coolsafe_coords'))
  const [showScoreInfo, setShowScoreInfo] = useState(false)
  const [activePeriod, setActivePeriod] = useState(() => {
    const h = new Date().getHours()
    if (h >= 11 && h < 16) return 'midday'
    if (h >= 16 || h < 6) return 'evening'
    return 'morning'
  })
  const [toastMsg, setToastMsg] = useState('')
  const [activeMedAdvice, setActiveMedAdvice] = useState(null)
  const scoreInfoRef = useRef(null)
  const toastTimerRef = useRef(null)

  // Close location modal as soon as weather data arrives
  useEffect(() => { if (current) setShowLocModal(false) }, [current])

  useEffect(() => {
    if (!selectedMedications.length) setActiveMedAdvice(null)
    else if (!activeMedAdvice || !selectedMedications.includes(activeMedAdvice)) {
      setActiveMedAdvice(selectedMedications[0])
    }
  }, [activeMedAdvice, selectedMedications])

  useEffect(() => {
    localStorage.setItem('coolsafe_medications', JSON.stringify(selectedMedications))
  }, [selectedMedications])

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
  const peakBadge = peakTempBadgeInfo(daily?.todayMax)

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
  const scoreColor = scoreColour(score)
  const canDismissLocationModal = Boolean(locationName || localStorage.getItem('coolsafe_coords'))

  // Nearest cool venues sorted by distance
  const nearestVenues = useMemo(() => {
    if (!venues?.length || lat == null || lng == null) return []
    return venues
      .filter((v) => !isFountainVenue(v))
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
  const hasMedications = selectedMedications.length > 0
  const activeMed = activeMedAdvice && selectedMedications.includes(activeMedAdvice)
    ? activeMedAdvice
    : selectedMedications.find((m) => MED_ADVICE[m])
  const medicationCardTitle = hasMedications
    ? `${selectedMedications.length} medication${selectedMedications.length > 1 ? 's' : ''} in your plan.`
    : 'Tell us your medications for accuracy.'
  const medicationCardDesc = hasMedications
    ? 'See what your medicines may mean in heat, then check how your body is feeling.'
    : 'Some pills reduce sweating or increase fluid loss. Add them to make your score more personal.'
  const heroSlogan = hasMedications
    ? (score >= 75
      ? { before: 'Stay', accent: 'indoors today.' }
      : { before: 'Take it', accent: 'easy today.' })
    : copy.slogan
  const heroAccentColor = hasMedications
    ? (score >= 75 ? '#8A3F28' : score >= 50 ? '#B87200' : '#6B7A3A')
    : band === 'mild'
      ? '#2A7D4F'
      : band === 'warm'
        ? '#6B7A3A'
        : band === 'hot'
          ? '#B87200'
          : '#8A3F28'
  const heroDesc = hasMedications
    ? 'Your medications may add heat risk today. See your personalised plan below.'
    : copy.desc
  const verdict = scoreVerdict(score, hasMedications, band)

  const bestWindow = useMemo(() => bestMorningWindow(hourly), [hourly])

  const middayApparentTemp = useMemo(() => {
    if (!hourly) return null
    const today = todayStr()
    const slot = hourly.time
      .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
      .find((s) => s.date === today && s.h === 12)
    return slot?.temp ?? null
  }, [hourly])

  const periodRanges = useMemo(() => {
    return {
      morning: periodRange(hourly, 6, 11, '17-22°'),
      midday: periodRange(hourly, 11, 16, '24-31°'),
      evening: periodRange(hourly, 16, 20, '20-25°'),
    }
  }, [hourly])

  // ── section wrapper style (shared) ──
  const secInner = { width: '100%', maxWidth: MAX_W, boxSizing: 'border-box', margin: '0 auto', padding: `0 ${PX}` }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
      <style>{`
        @keyframes cs-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes popIn { from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes cs-banner-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cs-banner { animation: cs-banner-in 0.3s ease both; }
        .weather-callout:hover {
          transform: translateY(-3px);
          border-color: rgba(138,63,40,0.34);
          box-shadow: 0 12px 30px rgba(34,30,26,0.14);
        }
      `}</style>

      <Navbar locationName={locationName} onLocationClick={() => setShowLocModal(true)} />

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
              fontFamily: "var(--font-title)",
              fontSize: 'clamp(3rem,6vw,5rem)',
              fontWeight: 'normal',
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              marginBottom: 24,
            }}>
              {heroSlogan.before}{' '}
              <em style={{ fontStyle: 'italic', color: heroAccentColor }}>{heroSlogan.accent}</em>
            </h1>

            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: '1.125rem',
              color: MUTED,
              lineHeight: 1.55,
              maxWidth: 520,
              marginBottom: 28,
            }}>
              {current ? heroDesc : 'Loading today\'s conditions for your area…'}
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
                ? 'Review or edit medications'
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
            <div
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 11px',
                borderRadius: 999,
                background: 'rgba(237,245,238,0.76)',
                border: '1px solid rgba(42,125,79,0.16)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                fontFamily: "var(--font-body)",
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#2A7D4F',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2A7D4F', boxShadow: '0 0 0 4px rgba(42,125,79,0.10)', animation: 'cs-pulse 1.4s ease-in-out infinite' }} />
              Live local data
            </div>
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
              badgeColor={uvInfo?.color ?? FAINT}
              style={{ position: 'absolute', top: '30%', right: '-12%' }}
            />
            <WeatherCallout
              value={daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '—'}
              label="Peak today"
              badge={peakBadge.label}
              badgeColor={peakBadge.color}
              style={{ position: 'absolute', top: '56%', left: '-4%' }}
            />
            <WeatherCallout
              value={aqi != null ? String(aqi) : '—'}
              label="AQI"
              badge={aqiInfo?.label ?? '—'}
              badgeColor={aqiBadgeColor(aqiInfo)}
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
              <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>
                Your risk today
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontFamily: "var(--font-title)", fontSize: 'clamp(3.5rem,6vw,4.5rem)', color: scoreColor, lineHeight: 0.8, fontWeight: 'normal' }}>
                  {score}
                </span>
                <span style={{ fontFamily: "var(--font-title)", fontSize: '1.625rem', color: FAINT, lineHeight: 1, marginBottom: 4 }}>/100</span>

                {/* Score breakdown tooltip */}
                <div
                  style={{ position: 'relative', marginLeft: 4, marginBottom: 4 }}
                  ref={scoreInfoRef}
                  onMouseEnter={() => setShowScoreInfo(true)}
                  onMouseLeave={() => setShowScoreInfo(false)}
                >
                  <button
                    style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${RULE}`, background: 'transparent', cursor: 'pointer', fontSize: '0.9375rem', fontFamily: "var(--font-body)", fontWeight: 700, color: FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >?</button>

                  {showScoreInfo && breakdown && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', background: '#FFFCF6', color: INK, border: `1px solid ${RULE}`, borderRadius: 16, padding: '15px 18px', minWidth: 280, boxShadow: '0 18px 44px rgba(34,30,26,0.16)', zIndex: 100 }}>
                      <div style={{ position: 'absolute', top: -7, left: '50%', width: 14, height: 14, transform: 'translateX(-50%) rotate(45deg)', background: '#FFFCF6', borderLeft: `1px solid ${RULE}`, borderTop: `1px solid ${RULE}` }} />
                      <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, textAlign: 'center', marginBottom: 10, position: 'relative' }}>
                        How your score is calculated
                      </div>
                      {[
                        { label: 'Weather heat risk', pts: breakdown.weatherPts },
                        { label: 'Time of day',       pts: breakdown.timePts   },
                        { label: 'Medication risk',   pts: breakdown.medPts    },
                      ].map(({ label, pts }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${RULE}`, fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, position: 'relative' }}>
                          <span>{label}</span>
                          <span style={{ fontWeight: 700, color: INK }}>{pts >= 0 ? '+' : ''}{pts}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${RULE}`, fontFamily: "var(--font-body)", fontSize: '1rem', color: INK, fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: scoreColor }}>{score}</span>
                      </div>
                      <div style={{ marginTop: 10, fontFamily: "var(--font-body)", fontSize: '1rem', color: FAINT, lineHeight: 1.35 }}>
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
                marginTop: 14,
                padding: '0.3rem 1rem',
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
              <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>Verdict</div>
              <div style={{ fontFamily: "var(--font-title)", fontStyle: 'italic', fontSize: 'clamp(1.625rem,3vw,2rem)', color: scoreColor, lineHeight: 1 }}>
                {verdict}
              </div>
            </div>

            {/* Gradient slider */}
            <div style={{ flex: '1 1 300px', minWidth: 180 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A' }}>
                {['Calm', 'Mild', 'Moderate', 'High', 'Extreme'].map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>

            <Link
              to="/safety"
              style={{
                flexShrink: 0,
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 42,
                padding: '0 4px',
                color: '#1857B8',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Not feeling well? Check now
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. THREE CARDS
          Day window · Cool spaces · Medications
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            Your {score} today, in three steps.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 520 }}>
            Tap a card to see more. Your details stay private.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <ThingCard
              iconBg="#D9DEC0"
              icon="schedule"
              title={copy.cardTitle}
              windowTime={band === 'mild'
                ? null
                : bestWindow ? `${bestWindow.startH} – ${bestWindow.startH + 2}` : null}
              windowLabel={band === 'mild' ? '' : copy.windowLabel}
              desc={band === 'mild'
                ? `Easy plans all day. ${copy.cardDesc(middayApparentTemp)}`
                : copy.cardDesc(middayApparentTemp)}
              cta="View hourly forecast"
              ctaIcon="arrow_downward"
              onClick={() => document.getElementById('sec-chart')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <ThingCard
              iconBg="#CFDDE5"
              icon="location_on"
              title="Find cool spaces near you."
              desc="Air-conditioned libraries, community centres, and shaded parks across Melbourne."
              cta="See nearby spaces"
              ctaIcon="arrow_downward"
              onClick={() => document.getElementById('sec-cool-spaces')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <ThingCard
              iconBg="#F2DDB3"
              icon="pill"
              title={medicationCardTitle}
              desc={medicationCardDesc}
              cta="Check medications and symptoms"
              ctaIcon="arrow_forward"
              onClick={() => navigate('/safety')}
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
            Your day, looked after.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36 }}>
            Tap a time of day to see your plan.
          </p>

          {/* Two-panel card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            minHeight: 570,
            background: '#fff',
            border: `1px solid ${RULE}`,
            borderRadius: 32,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          }}>

            {/* Left — chart */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '30px 32px 24px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: FAINT, marginBottom: 12, flexShrink: 0 }}>
                Hourly Temperature · {locationName ?? 'Melbourne'}
              </div>

              <div style={{ flex: 1, minHeight: 300, position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                <TempChart hourly={hourly} />
              </div>

              {/* Tomorrow outlook row */}
              <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B85A3C', animation: 'cs-pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 500, color: INK }}>
                    Tomorrow's Outlook: {tomorrowOutlook(daily?.tomorrowMax)}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-title)", fontSize: '1.65rem', color: daily?.tomorrowMax != null ? scoreColour(Math.min(100, daily.tomorrowMax * 2)) : '#B85A3C', whiteSpace: 'nowrap' }}>
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
                    onMouseEnter={(e) => {
                      if (activePeriod !== p) {
                        e.currentTarget.style.borderColor = '#8A3F28'
                        e.currentTarget.style.background = '#FFFCF6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activePeriod !== p) {
                        e.currentTarget.style.borderColor = RULE
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 99,
                      border: `1px solid ${activePeriod === p ? (p === 'morning' ? '#6B7A3A' : p === 'midday' ? '#B85A3C' : '#5B7A8C') : RULE}`,
                      background: activePeriod === p ? (p === 'morning' ? '#6B7A3A' : p === 'midday' ? '#B85A3C' : '#5B7A8C') : 'transparent',
                      color: activePeriod === p ? '#fff' : MUTED,
                      fontFamily: "var(--font-body)",
                      fontSize: 'var(--text-caption)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Period gradient banner */}
              <div style={{
                height: 210,
                flexShrink: 0,
                background: ROUTINE_META[activePeriod].bg,
                borderBottom: `1px solid ${RULE}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.4s',
              }}>
                {ROUTINE_META[activePeriod].svg}
                <span style={{ position: 'absolute', top: 16, left: 16, background: '#fff', borderRadius: 99, padding: '6px 14px', fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, boxShadow: '0 2px 8px rgba(34,30,26,0.08)' }}>
                  {getPeriodContent(activePeriod, band)?.eyebrow.replace('Morning · ', '').replace('Midday · ', '').replace('Evening · ', '')}
                </span>
                <span style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(34,30,26,0.85)', color: '#FAF8F5', borderRadius: 99, padding: '5px 14px', fontFamily: "var(--font-title)", fontSize: '1rem', boxShadow: '0 2px 10px rgba(34,30,26,0.14)' }}>
                  {periodRanges[activePeriod]}
                </span>
              </div>

              {/* Period advice */}
              <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                {(() => {
                  const c = getPeriodContent(activePeriod, band)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', lineHeight: 1.1, fontWeight: 'normal', color: INK, marginBottom: 4 }}>
                        {copy.routine[activePeriod] || ROUTINE_META[activePeriod].title}
                      </h3>
                      {/* Do this box */}
                      <div style={{ background: 'rgba(74,103,65,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(74,103,65,0.15)' }}>
                        <span style={{ display: 'inline-block', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4A6741', background: 'rgba(74,103,65,0.12)', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>Do this</span>
                        {c.do.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: i > 0 ? 5 : 0 }}>
                            <span style={{ color: '#4A6741', lineHeight: 1.4, flexShrink: 0 }}>•</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '1rem', color: MUTED, lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      {/* Avoid box */}
                      <div style={{ background: 'rgba(201,75,26,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(201,75,26,0.12)' }}>
                        <span style={{ display: 'inline-block', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A3F28', background: 'rgba(201,75,26,0.08)', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>Avoid</span>
                        {c.avoid.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: i > 0 ? 5 : 0 }}>
                            <span style={{ color: '#C94B1A', lineHeight: 1.4, flexShrink: 0 }}>•</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '1rem', color: MUTED, lineHeight: 1.4 }}>{item}</span>
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
      <section id="sec-cool-spaces" style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...secInner, padding: `clamp(48px,6vw,80px) ${PX}` }}>
          <h2 style={headingStyle}>
            Find a cool space near you.
          </h2>
          <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 560 }}>
            <span>Cool public places and shaded parks near you.</span>
            <span style={{ display: 'block', marginTop: 6 }}>
              Or tap <span style={{ color: '#1852B4', fontWeight: 700 }}>✦</span> to match by what you need.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

            {/* Venue list — rich rows matching HTML prototype */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {nearestVenues.length > 0
                ? nearestVenues.map((v, idx) => {
                    const kind = venueTypeKind(v)
                    const typeTag = venueTypeLabel(v)
                    const kindColor = VENUE_KIND_COLOR[kind]
                    const address = [v.address, v.suburb].filter(Boolean).join(', ')
                    return (
                      <div
                        key={v.id ?? v.name}
                        onClick={() => navigate('/map')}
                        style={{ position: 'relative', padding: '16px 36px 16px 40px', borderTop: idx === 0 ? 'none' : `1px solid ${RULE}`, cursor: 'pointer', transition: 'background 0.16s ease, padding-left 0.22s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(243,236,220,0.46)'
                          e.currentTarget.style.paddingLeft = '50px'
                          const arrow = e.currentTarget.querySelector('[data-row-arrow]')
                          if (arrow) {
                            arrow.style.opacity = '1'
                            arrow.style.transform = 'translate(0, -50%)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.paddingLeft = '40px'
                          const arrow = e.currentTarget.querySelector('[data-row-arrow]')
                          if (arrow) {
                            arrow.style.opacity = '0'
                            arrow.style.transform = 'translate(-8px, -50%)'
                          }
                        }}
                      >
                        {/* Numbered circle */}
                        <div style={{ position: 'absolute', left: 0, top: idx === 0 ? 16 : 18, width: 24, height: 24, borderRadius: '50%', background: kindColor, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.9375rem', fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: '0 2px 8px rgba(34,30,26,0.14)' }}>
                          {idx + 1}
                        </div>
                        {/* Name + distance */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 500, color: INK, lineHeight: 1.24 }}>{v.name}</div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: FAINT, flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <strong style={{ fontWeight: 500 }}>{v.distKm != null ? v.distKm.toFixed(1) : '—'}</strong>
                            <span style={{ fontSize: '0.9375rem' }}>km</span>
                          </div>
                        </div>
                        {/* Type pill */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', minHeight: 24, padding: '4px 11px', borderRadius: 99, background: VENUE_KIND_PILL[kind].background, fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 500, color: VENUE_KIND_PILL[kind].color, marginTop: 3, marginBottom: address ? 4 : 0, lineHeight: 1 }}>
                          {typeTag}
                        </div>
                        {/* Address */}
                        {address && (
                          <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: FAINT, marginTop: 2 }}>{address}</div>
                        )}
                        <span
                          data-row-arrow
                          aria-hidden="true"
                          style={{ position: 'absolute', right: 8, top: 30, transform: 'translate(-8px, -50%)', opacity: 0, color: FAINT, fontSize: 24, lineHeight: 1, transition: 'opacity 0.18s ease, transform 0.18s ease' }}
                        >
                          →
                        </span>
                      </div>
                    )
                  })
                : (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: '#9A9A9A', padding: '20px 0' }}>
                      {lat == null ? 'Set your location to see nearby cool spaces.' : 'Finding nearby cool spaces…'}
                    </div>
                  )
              }
            </div>

            {/* Map card — navigates to full map page */}
            <MiniMapCard venues={nearestVenues} onOpen={() => navigate('/map')} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LOCATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <LocationModal
        open={showLocModal}
        onClose={() => setShowLocModal(false)}
        requestGps={requestGps}
        fetchByPostcode={fetchByPostcode}
        canDismiss={canDismissLocationModal}
      />

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
              <span style={{ fontFamily: "var(--font-title)", fontSize: '1.625rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                Your medications
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

            <p style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>
              Select any medications you take regularly. We don't save this data — it's strictly used to calculate your heat risk today.
            </p>

            <MedicationsSection
              selectedMedications={selectedMedications}
              onMedicationsChange={setSelectedMedications}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
              <button
                onClick={() => setSelectedMedications([])}
                style={{ background: 'transparent', border: 'none', fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 500, color: '#8A3F28', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.18s ease', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = INK }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8A3F28' }}
              >
                Clear all
              </button>

              <button
                onClick={() => {
                  setShowMedModal(false)
                  const cnt = selectedMedications.length
                  showToast(cnt > 0 ? `Score updated — ${cnt} medication${cnt > 1 ? 's' : ''} saved` : 'Medications cleared — showing weather-only score')
                }}
                style={{ flex: 1, background: INK, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', boxShadow: '0 4px 16px rgba(15,15,15,0.20)', transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,15,15,0.26)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,15,15,0.20)' }}
              >
                Save & Calculate Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniMapCard({ venues, onOpen }) {
  const dots = venues.length ? venues : [{ name: 'Nearby cool space', type: 'Library' }]
  const validDots = dots.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
  const center = validDots.length
    ? [validDots[0].lat, validDots[0].lng]
    : [-37.8136, 144.9631]
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
      style={{ height: 360, background: '#E8F0F5', borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `1px solid ${RULE}`, boxShadow: '0 4px 24px rgba(34,30,26,0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 20px 46px rgba(34,30,26,0.12)'
        e.currentTarget.style.borderColor = 'rgba(138,63,40,0.28)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(34,30,26,0.04)'
        e.currentTarget.style.borderColor = RULE
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          key={`${center[0]}-${center[1]}-${validDots.length}`}
          center={center}
          zoom={14}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', filter: 'saturate(0.76) contrast(0.94) brightness(1.04)' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {validDots.slice(0, 3).map((v, i) => {
            const kind = venueTypeKind(v)
            const color = VENUE_KIND_COLOR[kind]
            return (
              <Marker
                key={v.id ?? v.name ?? i}
                position={[v.lat, v.lng]}
                icon={L.divIcon({
                  className: '',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                  html: `<div style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:${color};color:white;border:3px solid white;box-shadow:0 4px 12px rgba(34,30,26,.22);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700">${i + 1}</div>`,
                })}
              />
            )
          })}
        </MapContainer>
      </div>
      {validDots.length === 0 && dots.slice(0, 3).map((v, i) => {
        const kind = venueTypeKind(v)
        const color = VENUE_KIND_COLOR[kind]
        const positions = [[28, 34], [62, 52], [44, 70]]
        return (
          <div key={v.id ?? v.name ?? i} title={v.name} style={{ position: 'absolute', left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, transform: 'translate(-50%,-50%)', width: 26, height: 26, borderRadius: '50%', background: color, border: '3px solid #fff', boxShadow: '0 6px 16px rgba(34,30,26,0.22)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 800 }}>
            {i + 1}
          </div>
        )
      })}
      <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', borderRadius: 99, padding: '9px 18px', boxShadow: '0 8px 24px rgba(34,30,26,0.12)', fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
        Open full map →
      </div>
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
