/**
 * Displays a personalised heat safety score with a circular progress ring,
 * factor analysis tags, adaptive advice text, and an inline action plan.
 * @module HeatSafetyScore
 */
import { useEffect, useRef, useState } from 'react'
import { calculateHeatSafetyScore } from '../../utils/scoreCalculator'
import { TYPOGRAPHY, FONT_SIZE } from '../../styles/typography'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ACTION_PLAN = {
  Low: {
    doThis: [
      '💧 Drink water regularly',
      '🧢 Wear a hat if going outside',
      '🌿 Enjoy outdoor activities in the morning',
      '🏠 Keep your home ventilated',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Intense exercise during midday',
      '🍺 Alcohol in the heat',
      '🚗 Leaving pets or kids in cars',
      '🌞 Extended sun exposure without protection',
      '🍳 Heating up your home with the oven',
    ],
  },
  Moderate: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in cool, shaded areas',
      '🌡 Monitor how you feel throughout the day',
      '👥 Check on neighbours & elderly',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Outdoor exercise or heavy labor',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Going outside during peak heat (11AM–3PM)',
      '🍳 Using the oven or stovetop',
    ],
  },
  High: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in air-conditioned rooms',
      '🪟 Keep blinds and curtains closed',
      '👥 Check on neighbours & elderly',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Outdoor exercise or heavy labor',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Being outside during peak heat',
      '🍳 Using the oven or stovetop',
    ],
  },
  Extreme: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in air-conditioned rooms — go to a cool space if needed',
      '🪟 Keep blinds and curtains closed',
      '👥 Check on neighbours & elderly — call them if possible',
      '🚨 Call 000 if you feel chest pain, confusion or collapse',
    ],
    avoid: [
      '🏃 Any outdoor activity — even brief trips',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Being outside at any time today',
      '🍳 Using the oven or stovetop — it heats your home',
    ],
  },
}

export default function HeatSafetyScore({ apparentTemp, hour, selectedMedications, riskLevel }) {
  const { score, riskLabel, factors, adviceLines } = calculateHeatSafetyScore({
    apparentTemp,
    hour,
    medications: selectedMedications,
  })

  const activeMeds = selectedMedications.filter((m) => m !== 'None of the above')
  const hasMeds = activeMeds.length > 0

  const [adviceOpacity, setAdviceOpacity] = useState(1)
  const prevScore = useRef(score)

  useEffect(() => {
    if (prevScore.current === score) return
    setAdviceOpacity(0)
    const t = setTimeout(() => {
      setAdviceOpacity(1)
      prevScore.current = score
    }, 200)
    return () => clearTimeout(t)
  }, [score])

  const progressOffset = CIRCUMFERENCE * (1 - score / 100)
  const plan = ACTION_PLAN[riskLevel] ?? ACTION_PLAN.Low

  return (
    <div>
      <div
        className="bg-white w-full"
        style={{
          border: '1px solid rgba(195,198,214,0.3)',
          borderRadius: 8,
          padding: 25,
        }}
      >
        {/* ── Top section: ring + factor analysis ── */}
        <div className="flex gap-6">
          {/* Left: progress ring */}
          <div className="flex flex-col items-center" style={{ flex: '0 0 140px' }}>
            <svg width="140" height="140">
              <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="rgba(195,198,214,0.3)" strokeWidth="8" />
              <circle
                cx="70" cy="70" r={RADIUS} fill="none"
                stroke={riskLabel.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={progressOffset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s' }}
              />
              <text
                x="70" y="70" textAnchor="middle" dominantBaseline="central"
                fill={riskLabel.color}
                style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 42, transition: 'fill 0.3s' }}
              >
                {score}
              </text>
            </svg>

            <p className={`${TYPOGRAPHY.subtitle} text-center mt-1`}>{riskLabel.label}</p>
            <p className={`${TYPOGRAPHY.bodySmall} text-center italic`} style={{ marginTop: 12 }}>
              {hasMeds ? 'Score reflects medication risk' : 'Based on location & weather only'}
            </p>
          </div>

          {/* Right: factor analysis + advice */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className={TYPOGRAPHY.label} style={{ marginBottom: 12 }}>Factor Analysis</p>

            <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 20 }}>
              {factors.map((tag) => (
                <span
                  key={tag.text}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    borderRadius: 9999,
                    border: tag.isHighlighted ? '1px solid #f59e0b' : '1px solid rgba(195,198,214,0.3)',
                    background: tag.isHighlighted ? '#fef3c7' : '#f3f3f6',
                    padding: '6px 12px',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tag.icon}</span>
                  <span className={TYPOGRAPHY.dataSmall} style={{ color: tag.isHighlighted ? '#92400e' : '#1a1c1e' }}>
                    {tag.text}
                  </span>
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span className={TYPOGRAPHY.h3}>What This Means For You</span>
              {hasMeds && (
                <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: FONT_SIZE.small, color: '#166534', background: '#dcfce7', borderRadius: 9999, padding: '2px 8px' }}>
                  PERSONALISED
                </span>
              )}
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderLeft: '4px solid rgba(195,198,214,0.3)',
                padding: '15px 20px',
                borderRadius: 4,
                opacity: adviceOpacity,
                transition: 'opacity 0.2s',
              }}
            >
              {adviceLines.map((line, i) => (
                <p key={i} className={TYPOGRAPHY.body} style={{ margin: i > 0 ? '10px 0 0' : 0 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── Medication CTA ── */}
        {!hasMeds && (
          <div style={{ marginTop: 20 }}>
          <div
            onClick={() => {
              const el = document.getElementById('medications-section')
              if (!el) return
              const top = el.getBoundingClientRect().top + window.scrollY - 80
              window.scrollTo({ top, behavior: 'smooth' })
              setTimeout(() => {
                el.classList.add('section-highlight')
                el.addEventListener('animationend', () => el.classList.remove('section-highlight'), { once: true })
              }, 500)
            }}
            className="flex items-center justify-between cursor-pointer group hover:bg-[#dbeafe] transition-colors"
            style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 8 }}
          >
            <span
              style={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: FONT_SIZE.small, color: '#0056d2' }}
              className="group-hover:!text-[#003d99] transition-colors"
            >
              💊 <span style={{ textDecoration: 'underline' }}>Add your medications to get more personalised advice</span>
            </span>
            <span style={{ color: '#0056d2', fontSize: FONT_SIZE.body, fontWeight: 600 }}>›</span>
          </div>
          </div>
        )}

        {/* ── Action plan section ── */}
        <div style={{ borderTop: '1px solid rgba(195,198,214,0.3)', marginTop: 24, paddingTop: 20 }}>
          <p className={TYPOGRAPHY.label} style={{ marginBottom: 16 }}>
            📋 Your Action Plan
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DO THIS */}
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '20px 20px 24px 20px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span className={`${TYPOGRAPHY.h2} text-[#15803d]`}>Do This</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.doThis.map((item) => (
                  <li key={item} className={TYPOGRAPHY.body}>{item}</li>
                ))}
              </ul>
            </div>

            {/* AVOID */}
            <div style={{ background: '#fff7ed', borderRadius: 8, padding: '20px 20px 24px 20px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>❌</span>
                <span className={`${TYPOGRAPHY.h2} text-[#ea580c]`}>Avoid</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.avoid.map((item) => (
                  <li key={item} className={TYPOGRAPHY.body}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
