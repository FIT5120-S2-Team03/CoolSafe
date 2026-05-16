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
import Navbar from '../components/layout/Navbar'
import SectionContainer from '../components/layout/SectionContainer'
import LocationModal from '../components/location/LocationModal'
import CoolSpacesSection from '../components/today/CoolSpacesSection'
import MedicationModal from '../components/today/MedicationModal'
import RiskScoreBanner from '../components/today/RiskScoreBanner'
import TodayActionCards from '../components/today/TodayActionCards'
import TodayHero from '../components/today/TodayHero'
import { TempChart } from '../components/today/TempChart'
import { useWeatherData } from '../hooks/useWeatherData'
import { useAirQuality }  from '../hooks/useAirQuality'
import useCoolSpaces      from '../hooks/useCoolSpaces'
import { useMedicationPreferences } from '../hooks/useMedicationPreferences'
import { useNearestVenues } from '../hooks/useNearestVenues'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { getRiskLevel, getAqiInfo } from '../utils/riskLevel'
import { calculateHeatSafetyScore } from '../utils/scoreCalculator'
import {
  UV_BY_RISK,
  getPeriodContent,
  heatBand,
  heatCopy,
  outingRecommendation,
  peakTempBadgeInfo,
  periodRange,
  scoreColour,
  scoreVerdict,
  tomorrowOutlook,
} from '../utils/todayHeat'
import mockLocation from '../data/mockLocation.json'
import { ROUTINE_META } from '../data/todayRoutineMeta'
import { FAINT, INK, MUTED, PAPER, RULE } from '../styles/colors'

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
  const [activePeriod, setActivePeriod] = useState(() => {
    const h = new Date().getHours()
    if (h >= 11 && h < 16) return 'midday'
    if (h >= 16 || h < 6) return 'evening'
    return 'morning'
  })
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
    if (!current) return null
    return calculateHeatSafetyScore({
      apparentTemp: current.apparentTemp,
      hour:         currentHour,
      medications:  selectedMedications,
    })
  }, [current, currentHour, selectedMedications])

  const score      = scoreData?.score ?? 0
  const breakdown  = scoreData?.breakdown ?? null
  const scoreColor = scoreColour(score)
  const canDismissLocationModal = Boolean(locationName || localStorage.getItem(STORAGE_KEYS.coords))
  const nearestVenues = useNearestVenues(venues, lat, lng)

  const band = heatBand(daily?.todayMax)
  const copy = heatCopy(band)
  const hasMedications = selectedMedications.length > 0
  const heroSlogan = score >= 75
    ? { before: 'Stay',        accent: 'indoors today.' }
    : score >= 30
    ? { before: 'Take it',     accent: 'easy today.' }
    : { before: "You're in the", accent: 'clear today.' }
  const heroDesc = hasMedications
    ? 'Your personalised plan is ready below.'
    : 'Add your medications below for a more accurate heat plan.'
  const verdict = scoreVerdict(score, hasMedications, band)

  const outing = useMemo(() => outingRecommendation(hourly), [hourly])

  const periodRanges = useMemo(() => {
    return {
      morning: periodRange(hourly, 6, 11, '17-22°'),
      midday: periodRange(hourly, 11, 16, '24-31°'),
      evening: periodRange(hourly, 16, 20, '20-25°'),
    }
  }, [hourly])
  const locationModalOpen = showLocModal

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
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

      {/* ══════════════════════════════════════════════════════════════════════
          4. HOURLY CHART  +  ROUTINE TABS
          Left panel: SVG temperature chart + tomorrow outlook bar
          Right panel: Morning / Midday / Evening tabs with contextual advice
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionContainer id="sec-chart" outerStyle={{ borderBottom: `1px solid ${RULE}` }}>
          <h2 style={headingStyle}>
            Your day, looked after.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36 }}>
            Tap a time of day to see your plan.
          </p>

          {/* Two-panel card */}
          <div className="cs-today-routine-card" style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            height: 680,
            background: '#fff',
            border: `1px solid ${RULE}`,
            borderRadius: 32,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          }}>

            {/* Left — chart */}
            <div className="cs-today-chart-panel" style={{ display: 'flex', flexDirection: 'column', padding: '30px 32px 24px', boxSizing: 'border-box' }}>
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
            <div className="cs-today-routine-panel" style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${RULE}` }}>

              {/* Tab pills */}
              <div className="cs-today-period-tabs" style={{ display: 'flex', gap: 8, padding: '16px 20px', borderBottom: `1px solid ${RULE}`, flexShrink: 0 }}>
                {['morning', 'midday', 'evening'].map((p) => {
                  const periodMeta = {
                    morning: { label: 'Morning', time: '6–11am' },
                    midday:  { label: 'Midday',  time: '11am–4pm' },
                    evening: { label: 'Evening', time: '4–9pm' },
                  }
                  const { label, time } = periodMeta[p]
                  const isActive = activePeriod === p
                  const activeColor = p === 'morning' ? '#6B7A3A' : p === 'midday' ? '#B85A3C' : '#5B7A8C'
                  return (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = '#8A3F28'
                        e.currentTarget.style.background = '#FFFCF6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = RULE
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                    style={{
                      flex: '1 1 0',
                      padding: '8px 10px',
                      borderRadius: 99,
                      border: `1px solid ${isActive ? activeColor : RULE}`,
                      background: isActive ? activeColor : 'transparent',
                      color: isActive ? '#fff' : MUTED,
                      fontFamily: "var(--font-body)",
                      fontSize: 'var(--text-caption)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {label}
                    <span style={{ opacity: isActive ? 0.75 : 0.6, fontWeight: 400 }}> · {time}</span>
                  </button>
                )})}
              </div>

              {/* Period gradient banner */}
              <div className="cs-today-period-visual" style={{
                height: 210,
                flexShrink: 0,
                background: ROUTINE_META[activePeriod].bg,
                borderBottom: `1px solid ${RULE}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.4s',
              }}>
                {ROUTINE_META[activePeriod].svg}
                <span style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(34,30,26,0.85)', color: '#FAF8F5', borderRadius: 99, padding: '5px 14px', fontFamily: "var(--font-title)", fontSize: '1rem', boxShadow: '0 2px 10px rgba(34,30,26,0.14)' }}>
                  {periodRanges[activePeriod]}
                </span>
              </div>

              {/* Period advice */}
              <div className="cs-today-period-advice" style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
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

      </SectionContainer>

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
