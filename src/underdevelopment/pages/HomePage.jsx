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
import L from 'leaflet'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import Navbar from '../components/layout/Navbar'
import MedicationsSection from '../components/home/MedicationsSection'
import LocationModal from '../components/location/LocationModal'
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

const MED_LABELS = {
  'Blood pressure medication': 'Blood pressure',
  'Diuretics / water tablets': 'Water pills',
  Antidepressants: 'Antidepressants',
  'Diabetes medication': 'Diabetes',
  Antihistamines: 'Antihistamines',
  'Heart medication': 'Heart meds',
  Antipsychotics: 'Antipsychotics',
  'Pain relievers (NSAIDs)': 'Pain relievers',
}

const AI_QUESTIONS = [
  {
    key: 'type',
    title: 'What kind of place are you looking for?',
    options: [
      ['library', 'Library'],
      ['shopping', 'Shopping centre'],
      ['community', 'Community centre'],
      ['park', 'Shaded park / garden'],
      ['cafe', 'Cafe or food court'],
      ['any', 'No preference'],
    ],
  },
  {
    key: 'travel',
    title: 'How do you prefer to get there?',
    options: [['walking', 'Walking'], ['transit', 'Public transport'], ['driving', 'Driving'], ['any', 'No preference']],
  },
  {
    key: 'vibe',
    title: 'What kind of atmosphere suits you?',
    options: [['quiet', 'Quiet and calm'], ['social', 'Social and lively'], ['activities', 'Activities or events'], ['any', 'No preference']],
  },
  {
    key: 'access',
    title: 'Any accessibility needs?',
    options: [['wheelchair', 'Wheelchair accessible'], ['seating', 'Plenty of seating'], ['toilets', 'Accessible toilets'], ['parking', 'Nearby parking'], ['none', 'None needed']],
  },
]

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
  if (t.includes('gallery') || t.includes('museum') || t.includes('arts & culture')) return 'gallery'
  if (t.includes('park') || t.includes('garden') || t.includes('reserve') || t.includes('informal outdoor') || t.includes('recreation')) return 'park'
  if (t.includes('library') || t.includes('learning')) return 'library'
  if (t.includes('shopping') || t.includes('community') || t.includes('centre') || t.includes('retail') || t.includes('visitor info') || t.includes('support')) return 'community'
  return 'default'
}

function venueTypeLabel(venueOrType = '') {
  const source = venueTypeSource(venueOrType)
  const kind = venueTypeKind(venueOrType)
  if (kind === 'gallery') return 'Art Gallery / Museum'
  if (kind === 'park') return 'Park / Garden / Reserve'
  if (kind === 'library') return 'Library'
  if (kind === 'community') {
    const t = source.toLowerCase()
    return (t.includes('shopping') || t.includes('retail')) ? 'Shopping Centre' : 'Community Centre'
  }
  return source || 'Public space'
}

const VENUE_KIND_COLOR = {
  gallery:   '#8A3F28',
  park:      '#4F5A2B',
  library:   '#1E465A',
  community: '#8A5A12',
  default:   '#6E6358',
}

const VENUE_KIND_PILL = {
  gallery:   { background: '#F3ECDC', color: '#8A3F28' },
  park:      { background: '#D9DEC0', color: '#4F5A2B' },
  library:   { background: '#CFDDE5', color: '#1E465A' },
  community: { background: '#F2DDB3', color: '#8A5A12' },
  default:   { background: '#F0EDE8', color: '#5A5048' },
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
  const [showScoreInfo, setShowScoreInfo] = useState(false)
  const [activePeriod, setActivePeriod] = useState(() => {
    const h = new Date().getHours()
    if (h >= 11 && h < 16) return 'midday'
    if (h >= 16 || h < 6) return 'evening'
    return 'morning'
  })
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set())
  const [toastMsg, setToastMsg] = useState('')
  const [activeMedAdvice, setActiveMedAdvice] = useState(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [aiPrefs, setAiPrefs] = useState({})
  const [aiHasResult, setAiHasResult] = useState(false)
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
    ? (score >= 75 ? 'Your medications need extra care today.' : 'Your medications may add risk today.')
    : 'Tell us your medications for accuracy.'
  const medicationCardDesc = hasMedications && activeMed
    ? MED_ADVICE[activeMed]
    : 'Some pills reduce sweating or increase fluid loss. Add them to see if you need extra care.'
  const heroSlogan = hasMedications
    ? (score >= 75
      ? { before: 'Stay', accent: 'indoors today.' }
      : { before: 'Take it', accent: 'easy today.' })
    : copy.slogan
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

  const symptomBanner = maxSeverity === '000'
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

  const toggleSymptom = (id) =>
    setSelectedSymptoms((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const periodRanges = useMemo(() => {
    return {
      morning: periodRange(hourly, 6, 11, '17-22°'),
      midday: periodRange(hourly, 11, 16, '24-31°'),
      evening: periodRange(hourly, 16, 20, '20-25°'),
    }
  }, [hourly])

  const aiMatches = useMemo(() => {
    const selectedType = aiPrefs.type
    const typeFiltered = nearestVenues.filter((v) => {
      if (!selectedType || selectedType === 'any') return true
      const kind = venueTypeKind(v)
      if (selectedType === 'shopping') return venueTypeLabel(v).toLowerCase().includes('shopping')
      if (selectedType === 'community') return kind === 'community'
      if (selectedType === 'park') return kind === 'park'
      if (selectedType === 'library') return kind === 'library'
      return true
    })
    return (typeFiltered.length ? typeFiltered : nearestVenues).slice(0, 3)
  }, [aiPrefs.type, nearestVenues])

  // ── section wrapper style (shared) ──
  const secInner = { maxWidth: MAX_W, margin: '0 auto', padding: `0 ${PX}` }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
      <style>{`
        @keyframes cs-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes popIn { from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes cs-banner-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cs-banner { animation: cs-banner-in 0.3s ease both; }
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
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(3rem,6vw,5rem)',
              fontWeight: 'normal',
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              marginBottom: 24,
            }}>
              {heroSlogan.before}{' '}
              <em style={{ fontStyle: 'italic', color: '#8A3F28' }}>{heroSlogan.accent}</em>
            </h1>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
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
                ? 'Review medications'
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
              badgeColor={uvInfo?.color ?? FAINT}
              style={{ position: 'absolute', top: '24%', right: '-12%' }}
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
                    <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', background: '#FFFCF6', color: INK, border: `1px solid ${RULE}`, borderRadius: 16, padding: '15px 18px', minWidth: 280, boxShadow: '0 18px 44px rgba(34,30,26,0.16)', zIndex: 100 }}>
                      <div style={{ position: 'absolute', top: -7, left: '50%', width: 14, height: 14, transform: 'translateX(-50%) rotate(45deg)', background: '#FFFCF6', borderLeft: `1px solid ${RULE}`, borderTop: `1px solid ${RULE}` }} />
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.777rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, textAlign: 'center', marginBottom: 10, position: 'relative' }}>
                        How your score is calculated
                      </div>
                      {[
                        { label: 'Weather heat risk', pts: breakdown.weatherPts },
                        { label: 'Time of day',       pts: breakdown.timePts   },
                        { label: 'Medication risk',   pts: breakdown.medPts    },
                      ].map(({ label, pts }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${RULE}`, fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, position: 'relative' }}>
                          <span>{label}</span>
                          <span style={{ fontWeight: 700, color: INK }}>{pts >= 0 ? '+' : ''}{pts}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${RULE}`, fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: INK, fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: scoreColor }}>{score}</span>
                      </div>
                      <div style={{ marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: FAINT, lineHeight: 1.35 }}>
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
                {verdict}
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
          {(score >= 50 || band === 'extreme') && (
            <div style={{
              marginTop: 20,
              borderRadius: 18,
              border: score >= 75 || band === 'extreme' ? '1px solid #B85A3C' : `1px solid ${RULE}`,
              background: score >= 75 || band === 'extreme' ? '#F1D6CE' : '#F3ECDC',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              fontFamily: 'var(--sans)',
              color: score >= 75 || band === 'extreme' ? '#8A3F28' : MUTED,
            }}>
              <span>
                {score >= 75 || band === 'extreme'
                  ? <><strong>Medical emergency signs?</strong> Confusion, fainting, vomiting, or hot dry skin can be critical. Do not wait.</>
                  : 'Feeling unwell? Check the symptoms below.'}
              </span>
              {(score >= 75 || band === 'extreme') && (
                <a href="tel:000" style={{ borderRadius: 999, background: '#B85A3C', color: '#fff', padding: '9px 16px', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Call 000 Now
                </a>
              )}
            </div>
          )}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <ThingCard
              iconBg="#F2DDB3"
              icon="pill"
              title={medicationCardTitle}
              desc={medicationCardDesc}
              extra={selectedMedications.length > 0
                ? (
                  <MedAdviceChips
                    medications={selectedMedications}
                    activeMed={activeMed}
                    onSelect={setActiveMedAdvice}
                    onClear={() => {
                      setSelectedMedications([])
                      setActiveMedAdvice(null)
                      showToast('Medications cleared')
                    }}
                  />
                )
                : null}
              extraBeforeDesc
              cta="Review medications"
              ctaIcon="arrow_forward"
              onClick={() => setShowMedModal(true)}
            />
            <ThingCard
              iconBg="#D9DEC0"
              icon="schedule"
              title={copy.cardTitle}
              windowTime={band === 'mild'
                ? null
                : bestWindow ? `${bestWindow.startH} – ${bestWindow.startH + 2}` : null}
              windowLabel={band === 'mild' ? '' : copy.windowLabel}
              desc={band === 'mild'
                ? <>Easy plans all day.<br /><br />{copy.cardDesc(middayApparentTemp)}</>
                : copy.cardDesc(middayApparentTemp)}
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
            minHeight: 650,
            background: '#fff',
            border: `1px solid ${RULE}`,
            borderRadius: 32,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          }}>

            {/* Left — chart */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 32px 24px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: FAINT, marginBottom: 20, flexShrink: 0 }}>
                Hourly Temperature · {locationName ?? 'Melbourne'}
              </div>

              <div style={{ flex: 1, minHeight: 360, position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                <TempChart hourly={hourly} />
              </div>

              {/* Tomorrow outlook row */}
              <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B85A3C', animation: 'cs-pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: INK }}>
                    Tomorrow's Outlook: {tomorrowOutlook(daily?.tomorrowMax)}
                  </span>
                </div>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.65rem', color: daily?.tomorrowMax != null ? scoreColour(Math.min(100, daily.tomorrowMax * 2)) : '#B85A3C', whiteSpace: 'nowrap' }}>
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
                      fontFamily: "'DM Sans', sans-serif",
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
                <span style={{ position: 'absolute', top: 16, left: 16, background: '#fff', borderRadius: 99, padding: '6px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, boxShadow: '0 2px 8px rgba(34,30,26,0.08)' }}>
                  {getPeriodContent(activePeriod, band)?.eyebrow.replace('Morning · ', '').replace('Midday · ', '').replace('Evening · ', '')}
                </span>
                <span style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(34,30,26,0.85)', color: '#FAF8F5', borderRadius: 99, padding: '5px 14px', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1rem', boxShadow: '0 2px 10px rgba(34,30,26,0.14)' }}>
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
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 560 }}>
            <span>Cool public places and shaded parks near you.</span>
            <span style={{ display: 'block', marginTop: 6 }}>
              Or tap <span style={{ color: '#B85A3C', fontWeight: 700 }}>✦</span> to match by what you need.
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', minHeight: 24, padding: '4px 11px', borderRadius: 99, background: VENUE_KIND_PILL[kind].background, fontFamily: "'DM Sans', sans-serif", fontSize: '0.777rem', fontWeight: 500, color: VENUE_KIND_PILL[kind].color, marginTop: 3, marginBottom: address ? 4 : 0, lineHeight: 1 }}>
                          {typeTag}
                        </div>
                        {/* Address */}
                        {address && (
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: FAINT, marginTop: 2 }}>{address}</div>
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
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#9A9A9A', padding: '20px 0' }}>
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

      <button
        onClick={() => setShowAiPanel(true)}
        aria-label="Find a cool space with AI"
        style={{
          position: 'fixed',
          right: 28,
          bottom: 28,
          zIndex: 520,
          width: 58,
          height: 58,
          borderRadius: '50%',
          border: '1px solid rgba(184,90,60,0.34)',
          background: '#B85A3C',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 16px 36px rgba(138,63,40,0.28)',
          cursor: 'pointer',
          fontSize: 25,
          fontWeight: 700,
        }}
      >
        ✦
      </button>

      {showAiPanel && (
        <AiCoolSpacePanel
          step={aiStep}
          prefs={aiPrefs}
          hasResult={aiHasResult}
          matches={aiMatches}
          onPick={(key, value) => {
            setAiPrefs((prev) => ({ ...prev, [key]: value }))
            setAiHasResult(false)
          }}
          onBack={() => setAiStep((s) => Math.max(0, s - 1))}
          onNext={() => setAiStep((s) => Math.min(AI_QUESTIONS.length - 1, s + 1))}
          onFind={() => {
            setAiHasResult(true)
            setAiStep(AI_QUESTIONS.length)
          }}
          onReset={() => {
            setAiPrefs({})
            setAiStep(0)
            setAiHasResult(false)
          }}
          onClose={() => setShowAiPanel(false)}
          onOpenMap={() => navigate('/map')}
        />
      )}

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
                style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#8A3F28', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.18s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = INK }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8A3F28' }}
              >
                Clear all
              </button>
            </div>
          )}

          <div
            key={symptomBanner.key}
            className="cs-banner"
            style={{
              background: symptomBanner.bg,
              border: `1px solid ${symptomBanner.border}`,
              borderRadius: 20,
              padding: symptomBanner.title ? '24px 28px' : '20px 24px',
              minHeight: symptomBanner.title ? 104 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: symptomBanner.title ? 'space-between' : 'center',
              gap: 24,
              flexWrap: 'wrap',
              fontFamily: "'DM Sans', sans-serif",
              color: symptomBanner.textColor,
            }}
          >
            {symptomBanner.title ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: symptomBanner.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: symptomBanner.key === '000' ? 'cs-pulse 2s ease-in-out infinite' : 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>{symptomBanner.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.25rem', color: INK, marginBottom: 4 }}>{symptomBanner.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: symptomBanner.textColor, lineHeight: 1.5 }}>
                      {symptomBanner.text}
                    </div>
                  </div>
                </div>
                <a href={symptomBanner.href} style={{ display: 'inline-block', background: symptomBanner.iconBg, color: '#fff', borderRadius: 99, padding: '12px 24px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                  {symptomBanner.cta}
                </a>
              </>
            ) : (
              <span>{symptomBanner.text}</span>
            )}
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
              <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.625rem', color: INK, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
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

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>
              Select any medications you take regularly. We don't save this data — it's strictly used to calculate your heat risk today.
            </p>

            <MedicationsSection
              selectedMedications={selectedMedications}
              onMedicationsChange={setSelectedMedications}
            />

            <button
              onClick={() => setSelectedMedications([])}
              style={{ background: 'transparent', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#8A3F28', cursor: 'pointer', padding: '14px 0 6px', display: 'inline-flex', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.18s ease' }}
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
              style={{ width: '100%', background: INK, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: '-0.2px', boxShadow: '0 4px 16px rgba(15,15,15,0.20)', transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,15,15,0.26)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,15,15,0.20)' }}
            >
              Save & Calculate Risk
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
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: `${badgeColor}18`, fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: badgeColor, alignSelf: 'flex-start' }}>
        {badge}
      </span>
    </div>
  )
}

/** One of the three summary cards in the "Three things" section */
function ThingCard({ icon, iconBg, title, desc, extra, extraBeforeDesc = false, cta, ctaIcon = 'arrow_forward', onClick, windowTime, windowLabel }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 24, padding: 32, minHeight: 430, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, cursor: 'pointer', transition: 'border-color 0.18s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8A3F28' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE }}
    >
      <div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: INK }}>{icon}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-title-sm)', color: INK, lineHeight: 1.15, marginBottom: windowTime || extraBeforeDesc ? 0 : 16, fontWeight: 'normal', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {extraBeforeDesc && extra && <div style={{ marginTop: 16, marginBottom: 16 }}>{extra}</div>}
        {windowTime && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.75rem,2.5vw,2.25rem)', color: INK, lineHeight: 1 }}>{windowTime}</span>
            {windowLabel && <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', color: FAINT }}>{windowLabel}</span>}
          </div>
        )}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: MUTED, lineHeight: 1.5 }}>
          {desc}
        </p>
        {!extraBeforeDesc && extra && <div style={{ marginTop: 12 }}>{extra}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 500, color: INK }}>
        {cta}
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ctaIcon}</span>
      </div>
    </div>
  )
}

/** Interactive medication advice chips shown in the Three Things card */
function MedAdviceChips({ medications, activeMed, onSelect, onClear }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {medications.map((med) => (
        <button
          key={med}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(med)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 99,
            background: activeMed === med ? '#B85A3C' : '#FFFCF6',
            border: activeMed === med ? '1px solid #B85A3C' : `1px solid ${RULE}`,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 500,
            color: activeMed === med ? '#fff' : MUTED,
            lineHeight: 1.4,
            cursor: 'pointer',
            transition: 'border-color 0.18s ease, color 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => {
            if (activeMed !== med) {
              e.currentTarget.style.borderColor = '#8A3F28'
              e.currentTarget.style.color = INK
            }
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = activeMed === med ? '#B85A3C' : RULE
            e.currentTarget.style.color = activeMed === med ? '#fff' : MUTED
            e.currentTarget.style.transform = 'none'
          }}
        >
          {MED_LABELS[med] ?? med}
        </button>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#8A3F28',
          fontFamily: 'var(--sans)',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '3px 4px',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          transition: 'color 0.18s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = INK }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#8A3F28' }}
      >
        Clear all
      </button>
    </div>
  )
}

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
                  html: `<div style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:${color};color:white;border:3px solid white;box-shadow:0 4px 12px rgba(34,30,26,.22);font-family:Atkinson Hyperlegible,system-ui,sans-serif;font-size:14px;font-weight:700">${i + 1}</div>`,
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
          <div key={v.id ?? v.name ?? i} title={v.name} style={{ position: 'absolute', left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, transform: 'translate(-50%,-50%)', width: 26, height: 26, borderRadius: '50%', background: color, border: '3px solid #fff', boxShadow: '0 6px 16px rgba(34,30,26,0.22)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--sans)', fontSize: '0.75rem', fontWeight: 800 }}>
            {i + 1}
          </div>
        )
      })}
      <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', borderRadius: 99, padding: '9px 18px', boxShadow: '0 8px 24px rgba(34,30,26,0.12)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
        Open full map →
      </div>
    </div>
  )
}

function AiCoolSpacePanel({ step, prefs, hasResult, matches, onPick, onBack, onNext, onFind, onReset, onClose, onOpenMap }) {
  const question = AI_QUESTIONS[step]
  const showingResult = step >= AI_QUESTIONS.length
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 96, zIndex: 530, width: 'min(420px, calc(100vw - 32px))', background: '#FFFCF6', border: `1px solid ${RULE}`, borderRadius: 22, boxShadow: '0 24px 64px rgba(34,30,26,0.22)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${RULE}`, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', color: INK, lineHeight: 1.1 }}>Find a cool space with AI</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '0.8125rem', color: FAINT, marginTop: 4 }}>4 questions · about 1 minute</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'rgba(34,30,26,0.07)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ padding: 20 }}>
        {!showingResult && question && (
          <>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', lineHeight: 1.18, color: INK, marginBottom: 14 }}>{question.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {question.options.map(([value, label]) => {
                const selected = prefs[question.key] === value
                return (
                  <button
                    key={value}
                    onClick={() => onPick(question.key, value)}
                    style={{ border: selected ? '1.5px solid #B85A3C' : `1px solid ${RULE}`, background: selected ? '#F1D6CE' : '#fff', color: selected ? '#8A3F28' : INK, borderRadius: 14, padding: '12px 13px', textAlign: 'left', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {showingResult && (
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: INK, marginBottom: 12 }}>
              {hasResult ? 'Best matches nearby' : 'Finding the best spaces for you...'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matches.length ? matches.map((v) => (
                <button key={v.id ?? v.name} onClick={onOpenMap} style={{ textAlign: 'left', border: `1px solid ${RULE}`, background: '#fff', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, color: INK, marginBottom: 4 }}>{v.name}</div>
                  <div style={{ fontFamily: 'var(--sans)', color: FAINT, fontSize: '0.84rem' }}>{venueTypeLabel(v)} · {v.distKm != null ? `${v.distKm.toFixed(1)} km` : 'nearby'}</div>
                </button>
              )) : (
                <div style={{ fontFamily: 'var(--sans)', color: FAINT, border: `1px solid ${RULE}`, background: '#fff', borderRadius: 14, padding: 14 }}>
                  Set your location to match nearby cool spaces.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${RULE}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button onClick={showingResult ? onReset : onBack} style={{ visibility: step === 0 && !showingResult ? 'hidden' : 'visible', border: 'none', background: 'transparent', color: FAINT, fontFamily: 'var(--sans)', fontWeight: 700, cursor: 'pointer' }}>
          {showingResult ? 'Start over' : '← Back'}
        </button>
        <span style={{ fontFamily: 'var(--sans)', color: FAINT, fontSize: '0.78rem' }}>
          {showingResult ? 'Results' : `Step ${step + 1} of ${AI_QUESTIONS.length}`}
        </span>
        {!showingResult && (
          <button onClick={step === AI_QUESTIONS.length - 1 ? onFind : onNext} style={{ border: 'none', background: '#0F0F0F', color: '#fff', borderRadius: 99, padding: '10px 16px', fontFamily: 'var(--sans)', fontWeight: 700, cursor: 'pointer' }}>
            {step === AI_QUESTIONS.length - 1 ? 'Find spaces ✦' : 'Next →'}
          </button>
        )}
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
