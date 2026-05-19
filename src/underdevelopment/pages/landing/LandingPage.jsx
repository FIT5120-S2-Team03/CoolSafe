/**
 * Landing page — root entry point of the app.
 * Matches the HTML prototype's page-landing layout:
 *   1. Hero card  — full-bleed video background, text + weather strip on the left
 *   2. Spotlight  — 4-card carousel with hand-drawn illustrations
 *   3. How it works — 3-step section with UI snippet cards
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWeatherData } from '../../hooks/useWeatherData'
import { useAirQuality } from '../../hooks/useAirQuality'
import { getRiskLevel } from '../../utils/riskLevel'
import Navbar from '../../components/layout/Navbar'
import { toggleAIFinder } from '../../components/ai/aiFinderEvents'
import StepRow from './components/StepRow'
import { SPOTLIGHT_CARDS } from './landingSpotlightCards'
import bgVideo from '../../../assets/landing page.mp4'

const UV_BY_RISK = {
  Low:      { index: 2 },
  Moderate: { index: 4 },
  High:     { index: 7 },
  Extreme:  { index: 10 },
}

const ARROW_BTN_STYLE = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
  width: 44, height: 44, borderRadius: '50%',
  border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(8px)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, color: 'var(--color-ink-soft)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
}

function onArrowEnter(e) {
  e.currentTarget.style.background = 'var(--color-surface)'
  e.currentTarget.style.color = 'var(--color-ink)'
  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'
  e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)'
}

function onArrowLeave(e) {
  e.currentTarget.style.background = 'rgba(255,255,255,0.92)'
  e.currentTarget.style.color = 'var(--color-ink-soft)'
  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'
  e.currentTarget.style.transform = 'translateY(-50%)'
}

function hoverShift({ enterBg, leaveBg, enterShadow, leaveShadow, enterBorder, leaveBorder } = {}) {
  return {
    onMouseEnter(e) {
      e.currentTarget.style.transform = 'translateY(-2px)'
      if (enterBg)     e.currentTarget.style.background  = enterBg
      if (enterShadow) e.currentTarget.style.boxShadow   = enterShadow
      if (enterBorder) e.currentTarget.style.borderColor = enterBorder
    },
    onMouseLeave(e) {
      e.currentTarget.style.transform = 'none'
      if (leaveBg)     e.currentTarget.style.background  = leaveBg
      if (leaveShadow) e.currentTarget.style.boxShadow   = leaveShadow
      if (leaveBorder) e.currentTarget.style.borderColor = leaveBorder
    },
  }
}

export default function LandingPage() {
  const { current, daily, locationName, lat, lng } = useWeatherData()
  const { aqi } = useAirQuality({ lat, lng })
  const [activeCard, setActiveCard] = useState(0)
  const [spotlightHover, setSpotlightHover] = useState(false)
  const videoRef = useRef(null)
  const spotlightRef = useRef(null)
  const timerRef = useRef(null)
  const isPausedRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    const tryPlay = () => video.play().catch(() => {})
    tryPlay()
    video.addEventListener('canplay', tryPlay)
    const events = ['pointerdown', 'scroll', 'keydown']
    events.forEach((e) => document.addEventListener(e, onInteraction, { once: true, passive: true }))
    function onInteraction() { tryPlay() }
    return () => {
      video.removeEventListener('canplay', tryPlay)
      events.forEach((e) => document.removeEventListener(e, onInteraction))
    }
  }, [])

  // Spotlight auto-advance: every 5 s, pause only while the user is hovering the carousel.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current && !document.hidden) {
        setActiveCard((i) => (i + 1) % SPOTLIGHT_CARDS.length)
      }
    }, 5000)
    return () => { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const risk   = current ? getRiskLevel(current.temp) : null
  const uvInfo = risk ? UV_BY_RISK[risk.level] : null
  return (
    <div className="cs-landing-page" style={{ background: 'var(--color-paper)', minHeight: '100vh' }}>
      <Navbar locationName={locationName} />

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — large card, video fills entire card, text overlaid left
      ══════════════════════════════════════════════════════════════════ */}
      <section className="cs-hero-section" style={{
        minHeight: 'calc(100vh - 64px)',
        padding: '92px var(--content-gutter) 36px',
        background: 'linear-gradient(180deg, var(--color-paper) 0%, #FBF9F6 68%, var(--color-warm) 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div className="cs-hero-card" style={{
          position: 'relative',
          maxWidth: 'var(--content-width)',
          width: '100%',
          minHeight: 'clamp(540px, 64vh, 620px)',
          background: 'linear-gradient(135deg, var(--color-paper-soft) 0%, #F4EBDD 100%)',
          borderRadius: 26,
          boxShadow: '0 24px 64px rgba(34,30,26,0.08), inset 0 0 0 1px rgba(255,255,255,0.72)',
          border: '1px solid rgba(229,220,200,0.78)',
          overflow: 'hidden',
        }}>

          {/* Left gradient overlay so text is readable over video */}
          <div className="cs-hero-overlay" style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(90deg, rgba(250,248,245,0.62) 0%, rgba(250,248,245,0.54) 36%, rgba(250,248,245,0.18) 56%, rgba(250,248,245,0) 100%), linear-gradient(0deg, rgba(250,248,245,0.16) 0%, rgba(250,248,245,0.04) 22%, rgba(250,248,245,0) 58%)',
            pointerEvents: 'none',
          }} />

          {/* Video background */}
          <div className="cs-hero-video-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit', overflow: 'hidden', background: 'var(--color-paper-warm)' }}>
            <video
              ref={videoRef}
              autoPlay muted loop playsInline
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '5% 20%',
                filter: 'saturate(1.08) brightness(0.99) contrast(1.06)',
                transform: 'translate(0, -2%) scale(1.15)',
                transformOrigin: '5% 20%',
              }}
              src={bgVideo}
            />
          </div>

          {/* Left text column */}
          <div className="cs-hero-text" style={{
            position: 'relative',
            zIndex: 3,
            width: 'min(76%, 960px)',
            minHeight: 'inherit',
            padding: 'clamp(42px,5vw,64px) clamp(28px,4vw,52px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0,
          }}>
            <h1 style={{
              fontFamily: 'var(--serif)',
              fontSize: 'var(--text-page-title)',
              lineHeight: 'var(--leading-display)',
              color: 'var(--color-ink)',
              marginBottom: 22,
              letterSpacing: 0,
              fontWeight: 700,
            }}>
              Heat safety for older<br />Melburnians
            </h1>

            <p style={{
              fontFamily: 'var(--sans)',
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
              color: 'var(--color-ink-muted)',
              marginBottom: 26,
              maxWidth: 400,
            }}>
              Understand today's conditions, manage medication risks, and plan safer routines in extreme heat.
            </p>

            {/* Weather climate strip */}
            <div className="cs-hero-conditions" style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto auto auto',
              alignItems: 'stretch',
              width: 'min(100%, 360px)',
              maxWidth: 360,
              marginBottom: 30,
              padding: 9,
              border: '1px solid rgba(229,220,200,0.9)',
              borderRadius: 20,
              background: 'rgba(255,252,246,0.78)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 14px 34px rgba(34,30,26,0.07)',
            }}>
              <span style={{
                gridColumn: '1 / -1',
                fontFamily: 'var(--mono)',
                fontSize: 'var(--text-caption)',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                padding: '2px 8px 9px',
              }}>Today's conditions</span>

              {[
                { value: current ? `${Math.round(current.apparentTemp)}°C` : '--°C', label: 'Feels like' },
                { value: daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '--°C', label: 'Peak today' },
                { value: aqi != null ? String(aqi) : '--', label: 'AQI' },
                { value: uvInfo ? String(uvInfo.index) : '--', label: 'UVI' },
              ].map(({ value, label }, i) => (
                <div key={label} style={{
                  minWidth: 0,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(229,220,200,0.9)',
                  padding: '8px 14px',
                }}>
                  <span style={{ display: 'block', fontFamily: 'var(--serif)', color: 'var(--color-ink-strong)', fontSize: 'clamp(1.1rem, 1.5vw, 1.35rem)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {value}
                  </span>
                  <span style={{ display: 'block', marginTop: 5, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', lineHeight: 1.15, letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="cs-hero-cta" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/today')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--color-terracotta-deep)',
                  color: '#fff',
                  padding: '13px 24px',
                  borderRadius: 50,
                  fontFamily: 'var(--sans)',
                  fontWeight: 600,
                  fontSize: 'var(--text-label)',
                  border: '1px solid rgba(138,63,40,0.22)',
                  cursor: 'pointer',
                  boxShadow: '0 10px 24px rgba(138,63,40,0.16)',
                  transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
                }}
                {...hoverShift({ enterBg: 'var(--color-brick)', leaveBg: 'var(--color-terracotta-deep)' })}
              >
                Check today's heat risk
                <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. SPOTLIGHT — carousel with illustrations
      ══════════════════════════════════════════════════════════════════ */}
      <section ref={spotlightRef} className="cs-spotlight-section" style={{ padding: 'clamp(64px,9vh,100px) var(--content-gutter)', background: 'linear-gradient(180deg, var(--color-warm) 0%, var(--color-paper) 100%)' }}>
        <div style={{ maxWidth: 'var(--content-width)', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'var(--text-section)',
            lineHeight: 'var(--leading-title)',
            letterSpacing: 'var(--tracking-title)',
            color: 'var(--color-ink)',
            textAlign: 'center',
            marginBottom: 16,
            fontWeight: 700,
          }}>
            Heat doesn't always feel dangerous.
          </h2>
          <p className="cs-spotlight-subtitle" style={{
            fontFamily: 'var(--sans)',
            fontSize: 'var(--text-body-sm)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--color-ink-soft)',
            textAlign: 'center',
            maxWidth: 640,
            margin: '0 auto 52px',
          }}>
            Small changes in hydration, medication, and body temperature can become harder to notice with age.
          </p>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => { setSpotlightHover(true); isPausedRef.current = true }}
            onMouseLeave={() => { setSpotlightHover(false); isPausedRef.current = false }}
          >
            {/* Prev arrow */}
            {SPOTLIGHT_CARDS.length > 1 && (
              <button
                className="cs-spotlight-arrow"
                onClick={() => setActiveCard((i) => (i - 1 + SPOTLIGHT_CARDS.length) % SPOTLIGHT_CARDS.length)}
                aria-label="Previous"
                style={{ ...ARROW_BTN_STYLE, left: -80 }}
                onMouseEnter={onArrowEnter}
                onMouseLeave={onArrowLeave}
              >←</button>
            )}
            {/* Next arrow */}
            {SPOTLIGHT_CARDS.length > 1 && (
              <button
                className="cs-spotlight-arrow"
                onClick={() => setActiveCard((i) => (i + 1) % SPOTLIGHT_CARDS.length)}
                aria-label="Next"
                style={{ ...ARROW_BTN_STYLE, right: -80 }}
                onMouseEnter={onArrowEnter}
                onMouseLeave={onArrowLeave}
              >→</button>
            )}

            {/* Card */}
            <div style={{ overflow: 'hidden', borderRadius: 22, border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: spotlightHover ? '0 30px 70px rgba(34,30,26,0.12)' : '0 22px 54px rgba(34,30,26,0.07)', transform: spotlightHover ? 'translateY(-5px)' : 'translateY(0)', transition: 'transform 0.24s ease, box-shadow 0.24s ease' }}>
              <div style={{
                display: 'flex',
                width: `${SPOTLIGHT_CARDS.length * 100}%`,
                transform: `translateX(-${activeCard * (100 / SPOTLIGHT_CARDS.length)}%)`,
                transition: 'transform 0.65s cubic-bezier(.22,.61,.36,1)',
                willChange: 'transform',
              }}>
                {SPOTLIGHT_CARDS.map((card) => (
                  <div key={card.tag} className="cs-spotlight-card" style={{ flex: `0 0 ${100 / SPOTLIGHT_CARDS.length}%`, display: 'grid', gridTemplateColumns: '1fr 1fr', height: 440, background: card.bg }}>
                    {/* Left — text */}
                    <div className="cs-spotlight-text" style={{ padding: 'clamp(28px,3.5vw,52px) clamp(24px,3vw,44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: 'var(--text-caption)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, background: 'var(--color-surface)', border: '0.5px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderRadius: 20, padding: '5px 13px', width: 'fit-content' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.tagColor, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-ink)' }}>{card.tag}</span>
                      </p>
                      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-card-title)', lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-title)', color: 'var(--color-ink)', fontWeight: 'normal' }}>
                        {card.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-ink-soft)' }}>
                        {card.body}
                      </p>
                    </div>

                    {/* Right — illustration */}
                    <div className="cs-spotlight-image" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(22px,3vw,42px)' }}>
                      <img
                        src={card.img}
                        alt={card.title}
                        style={{ position: 'relative', zIndex: 1, width: 'min(100%, 540px)', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 18, boxShadow: '0 14px 32px rgba(34,30,26,0.08)', filter: 'saturate(0.99) contrast(0.99)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              {SPOTLIGHT_CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCard(i)}
                  style={{
                    width: i === activeCard ? 22 : 7,
                    height: 7,
                    borderRadius: i === activeCard ? 4 : '50%',
                    background: i === activeCard ? 'var(--color-ink)' : 'rgba(0,0,0,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.22s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. HOW IT WORKS — 3 steps, vertical stack, alternating layout
             Big decorative numbers, tilted UI snippet cards
      ══════════════════════════════════════════════════════════════════ */}
      <section className="cs-steps-section" style={{ padding: 'clamp(42px,6vh,64px) var(--content-gutter)', background: 'var(--color-paper)' }}>
        <div style={{ maxWidth: 'var(--content-width)', margin: '0 auto' }}>
          <h2 className="cs-steps-heading" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-section)', fontWeight: 700, lineHeight: 'var(--leading-title)', letterSpacing: 'var(--tracking-title)', color: 'var(--color-ink)', textAlign: 'center', marginBottom: 48 }}>
            How CoolSafer helps day to day.
          </h2>

          <div className="cs-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(62px, 6vw, 78px)', padding: '10px 0 42px' }}>

            {/* ── Step 1 ── */}
            <StepRow
              num="1"
              numColor="rgba(201,75,26,0.15)"
              numRight={false}
              reverse={false}
              title="See your personalised heat outlook"
              desc="Check today's heat conditions, medication-related risks, and simple guidance for staying safe."
              actions={
                <Link
                  to="/today"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'var(--color-terracotta-deep)', color: '#fff', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', boxShadow: '0 10px 24px rgba(138,63,40,0.16)', transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s' }}
                  {...hoverShift({ enterBg: 'var(--color-brick)', leaveBg: 'var(--color-terracotta-deep)', enterShadow: '0 14px 30px rgba(138,63,40,0.22)', leaveShadow: '0 10px 24px rgba(138,63,40,0.16)' })}
                >
                  Check today's heat risk <span>→</span>
                </Link>
              }
              rotateCard={3}
              snippetShiftX={-96}
              snippet={
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                      <svg width="52" height="52" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6"/>
                        <circle cx="40" cy="40" r="33" fill="none" stroke="#B87200" strokeWidth="6" strokeLinecap="round" strokeDasharray="207.3" strokeDashoffset="60" transform="rotate(-90 40 40)"/>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--color-amber)', letterSpacing: '-0.5px', lineHeight: 1 }}>72</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink)', fontWeight: 600 }}>Moderate risk</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(201,75,26,0.08)', color: 'var(--color-orange)', fontFamily: 'var(--mono)', fontSize: 'var(--text-caption)', padding: '4px 10px', borderRadius: 20, width: 'fit-content', whiteSpace: 'nowrap' }}>
                        <i className="ti ti-info-circle" style={{ fontSize: 13 }} /> Medications added
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            {/* ── Step 2 ── */}
            <StepRow
              num="2"
              numColor="rgba(42,125,79,0.12)"
              numRight={true}
              reverse={true}
              title="Find cooler places that fit your day"
              desc="Browse nearby cool spaces yourself, or get personalised suggestions based on comfort, accessibility, and local activities."
              actions={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link to="/spaces" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'transparent', color: 'var(--color-ink)', border: '1px solid var(--color-ink-disabled)', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                    {...hoverShift({ enterBg: 'var(--color-warm)', leaveBg: 'transparent', enterBorder: 'var(--color-ink)', leaveBorder: 'var(--color-ink-disabled)' })}
                  >Browse spaces <span>→</span></Link>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-label)', color: 'var(--color-ink-disabled)', fontStyle: 'italic', padding: '0 4px' }}>or</span>
                  <button type="button" onClick={toggleAIFinder} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'var(--color-ai)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 10px 24px rgba(80,112,200,0.18)' }}
                    {...hoverShift({ enterBg: 'var(--color-ai-deep)', leaveBg: 'var(--color-ai)' })}
                  ><i className="ti ti-sparkles" /> Find with AI</button>
                </div>
              }
              textShiftX={72}
              rotateCard={-3}
              snippetShiftX={48}
              snippet={
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'var(--color-warm)', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                    Finding cool spaces near you. Any accessibility needs?
                  </div>
                  <div style={{ alignSelf: 'flex-end', background: 'var(--color-ai)', color: '#fff', padding: '9px 14px', borderRadius: '14px 14px 4px 14px', fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', fontWeight: 500, boxShadow: '0 4px 12px rgba(80,112,200,0.2)' }}>
                    Wheelchair accessible
                  </div>
                </div>
              }
            />

            {/* ── Step 3 ── */}
            <StepRow
              num="3"
              numColor="rgba(91,122,140,0.14)"
              numRight={false}
              reverse={false}
              title="Check symptoms if something feels off"
              desc="Use the symptom checker to spot heat warning signs and see what to do next."
              actions={
                <Link
                  to="/health"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'var(--color-dustblue-deep)', color: '#fff', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', boxShadow: '0 10px 24px rgba(30,70,90,0.16)', transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s' }}
                  {...hoverShift({ enterBg: 'var(--color-dustblue)', leaveBg: 'var(--color-dustblue-deep)', enterShadow: '0 14px 30px rgba(30,70,90,0.22)', leaveShadow: '0 10px 24px rgba(30,70,90,0.16)' })}
                >
                  Check symptoms <span>→</span>
                </Link>
              }
              rotateCard={2.6}
              snippetShiftX={-96}
              snippet={
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--color-dustblue-pale)', color: 'var(--color-dustblue-deep)', fontFamily: 'var(--mono)', fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <i className="ti ti-medical-cross" /> Heat signs
                    </div>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--color-dustblue-soft)', color: 'var(--color-dustblue-deep)' }}>
                      <i className="ti ti-heartbeat" />
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {[
                      { label: 'Dizziness', icon: 'airline_seat_recline_normal', active: true },
                      { label: 'Headache', icon: 'sentiment_very_dissatisfied', active: false },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          minHeight: 64,
                          borderRadius: 14,
                          border: item.active ? '1.5px solid var(--color-dustblue-deep)' : '1px solid rgba(34,30,26,0.10)',
                          background: item.active ? 'var(--color-dustblue-pale)' : '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? 'var(--color-dustblue-deep)' : 'var(--color-ink-faint)' }}>{item.icon}</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', fontWeight: 700, color: item.active ? 'var(--color-dustblue-deep)' : 'var(--color-ink)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderRadius: 14, background: 'rgba(232,240,245,0.72)', border: '1px solid var(--color-dustblue-soft)', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--color-dustblue-deep)', marginBottom: 4 }}>
                      Cool down and rest.
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)', lineHeight: 1.35 }}>
                      Sit somewhere cool, sip water, and watch for symptoms getting worse.
                    </div>
                  </div>
                </div>
              }
            />

          </div>
        </div>
      </section>

    </div>
  )
}
