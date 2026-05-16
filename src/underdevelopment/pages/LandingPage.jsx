/**
 * Landing page — root entry point of the app.
 * Matches the HTML prototype's page-landing layout:
 *   1. Hero card  — full-bleed video background, text + weather strip on the left
 *   2. Spotlight  — 4-card carousel with hand-drawn illustrations
 *   3. How it works — 2-step section with UI snippet cards
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWeatherData } from '../hooks/useWeatherData'
import { useAirQuality } from '../hooks/useAirQuality'
import { getRiskLevel } from '../utils/riskLevel'
import Navbar from '../components/layout/Navbar'
import { toggleAIFinder } from '../components/ai/AIFinderButton'
import bgVideo from '../../assets/8939276-uhd_3840_2160_25fps.mp4'

const UV_BY_RISK = {
  Low:      { index: 2 },
  Moderate: { index: 4 },
  High:     { index: 7 },
  Extreme:  { index: 10 },
}

const SPOTLIGHT_CARDS = [
  {
    tag: 'Indoor heat',
    tagColor: 'var(--color-terracotta)',
    title: "Staying home doesn't mean staying safe.",
    body: "During Victoria's 2009 heatwave, most deaths happened indoors. An unventilated room can exceed outdoor temperatures by midday — making home feel safe while the risk quietly climbs.",
    img: '/spotlight-indoor.png',
    bg: 'linear-gradient(135deg, #FDF0E8, #FFF8EC)',
  },
  {
    tag: 'Body signals',
    tagColor: 'var(--color-dustblue)',
    title: "You won't feel heat stroke coming.",
    body: "The body's temperature sensing dulls with age. By the time an older adult notices something is wrong, they may already be in heat exhaustion. There's rarely a clear warning signal.",
    img: '/spotlight-body-signals.png',
    bg: 'linear-gradient(135deg, var(--color-dustblue-pale), #FAF8F5)',
  },
  {
    tag: 'Medications',
    tagColor: 'var(--color-green)',
    title: "Some medications can change heat risk.",
    body: "Some blood pressure medicines, diuretics, antidepressants, and other regular medications can affect sweating, hydration, or how the body handles heat. CoolSafer factors this into your risk score.",
    img: '/spotlight-medications.png',
    bg: 'linear-gradient(135deg, #EDF5EE, #FFF8EC)',
  },
  {
    tag: 'Hydration',
    tagColor: 'var(--color-olive)',
    title: "Not feeling thirsty doesn't always mean you're hydrated.",
    body: "Thirst can become less reliable with age. Older adults may become dehydrated before they feel a strong urge to drink, so regular water breaks matter when heat builds.",
    img: '/spotlight-hydration.png',
    bg: 'linear-gradient(135deg, #F5F0EA, #F8F4EA)',
  },
]

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
    <div style={{ background: 'var(--color-paper)', minHeight: '100vh' }}>
      <Navbar locationName={locationName} />

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — large card, video fills entire card, text overlaid left
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        padding: '92px var(--content-gutter) 36px',
        background: 'linear-gradient(180deg, var(--color-paper) 0%, #FBF9F6 68%, var(--color-warm) 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
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
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(90deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.78) 36%, rgba(250,248,245,0.18) 56%, rgba(250,248,245,0) 100%), linear-gradient(0deg, rgba(250,248,245,0.16) 0%, rgba(250,248,245,0.04) 22%, rgba(250,248,245,0) 58%)',
            pointerEvents: 'none',
          }} />

          {/* Video background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 'inherit', overflow: 'hidden', background: 'var(--color-paper-warm)' }}>
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
                transform: 'translate(1%, -2%) scale(1.15)',
                transformOrigin: '5% 20%',
              }}
              src={bgVideo}
            />
          </div>

          {/* Left text column */}
          <div style={{
            position: 'relative',
            zIndex: 3,
            width: 'min(62%, 700px)',
            minHeight: 'inherit',
            padding: 'clamp(42px,5vw,64px) clamp(28px,4vw,52px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0,
          }}>
            <h1 style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(3rem, 4.3vw, 4.35rem)',
              lineHeight: 0.98,
              color: 'var(--color-ink)',
              marginBottom: 22,
              letterSpacing: 0,
              fontWeight: 'normal',
            }}>
              Heat safety for older Melburnians.
            </h1>

            <p style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(1rem, 1.15vw, 1.125rem)',
              lineHeight: 1.62,
              color: 'var(--color-ink-muted)',
              marginBottom: 26,
              maxWidth: 500,
            }}>
              Understand today’s conditions, manage medication risks, and plan safer routines in extreme heat.
            </p>

            {/* Weather climate strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(92px,1fr) minmax(100px,1fr) minmax(54px,0.62fr) minmax(82px,0.88fr)',
              alignItems: 'stretch',
              width: 'min(100%, 500px)',
              maxWidth: 500,
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
                  padding: '8px 10px',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-brick)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-terracotta-deep)'; e.currentTarget.style.transform = 'none' }}
              >
                See today’s outlook
                <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. SPOTLIGHT — carousel with illustrations
      ══════════════════════════════════════════════════════════════════ */}
      <section ref={spotlightRef} style={{ padding: 'clamp(64px,9vh,100px) var(--content-gutter)', background: 'linear-gradient(180deg, var(--color-warm) 0%, var(--color-paper) 100%)' }}>
        <div style={{ maxWidth: 'var(--content-width)', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'var(--text-section)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            Heat doesn’t always feel dangerous.
          </h2>
          <p style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(0.9375rem, 1.2vw, 1.0625rem)',
            lineHeight: 1.7,
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
                onClick={() => setActiveCard((i) => (i - 1 + SPOTLIGHT_CARDS.length) % SPOTLIGHT_CARDS.length)}
                aria-label="Previous"
                style={{ position: 'absolute', left: -80, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--color-ink-soft)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = 'var(--color-ink-soft)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-50%)' }}
              >←</button>
            )}
            {/* Next arrow */}
            {SPOTLIGHT_CARDS.length > 1 && (
              <button
                onClick={() => setActiveCard((i) => (i + 1) % SPOTLIGHT_CARDS.length)}
                aria-label="Next"
                style={{ position: 'absolute', right: -80, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--color-ink-soft)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = 'var(--color-ink-soft)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-50%)' }}
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
                  <div key={card.tag} style={{ flex: `0 0 ${100 / SPOTLIGHT_CARDS.length}%`, display: 'grid', gridTemplateColumns: '1fr 1fr', height: 440, background: card.bg }}>
                    {/* Left — text */}
                    <div style={{ padding: 'clamp(28px,3.5vw,52px) clamp(24px,3vw,44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: 'var(--text-caption)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, background: 'var(--color-surface)', border: '0.5px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderRadius: 20, padding: '5px 13px', width: 'fit-content' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.tagColor, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-ink)' }}>{card.tag}</span>
                      </p>
                      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.25rem, 1.6vw, 1.75rem)', lineHeight: 1.12, letterSpacing: '-0.3px', color: 'var(--color-ink)', fontWeight: 'normal' }}>
                        {card.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(1rem, 0.95vw, 1.125rem)', lineHeight: 1.7, color: 'var(--color-ink-soft)' }}>
                        {card.body}
                      </p>
                    </div>

                    {/* Right — illustration */}
                    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(22px,3vw,42px)' }}>
                      <div style={{ position: 'absolute', inset: 'clamp(22px,3vw,42px)', borderRadius: 22, background: 'rgba(255,252,246,0.5)', border: '1px solid rgba(229,220,200,0.72)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.52)' }} />
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
          3. HOW IT WORKS — 2 steps, vertical stack, alternating layout
             Big decorative numbers, tilted UI snippet cards
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px,9vh,100px) var(--content-gutter)', background: 'var(--color-paper)' }}>
        <div style={{ maxWidth: 'var(--content-width)', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--text-section)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--color-ink)', textAlign: 'center', marginBottom: 20 }}>
            How CoolSafer helps day to day.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 100, padding: '40px 0 80px' }}>

            {/* ── Step 1 ── */}
            <StepRow
              num="1"
              numColor="rgba(201,75,26,0.15)"
              numRight={false}
              reverse={false}
              title="See your personalised heat outlook"
              desc="Check today’s heat conditions, medication-related risks, and simple guidance for staying safe."
              actions={
                <Link
                  to="/today"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'var(--color-terracotta-deep)', color: '#fff', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', boxShadow: '0 10px 24px rgba(138,63,40,0.16)', transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-brick)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(138,63,40,0.22)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-terracotta-deep)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(138,63,40,0.16)' }}
                >
                  Check today's heat risk <span>→</span>
                </Link>
              }
              rotateCard={3}
              snippetShiftX={-128}
              snippet={
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6"/>
                        <circle cx="40" cy="40" r="33" fill="none" stroke="#B87200" strokeWidth="6" strokeLinecap="round" strokeDasharray="207.3" strokeDashoffset="60" transform="rotate(-90 40 40)"/>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--color-amber)', letterSpacing: '-0.5px', lineHeight: 1 }}>72</div>
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink)', fontWeight: 500 }}>Moderate risk</div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,75,26,0.08)', color: 'var(--color-orange)', fontFamily: 'var(--mono)', fontSize: 'var(--text-caption)', padding: '5px 12px', borderRadius: 20, marginTop: 16 }}>
                    <i className="ti ti-pill" /> Medications added
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
                  <Link to="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'transparent', color: 'var(--color-ink)', border: '1px solid var(--color-ink-disabled)', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-ink)'; e.currentTarget.style.background = 'var(--color-warm)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-ink-disabled)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none' }}
                  >Browse the map <span>→</span></Link>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-label)', color: 'var(--color-ink-disabled)', fontStyle: 'italic', padding: '0 4px' }}>or</span>
                  <button type="button" onClick={toggleAIFinder} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 50, background: 'var(--color-blue)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--text-body-sm)', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-blue-deep, #0E3D8F)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-blue)'; e.currentTarget.style.transform = 'none' }}
                  ><i className="ti ti-sparkles" /> Find with AI</button>
                </div>
              }
              rotateCard={-3}
              textShiftX={32}
              snippet={
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(24,82,180,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--color-blue)', marginBottom: 12 }}>
                    <i className="ti ti-sparkles" />
                  </div>
                  <div style={{ background: 'var(--color-warm)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', color: 'var(--color-ink)', marginBottom: 12, lineHeight: 1.5 }}>
                    Finding cool spaces near you. Any accessibility needs?
                  </div>
                  <div style={{ alignSelf: 'flex-end', background: 'var(--color-blue)', color: '#fff', padding: '10px 16px', borderRadius: '16px 16px 4px 16px', fontFamily: 'var(--sans)', fontSize: 'var(--text-caption)', fontWeight: 500, boxShadow: '0 4px 12px rgba(24,82,180,0.2)' }}>
                    Wheelchair accessible
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

// ── Step row: decorative number + body + tilted UI card ──────────────────────

function StepRow({ num, numColor, numRight, reverse, title, desc, actions, rotateCard, snippet, textShiftX = 0, snippetShiftX = 0 }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 60, position: 'relative', flexDirection: reverse ? 'row-reverse' : 'row' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative oversized background number */}
      <div style={{
        position: 'absolute',
        top: -70,
        [numRight ? 'right' : 'left']: 0,
        fontFamily: 'var(--serif)',
        fontSize: 'clamp(8rem, 12vw, 14rem)',
        lineHeight: 1,
        color: numColor,
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {num}
      </div>

      {/* Text body */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, paddingLeft: reverse ? 0 : 128, transform: textShiftX ? `translateX(${textShiftX}px)` : 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', letterSpacing: '-0.5px', color: 'var(--color-ink)', lineHeight: 1.1, fontWeight: 'normal' }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--text-body)', lineHeight: 1.65, color: 'var(--color-ink-soft)', maxWidth: 480 }}>
          {desc}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
          {actions}
        </div>
      </div>

      {/* Tilted UI snippet card */}
      <div style={{ flex: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1, transform: snippetShiftX ? `translateX(${snippetShiftX}px)` : 'none' }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 20,
          boxShadow: hovered
            ? '0 32px 64px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)'
            : '0 24px 48px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)',
          transform: hovered ? `rotate(0deg) translateY(-8px)` : `rotate(${rotateCard}deg)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
          width: '100%',
          maxWidth: 300,
        }}>
          {snippet}
        </div>
      </div>
    </div>
  )
}
