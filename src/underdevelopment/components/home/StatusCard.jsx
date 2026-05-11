/**
 * Section 1 — full-screen status hero.
 * Always renders video background + slogan so the page is visible behind the
 * location modal. The glass panel is only shown once current data is available.
 */
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAqiInfo } from '../../utils/riskLevel'
import { MED_ADVICE } from '../../utils/scoreCalculator'
import bgVideo from '../../../assets/bg-video-1.mp4'

const RISK_ACCENT = {
  Low:      { rgb: '111,207,151' },
  Moderate: { rgb: '242,201,76' },
  High:     { rgb: '235,87,87' },
  Extreme:  { rgb: '220,38,38' },
}

const UV_BY_RISK = {
  Low:      { index: 2,  label: 'Low' },
  Moderate: { index: 4,  label: 'Moderate' },
  High:     { index: 7,  label: 'High' },
  Extreme:  { index: 10, label: 'Very High' },
}

const DARK_BG = 'linear-gradient(135deg,#0D2B1F 0%,#0F1F2E 55%,#130d0a 100%)'

function fmtPts(n) {
  return `${n >= 0 ? '+' : ''}${n}`
}

export default function StatusCard({
  loading, error, gpsBlocked, fetchByPostcode,
  current, daily, aqi, risk,
  score, riskLabel, adviceLines, scoreBreakdown,
  selectedMedications, onOpenMedModal,
}) {
  const [postcode, setPostcode] = useState('')
  const [showScoreTooltip, setShowScoreTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState(null)
  const tooltipBtnRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // React doesn't reliably set the `muted` attribute on video elements via JSX props.
    // Setting it imperatively ensures the browser sees the video as muted,
    // which is required for autoplay without a user gesture.
    video.muted = true

    const tryPlay = () => video.play().catch(() => {})

    // Try immediately and when buffered
    tryPlay()
    video.addEventListener('canplay', tryPlay)

    // Browsers (especially Safari) block autoplay without a prior user gesture.
    // When location is cached and no modal shows, there is no gesture on load,
    // so we retry on the first interaction the user makes.
    const onFirstInteraction = () => tryPlay()
    const interactionEvents = ['pointerdown', 'scroll', 'keydown']
    interactionEvents.forEach((e) =>
      document.addEventListener(e, onFirstInteraction, { once: true, passive: true })
    )

    // Also resume when the tab becomes visible again
    const onVisibilityChange = () => { if (!document.hidden) tryPlay() }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      video.removeEventListener('canplay', tryPlay)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      interactionEvents.forEach((e) =>
        document.removeEventListener(e, onFirstInteraction)
      )
    }
  }, [])

  const activeMeds = selectedMedications ?? []
  const hasMeds = activeMeds.length > 0
  const medTips = activeMeds.map((med) => MED_ADVICE[med]).filter(Boolean)

  const aqiInfo  = aqi  != null ? getAqiInfo(aqi) : null
  const accent   = risk ? RISK_ACCENT[risk.level] : RISK_ACCENT.Low
  const uvInfo   = risk ? UV_BY_RISK[risk.level]  : null

  function handleTooltipEnter() {
    if (tooltipBtnRef.current) {
      const r = tooltipBtnRef.current.getBoundingClientRect()
      setTooltipPos({
        right:  window.innerWidth  - r.right,
        bottom: window.innerHeight - r.top + 10,
      })
    }
    setShowScoreTooltip(true)
  }

  return (
    <div style={{ width: '100%', height: '100%', background: DARK_BG, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Background video */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.35 }}
          src={bgVideo}
        />
      </div>

      {/* Top — Slogan (always visible behind the location modal) */}
      <div style={{ flex: '0 0 64vh', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', padding: '0 30px 24px' }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 'clamp(1.75rem,3.5vw,3rem)', color: '#fff', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 12 }}>
            Know the heat.<br />Enjoy your day.
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Heat is the deadliest natural hazard in Australia.{' '}
            <Link to="/why" style={{ color: '#6fcf97', textDecoration: 'underline' }}>Read why</Link>
          </div>
        </div>
      </div>

      {/* Bottom — conditional on data state */}
      {loading ? (
        <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,16,26,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <style>{`@keyframes cs-spin{to{transform:rotate(360deg);}}`}</style>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'cs-spin 1s linear infinite' }} />
        </div>

      ) : current ? (
        <div style={{ flex: 1, position: 'relative', zIndex: 2, minHeight: 0, background: 'rgba(8,16,26,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '22px 64px 26px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Three-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', gap: 28, alignItems: 'stretch', flex: 1, minHeight: 0 }}>

            {/* ── Left: Weather data ── */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '3.625rem', color: '#fff', lineHeight: 1, letterSpacing: '-3px' }}>
                  {Math.round(current.apparentTemp)}°C
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
                  Feels Like
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Peak today',  value: daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '—',   color: '#fff' },
                  { label: 'Air quality', value: aqi != null ? `AQI ${aqi}` : '—',                                    color: aqiInfo?.color ?? '#fff' },
                  { label: 'UV Index',    value: uvInfo ? `${uvInfo.index} · ${uvInfo.label}` : '—',                  color: uvInfo?.index >= 6 ? '#f2c94c' : '#fff' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', fontWeight: 600, color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Center: Risk score ── */}
            <div style={{ background: `rgba(${accent.rgb},0.07)`, border: `1px solid rgba(${accent.rgb},0.2)`, borderRadius: 16, padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, overflow: 'hidden' }}>

              {/* Score label + progress bar + ? button */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: riskLabel.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.1875rem', fontWeight: 800, color: riskLabel.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {riskLabel.label}
                  </span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.9375rem', color: `rgba(${accent.rgb},0.6)` }}>
                    {score} / 100
                  </span>
                  <button
                    ref={tooltipBtnRef}
                    onMouseEnter={handleTooltipEnter}
                    onMouseLeave={() => setShowScoreTooltip(false)}
                    style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                  >
                    ?
                  </button>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', background: riskLabel.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Insight text */}
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.55 }}>
                {adviceLines[0] ?? ''}
              </div>

              {/* medQuickTips */}
              <div style={{ display: hasMeds ? 'block' : 'none', background: 'rgba(255,199,80,0.1)', border: '1px solid rgba(255,199,80,0.25)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,199,80,0.85)', marginBottom: 8 }}>
                  💊 Quick Tips for you
                </div>
                <ul style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
                  {medTips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: `rgba(${accent.rgb},0.12)`, border: `1px solid rgba(${accent.rgb},0.25)`, fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', fontWeight: 600, color: riskLabel.color }}>
                  ✓ Heat: {risk?.level ?? '—'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  ☁ Air: {aqiInfo ? aqiInfo.label : '—'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  ☀ UV: {uvInfo ? uvInfo.label : '—'}
                </span>
              </div>
            </div>

            {/* ── Right: CTA card ── */}
            <div
              onClick={onOpenMedModal}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              style={{ background: '#1852B4', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, cursor: 'pointer', transition: 'opacity 0.2s' }}
            >
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
                  Personalise
                </div>
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.375rem', color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  Get your personal risk profile
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                Add your health profile and medications for a score tailored to you.
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenMedModal() }}
                style={{ background: '#fff', color: '#1852B4', border: 'none', padding: '12px 16px', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'center' }}
              >
                Edit Personal Profile →
              </button>
            </div>

          </div>
        </div>

      ) : gpsBlocked ? (
        <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,16,26,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 400 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', color: '#fff', textAlign: 'center', lineHeight: 1.6 }}>
              Enter your postcode to get local heat conditions
            </p>
            <form
              style={{ display: 'flex', gap: 12, width: '100%' }}
              onSubmit={(e) => { e.preventDefault(); fetchByPostcode(postcode) }}
            >
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. 3000"
                style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 10, padding: '0 16px', fontSize: '1rem', fontFamily: "'DM Sans',sans-serif", outline: 'none', minHeight: 48 }}
              />
              <button
                type="submit"
                style={{ background: '#fff', color: '#1e293b', border: 'none', borderRadius: 10, padding: '0 24px', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '1rem', minHeight: 48, cursor: 'pointer' }}
              >
                Search
              </button>
            </form>
          </div>
        </div>

      ) : null}

      {/* Scroll hint — only when data is loaded and no meds selected */}
      {current && !hasMeds && (
        <div
          onClick={() => document.getElementById('sec1')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', zIndex: 10 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8l5 5 5-5" />
          </svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Scroll
          </span>
        </div>
      )}

      {/* Score breakdown tooltip — fixed-positioned so it escapes overflow:hidden */}
      {showScoreTooltip && tooltipPos && scoreBreakdown && (
        <div
          style={{
            position: 'fixed',
            right: tooltipPos.right,
            bottom: tooltipPos.bottom,
            zIndex: 9999,
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '16px 20px',
            minWidth: 248,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 14 }}>
            How your score is calculated
          </div>
          {[
            { label: 'Weather heat risk', pts: scoreBreakdown.weatherPts },
            { label: 'Time of day',       pts: scoreBreakdown.timePts },
            { label: 'Medication risk',   pts: scoreBreakdown.medPts },
          ].map(({ label, pts }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.9375rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{fmtPts(pts)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 2 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Total score</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '1.25rem', color: riskLabel.color, fontWeight: 700 }}>{score}</span>
          </div>
        </div>
      )}
    </div>
  )
}
