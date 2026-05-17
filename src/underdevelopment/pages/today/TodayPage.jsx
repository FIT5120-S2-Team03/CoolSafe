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
 *
 * All data fetching is lifted here; sub-components receive pure props.
 */
import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import LocationModal from '../../components/location/LocationModal'
import CoolSpacesSection from './components/CoolSpacesSection'
import MedicationModal from './components/MedicationModal'
import RiskScoreBanner from './components/RiskScoreBanner'
import RoutinePlanner from './components/RoutinePlanner'
import TodayActionCards from './components/TodayActionCards'
import TodayHero from './components/TodayHero'
import { useWeatherData } from '../../hooks/useWeatherData'
import { useAirQuality }  from '../../hooks/useAirQuality'
import useCoolSpaces      from '../../hooks/useCoolSpaces'
import { useMedicationPreferences } from '../../hooks/useMedicationPreferences'
import { useNearestVenues } from '../../hooks/useNearestVenues'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import { getRiskLevel, getAqiInfo } from '../../utils/riskLevel'
import { calculateHeatSafetyScore } from '../../utils/scoreCalculator'
import {
  UV_BY_RISK,
  heatBand,
  outingRecommendation,
  peakTempBadgeInfo,
  scoreColour,
  scoreVerdict,
} from './todayHeatRules'
import { getWindows } from './forecastUtils'
import mockLocation from '../../mocks/mockLocation.json'
import { INK, PAPER } from '../../styles/colors'

// ── Main component ────────────────────────────────────────────────────────────

export default function TodayPage() {
  const {
    current, hourly, daily, locationName,
    requestGps, fetchByPostcode,
    lat, lng,
  } = useWeatherData()

  const { aqi }    = useAirQuality({ lat, lng })
  const { venues } = useCoolSpaces()
  const navigate   = useNavigate()

  const [selectedMedications, setSelectedMedications] = useMedicationPreferences()
  const [showMedModal, setShowMedModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(() => !mockLocation.enabled && !localStorage.getItem(STORAGE_KEYS.coords))
  const [showScoreInfo, setShowScoreInfo] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef(null)

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
    if (!current || !daily) return null
    return calculateHeatSafetyScore({
      currentTemp:  current.apparentTemp ?? current.temp,
      todayMax:     daily.todayMax,
      medications:  selectedMedications,
    })
  }, [current, daily, selectedMedications])

  const score      = scoreData?.score ?? 0
  const breakdown  = scoreData?.breakdown ?? null
  const scoreColor = scoreColour(score)
  const canDismissLocationModal = Boolean(locationName || localStorage.getItem(STORAGE_KEYS.coords))
  const nearestVenues = useNearestVenues(venues, lat, lng, Infinity)

  const band = heatBand(daily?.todayMax)
  const hasMedications = selectedMedications.length > 0
  const outing = useMemo(() => outingRecommendation(hourly), [hourly])

  const peakHour = useMemo(() => getWindows(hourly)?.peakHour ?? null, [hourly])
  const peakStillAhead = peakHour != null && peakHour > currentHour
  const todayMax = daily?.todayMax ?? 0
  const currentTemp = current?.apparentTemp ?? current?.temp ?? 0

  // Slogan decision tree — pure weather, no score
  // 1. No dangerous peak today  → clear
  // 2. Peak still ahead         → warn about later heat
  // 3. Currently in the peak    → stay indoors now
  // 4. Peak has passed          → ease off
  const heroSlogan = todayMax < 32
    ? { before: "You're in the", accent: 'clear today.' }
    : peakStillAhead
    ? { before: 'Heat peaks',    accent: 'later today.' }
    : currentTemp >= 32
    ? { before: 'Stay indoors',  accent: 'now.' }
    : { before: 'Take it',       accent: 'easy today.' }
  const heroDesc = todayMax < 32
    ? hasMedications
      ? 'Your personalised plan is ready below.'
      : 'Add your medications below for a more accurate heat plan.'
    : peakStillAhead
    ? 'It feels mild now, but high heat is expected later. Use the cooler window below for errands or time outside.'
    : currentTemp >= 32
    ? 'Heat is at its peak right now. Stay inside, drink water, and avoid going out until it cools down.'
    : hasMedications
    ? 'The worst of the heat has passed. Your personalised plan is ready below.'
    : 'The worst of the heat has passed. Add your medications below for a more accurate plan.'
  const verdict = scoreVerdict(score)

  const locationModalOpen = showLocModal

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="cs-today-page" style={{ background: PAPER, minHeight: '100vh' }}>
      <style>{`
        @keyframes cs-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cs-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes popIn { from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes cs-banner-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cs-data-breathe {
          0%, 100% { box-shadow: 0 4px 20px rgba(34,30,26,0.10); border-color: #E5DCC8; }
          50% { box-shadow: 0 9px 28px rgba(91,122,140,0.16); border-color: rgba(91,122,140,0.28); }
        }
        .cs-banner { animation: cs-banner-in 0.3s ease both; }
        .weather-callout { animation: cs-data-breathe 4.8s ease-in-out infinite; }
        .weather-callout:hover {
          transform: translateY(-3px);
          border-color: rgba(138,63,40,0.34);
          box-shadow: 0 12px 30px rgba(34,30,26,0.14);
          animation-play-state: paused;
        }
      `}</style>

      <Navbar locationName={locationName} onLocationClick={() => setShowLocModal(true)} />

      <TodayHero
        current={current}
        daily={daily}
        aqi={aqi}
        aqiInfo={aqiInfo}
        heroSlogan={heroSlogan}
        heroDesc={heroDesc}
        peakBadge={peakBadge}
        risk={risk}
        selectedMedications={selectedMedications}
        uvInfo={uvInfo}
        onEditMedications={() => setShowMedModal(true)}
      />

      <RiskScoreBanner
        breakdown={breakdown}
        score={score}
        scoreColor={scoreColor}
        selectedMedications={selectedMedications}
        showScoreInfo={showScoreInfo}
        verdict={verdict}
        onShowScoreInfoChange={setShowScoreInfo}
      />

      <TodayActionCards
        medicationCount={selectedMedications.length}
        outing={outing}
        score={score}
        onGoSafety={() => navigate('/health')}
      />

      <RoutinePlanner
        band={band}
        daily={daily}
        hourly={hourly}
        locationName={locationName}
      />

      <CoolSpacesSection
        lat={lat}
        nearestVenues={nearestVenues}
        onOpenMap={(venue) => {
          if (venue?.id) {
            navigate(`/venue/${venue.id}`, { state: { venue } })
            return
          }
          navigate('/spaces')
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LOCATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <LocationModal
        open={locationModalOpen}
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
        <div className="cs-today-toast" style={{
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
        <MedicationModal
          selectedMedications={selectedMedications}
          onMedicationsChange={setSelectedMedications}
          onClose={() => setShowMedModal(false)}
          onSaved={showToast}
        />
      )}
    </div>
  )
}
