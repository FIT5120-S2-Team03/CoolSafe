/**
 * Full-width hero banner displaying current air temperature (2 m), risk level,
 * and safety advice. Handles GPS, postcode fallback, loading, and error states.
 */
import { useState, useEffect } from 'react'
import { useWeatherData } from '../../hooks/useWeatherData'
import { getRiskLevel } from '../../utils/riskLevel'
import { TYPOGRAPHY } from '../../styles/typography'

const BANNER_IMAGES = {
  Low:      'https://images.unsplash.com/photo-1585003387496-7ef0cc60267d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Moderate: 'https://images.unsplash.com/photo-1514810771018-276192729582?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  High:     'https://images.unsplash.com/photo-1627716092978-629cc2fb2858?q=80&w=1288&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Extreme:  'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
}

const SOLID_COLORS = {
  Low:      '#16a34a',
  Moderate: '#d97706',
  High:     '#ea580c',
  Extreme:  '#dc2626',
}

/** Segments per half of the seamless loop; wide screens need many repeats to fill the bar */
const MARQUEE_SEGMENTS_PER_HALF = 28

const ADVICE = {
  Low: {
    line1: 'Conditions are safe today.',
    line2: 'Stay hydrated and enjoy your day.',
  },
  Moderate: {
    line1: 'It is warm today. Drink water regularly.',
    line2: 'Avoid going out during peak hours.',
  },
  High: {
    line1: 'Heat is dangerous. Limit outdoor activity.',
    line2: 'Find a cool space if you feel unwell.',
  },
  Extreme: {
    line1: 'It is currently dangerous to stay indoors without cooling.',
    line2: 'Find a safe cooling space immediately.',
  },
}

export default function HeatRiskBanner({ onCoordsReady }) {
  const { current, hourly, daily, locationName, loading, error, gpsBlocked, fetchByPostcode, lat, lng } =
    useWeatherData()
  const [postcode, setPostcode] = useState('')

  useEffect(() => {
    if (lat != null && lng != null) {
      onCoordsReady?.(lat, lng, current, hourly, daily, locationName)
    }
  }, [lat, lng, current, hourly, daily])

  if (loading) {
    return (
      <div
        className="relative w-full flex items-center justify-center bg-[#1e293b]"
        style={{ height: '531px' }}
      >
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="relative w-full flex items-center justify-center bg-[#1e293b]"
        style={{ height: '531px' }}
      >
        <p className="font-['Public_Sans'] text-[20px] text-white text-center px-6">
          Unable to load weather data. Please try again.
        </p>
      </div>
    )
  }

  if (gpsBlocked && !current) {
    return (
      <div
        className="relative w-full flex items-center justify-center bg-[#1e293b]"
        style={{ height: '531px' }}
      >
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-[400px]">
          <p className="font-['Lexend'] text-[16px] text-white text-center">
            Enter your postcode to get local heat conditions
          </p>
          <form
            className="flex gap-3 w-full"
            onSubmit={(e) => {
              e.preventDefault()
              fetchByPostcode(postcode)
            }}
          >
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. 3000"
              className="flex-1 bg-transparent text-white placeholder:text-white/60 rounded-lg px-4 text-[16px] font-['Lexend'] outline-none min-h-[48px]"
              style={{ border: '1px solid rgba(255,255,255,0.5)' }}
            />
            <button
              type="submit"
              className="bg-white text-[#1e293b] font-['Public_Sans'] font-bold text-[16px] px-6 rounded-lg min-h-[48px]"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    )
  }

  const temp = current?.temp
  const feelsLike = current?.apparentTemp
  const { level, label, bannerBg } = getRiskLevel(temp)
  const { line1, line2 } = ADVICE[level]
  const imageUrl = BANNER_IMAGES[level]
  const solidColor = SOLID_COLORS[level]

  function highlightDangerous(text) {
    if (typeof text !== 'string' || text.length === 0) return text

    const out = []
    const re = /\bdangerous\b/gi
    let last = 0
    let m
    let key = 0

    while ((m = re.exec(text)) !== null) {
      const idx = m.index
      const match = m[0]

      let before = text.slice(last, idx)
      const hadTrailingSpace = /\s$/.test(before)
      if (hadTrailingSpace) before = before.replace(/\s+$/, '')
      if (before) out.push(before)

      // In a flex container, trailing text-node spaces can be dropped.
      // Insert NBSP explicitly around the highlighted word.
      out.push(
        <span key={`danger-${key++}`}>
          {'\u00A0'}
          <span style={{ color: '#dc2626' }}>{match}</span>
          {'\u00A0'}
        </span>
      )

      last = idx + match.length
      // Skip any whitespace already present after the word to avoid double spacing.
      while (last < text.length && /\s/.test(text[last])) last += 1
    }

    const tail = text.slice(last)
    if (tail) out.push(tail)
    return out
  }

  const renderMarqueeHalf = (keyPrefix) =>
    Array.from({ length: MARQUEE_SEGMENTS_PER_HALF }, (_, i) => (
    <span
      key={`${keyPrefix}-${i}`}
      className="inline-flex shrink-0 items-center whitespace-nowrap pr-12"
      style={{
        fontFamily: "'Public Sans', sans-serif",
        fontWeight: 600,
        fontSize: '18px',
        color: 'rgba(15, 23, 42, 0.92)',
        letterSpacing: '0.02em',
      }}
    >
      {highlightDangerous(line1)}
      <span className="mx-5 text-slate-600/80" aria-hidden>
        •
      </span>
      {highlightDangerous(line2)}
      <span className="mx-5 text-slate-600/80" aria-hidden>
        •
      </span>
    </span>
  ))

  return (
    <>
      <div
        className="overflow-hidden border-b border-white/25"
        style={{
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          padding: '14px 0',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <style>{`
          .marquee-track {
            display: flex;
            width: max-content;
            flex-shrink: 0;
            animation: marquee 200s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
          .marquee-half {
            display: flex;
            flex-shrink: 0;
            align-items: center;
          }
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="marquee-track">
          <div className="marquee-half">{renderMarqueeHalf('a')}</div>
          <div className="marquee-half" aria-hidden>
            {renderMarqueeHalf('b')}
          </div>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{
          height: '531px',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1 }} />

<div className="relative flex flex-col items-center gap-6 px-6 text-center" style={{ zIndex: 10 }}>
        {/* Alert badge */}
        <div
          className="flex items-center gap-2 rounded-[12px] px-[25px] py-[9px]"
          style={{
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span className="text-[20px]">⚠</span>
          <span className={`${TYPOGRAPHY.bannerBadge} text-white`}>
            {label}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="font-['Public_Sans'] font-black text-white"
            style={{ fontSize: '96px', letterSpacing: '-4.8px', lineHeight: 1 }}
          >
            HEAT IS {Math.round(temp)}°C
          </p>
          {feelsLike != null && (
            <p
              className="font-['Public_Sans'] text-white/85"
              style={{ fontWeight: 500, fontSize: '22px', letterSpacing: '0.02em' }}
            >
              Feels like {Math.round(feelsLike)}°C
            </p>
          )}
        </div>

        {/* Advice */}
        <div className="flex flex-col gap-1">
          <p className={`${TYPOGRAPHY.bannerSubtitle} text-white`}>
            {line1}
          </p>
          <p
            className={`${TYPOGRAPHY.bannerSubtitle} text-white underline`}
            style={{ textDecorationColor: 'rgba(255,255,255,0.4)' }}
          >
            {line2}
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
