/**
 * Full-width hero banner displaying current air temperature (2 m), risk level,
 * and safety advice. Handles GPS, postcode fallback, loading, and error states.
 */
import { useState, useEffect } from 'react'
import { useWeatherData } from '../../hooks/useWeatherData'
import { getRiskLevel } from '../../utils/riskLevel'

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
  const { current, hourly, daily, loading, error, gpsBlocked, fetchByPostcode, lat, lng } =
    useWeatherData()
  const [postcode, setPostcode] = useState('')

  useEffect(() => {
    if (lat != null && lng != null) {
      onCoordsReady?.(lat, lng, current, hourly, daily)
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

  return (
    <div
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ height: '531px', backgroundColor: bannerBg }}
    >
      {/* Decorative warning triangle */}
      <svg
        viewBox="0 0 367 317"
        fill="none"
        className="absolute pointer-events-none"
        style={{ top: '-80px', right: '-80px', width: '367px', height: '317px', opacity: 0.1 }}
      >
        <path d="M183.5 10L357 307H10L183.5 10Z" stroke="white" strokeWidth="20" />
        <text x="183" y="230" textAnchor="middle" fontSize="120" fill="white">!</text>
      </svg>

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        {/* Alert badge */}
        <div
          className="flex items-center gap-2 rounded-[12px] px-[25px] py-[9px]"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <span className="text-[20px]">⚠</span>
          <span
            className="font-['Public_Sans'] text-white uppercase"
            style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '4px' }}
          >
            {label}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="font-['Public_Sans'] text-white"
            style={{ fontWeight: 900, fontSize: '96px', letterSpacing: '-4.8px', lineHeight: 1 }}
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
          <p
            className="font-['Public_Sans'] text-[30px] text-white"
            style={{ fontWeight: 500 }}
          >
            {line1}
          </p>
          <p
            className="font-['Public_Sans'] text-[30px] text-white underline"
            style={{ fontWeight: 900, textDecorationColor: 'rgba(255,255,255,0.4)' }}
          >
            {line2}
          </p>
        </div>
      </div>
    </div>
  )
}
