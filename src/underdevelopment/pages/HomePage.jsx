/**
 * Home page — three full-screen scroll-snap sections:
 *   Section 1 (sec0): Status hero  — StatusCard
 *   Section 2 (sec1): Plan your day — HourlyForecastStrip
 *   Section 3 (sec2): Guidance cards — DoThisAvoid
 *
 * All data fetching is lifted here; components receive pure props.
 */
import { useState, useMemo, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import StatusCard from '../components/home/StatusCard'
import HourlyForecastStrip from '../components/home/HourlyForecastStrip'
import DoThisAvoid from '../components/home/DoThisAvoid'
import GetHelpSection from '../components/home/GetHelpSection'
import MedicationsSection from '../components/home/MedicationsSection'
import { useWeatherData } from '../hooks/useWeatherData'
import { useAirQuality } from '../hooks/useAirQuality'
import useCoolSpaces from '../hooks/useCoolSpaces'
import { getRiskLevel } from '../utils/riskLevel'
import { calculateHeatSafetyScore } from '../utils/scoreCalculator'
import { getWalkingMinutes } from '../utils/haversine'

export default function HomePage() {
  const {
    current, hourly, daily, locationName,
    loading, error, gpsBlocked, requestGps, fetchByPostcode,
    lat, lng,
  } = useWeatherData()

  const { aqi }    = useAirQuality({ lat, lng })
  const { venues } = useCoolSpaces()

  const [selectedMedications, setSelectedMedications] = useState([])
  const [showMedModal, setShowMedModal]               = useState(false)
  const [showLocModal, setShowLocModal]               = useState(true)
  const [locPostcode, setLocPostcode]                 = useState('')

  // Close location modal once data arrives (covers mock-mode auto-load)
  useEffect(() => {
    if (current) setShowLocModal(false)
  }, [current])

  const currentHour = new Date().getHours()

  const risk = useMemo(
    () => (current ? getRiskLevel(current.temp) : null),
    [current]
  )

  const UV_BY_RISK = {
    Low:      { index: 2,  label: 'Low' },
    Moderate: { index: 4,  label: 'Moderate' },
    High:     { index: 7,  label: 'High' },
    Extreme:  { index: 10, label: 'Very High' },
  }
  const uvInfo = risk ? UV_BY_RISK[risk.level] : null

  const scoreData = useMemo(() => {
    if (!current) return null
    return calculateHeatSafetyScore({
      apparentTemp: current.apparentTemp,
      hour:         currentHour,
      medications:  selectedMedications,
    })
  }, [current, currentHour, selectedMedications])

  /* nearest cool space (for peak-heat card in Section 2) */
  const nearestVenue = useMemo(() => {
    if (!venues?.length || lat == null || lng == null) return null
    let minMins = Infinity
    let closest = null
    for (const v of venues) {
      const mins = getWalkingMinutes(lat, lng, v.lat, v.lng)
      if (mins != null && mins < minMins) { minMins = mins; closest = v }
    }
    return closest ? { ...closest, walkMins: minMins } : null
  }, [venues, lat, lng])

  return (
    <>
      {/* Scrollbar-hide */}
      <style>{`
        #homeScroll::-webkit-scrollbar { display: none; }
        #homeScroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        id="homeScroll"
        style={{
          height: '100vh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        <Navbar locationName={locationName} />

        {/* ── Section 1: Status hero ── */}
        <section
          id="sec0"
          style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}
        >
          <StatusCard
            loading={loading}
            error={error}
            gpsBlocked={gpsBlocked}
            fetchByPostcode={fetchByPostcode}
            current={current}
            daily={daily}
            aqi={aqi}
            risk={risk}
            score={scoreData?.score ?? 0}
            riskLabel={scoreData?.riskLabel ?? { label: 'Loading…', color: '#22c55e' }}
            adviceLines={scoreData?.adviceLines ?? []}
            scoreBreakdown={scoreData?.breakdown ?? null}
            selectedMedications={selectedMedications}
            onOpenMedModal={() => setShowMedModal(true)}
          />
        </section>

        {/* ── Section 2: Plan your day ── */}
        <section
          id="sec1"
          style={{ height: '100vh', scrollSnapAlign: 'start', background: '#F0EDE8', overflow: 'hidden' }}
        >
          <HourlyForecastStrip
            hourly={hourly}
            daily={daily}
            nearestVenue={nearestVenue}
            uvInfo={uvInfo}
          />
        </section>

        {/* ── Section 3: Guidance cards ── */}
        <section
          id="sec2"
          style={{ height: '100vh', scrollSnapAlign: 'start', background: '#111A2C', overflow: 'hidden' }}
        >
          <DoThisAvoid riskLevel={risk?.level ?? 'Low'} />
        </section>

        {/* ── Section 4: Get help ── */}
        <section
          id="sec3"
          style={{ height: '100vh', scrollSnapAlign: 'start', overflow: 'hidden' }}
        >
          <GetHelpSection />
        </section>

        <Footer />
      </div>

      {/* ── Location modal ── */}
      {showLocModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, padding: '36px 32px 32px',
              maxWidth: 420, width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            {/* Pin icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1852B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 0 1 14 0c0 3.5-3 7-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
            </div>

            <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.625rem', color: '#0F0F0F', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Where are you?
            </h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.55, marginBottom: 24 }}>
              We need your location to show nearby cool spaces and personalise your heat risk.
            </p>

            {/* GPS button */}
            <button
              onClick={() => { setShowLocModal(false); requestGps() }}
              style={{ width: '100%', background: '#1852B4', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
            >
              Use my current location
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E3DF' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#9C9A96' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E5E3DF' }} />
            </div>

            {/* Postcode form */}
            <form
              style={{ display: 'flex', gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault()
                if (!locPostcode.trim()) return
                setShowLocModal(false)
                fetchByPostcode(locPostcode.trim())
              }}
            >
              <input
                type="text"
                value={locPostcode}
                onChange={(e) => setLocPostcode(e.target.value)}
                placeholder="Enter postcode (e.g. 3000)"
                style={{ flex: 1, border: '1.5px solid #E5E3DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#0F0F0F', outline: 'none', background: '#FAFAF9' }}
              />
              <button
                type="submit"
                style={{ background: '#0F0F0F', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Medication modal ── */}
      {showMedModal && (
        <div
          onClick={() => setShowMedModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FAF8F5', borderRadius: 20, padding: '20px 28px 28px',
              maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              animation: 'popIn .25s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            <style>{`@keyframes popIn{from{transform:scale(.9);opacity:0;}to{transform:scale(1);opacity:1;}}`}</style>

            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DDDBD7' }} />
            </div>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.625rem', color: '#0F0F0F', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                Find your heat profile
              </span>
              <button
                onClick={() => setShowMedModal(false)}
                style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0, marginLeft: 12 }}
              >
                ×
              </button>
            </div>

            {/* Subtitle */}
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: '#6B6B6B', marginBottom: 20, lineHeight: 1.5 }}>
              Tell us what medications you take for personalised heat advice.
            </p>

            <MedicationsSection
              selectedMedications={selectedMedications}
              onMedicationsChange={setSelectedMedications}
            />

            {/* Clear all */}
            <button
              onClick={() => setSelectedMedications([])}
              style={{ background: 'none', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#1852B4', cursor: 'pointer', padding: '14px 0 6px', textDecoration: 'underline', display: 'block' }}
            >
              Clear all choices
            </button>

            {/* CTA */}
            <button
              onClick={() => setShowMedModal(false)}
              style={{ width: '100%', background: '#0F0F0F', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: '-0.2px' }}
            >
              See my heat profile
            </button>
          </div>
        </div>
      )}
    </>
  )
}
