/**
 * Displays a personalised heat safety score with a circular progress ring,
 * factor analysis tags, and adaptive advice text.
 * @module HeatSafetyScore
 */
import { useEffect, useRef, useState } from 'react'
import { calculateHeatSafetyScore } from '../../utils/scoreCalculator'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function HeatSafetyScore({ apparentTemp, hour, selectedMedications }) {
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
        <div className="flex gap-6">
          {/* Left: progress ring */}
          <div className="flex flex-col items-center" style={{ flex: '0 0 140px' }}>
            <svg width="140" height="140">
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke="rgba(195,198,214,0.3)"
                strokeWidth="8"
              />
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke={riskLabel.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressOffset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s' }}
              />
              <text
                x="70"
                y="70"
                textAnchor="middle"
                dominantBaseline="central"
                fill={riskLabel.color}
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 40,
                  transition: 'fill 0.3s',
                }}
              >
                {score}
              </text>
            </svg>

            <p
              className="text-center"
              style={{ fontFamily: 'Lexend', fontSize: 13, color: '#64748b', marginTop: 4 }}
            >
              {riskLabel.label}
            </p>

            <p
              className="text-center"
              style={{
                fontFamily: 'Lexend',
                fontSize: 12,
                color: '#64748b',
                marginTop: 12,
                fontStyle: 'italic',
              }}
            >
              {hasMeds ? 'Score reflects medication risk' : 'Based on location & weather only'}
            </p>
          </div>

          {/* Right: factor analysis + advice */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Factor analysis */}
            <p
              className="uppercase"
              style={{
                fontFamily: 'Lexend',
                fontSize: 12,
                color: '#64748b',
                letterSpacing: '0.1em',
                marginBottom: 12,
              }}
            >
              Factor Analysis
            </p>

            <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 20 }}>
              {factors.map((tag) => (
                <span
                  key={tag.text}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 9999,
                    border: tag.isHighlighted
                      ? '1px solid #f59e0b'
                      : '1px solid rgba(195,198,214,0.3)',
                    background: tag.isHighlighted ? '#fef3c7' : '#f3f3f6',
                    padding: '6px 12px',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tag.icon}</span>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: 13,
                      color: tag.isHighlighted ? '#92400e' : '#1a1c1e',
                    }}
                  >
                    {tag.text}
                  </span>
                </span>
              ))}
            </div>

            {/* Advice */}
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span
                style={{ fontFamily: 'Public Sans', fontWeight: 700, fontSize: 16, color: '#1a1c1e' }}
              >
                What This Means For You
              </span>
              {hasMeds && (
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 11,
                    color: '#166534',
                    background: '#dcfce7',
                    borderRadius: 9999,
                    padding: '2px 8px',
                  }}
                >
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
                <p
                  key={i}
                  style={{
                    fontFamily: 'Lexend',
                    fontSize: 16,
                    color: '#334155',
                    lineHeight: 1.6,
                    margin: i > 0 ? '10px 0 0' : 0,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
        {/* CTA — only shown when no medications selected */}
        {!hasMeds && (
          <div
            style={{
              borderTop: '1px solid rgba(195,198,214,0.3)',
              marginTop: 20,
              padding: '14px 0 0',
            }}
          >
            <div
              style={{
                background: '#eff6ff',
                borderRadius: 6,
                padding: '12px 16px',
                cursor: 'pointer',
              }}
              onClick={() =>
                document.getElementById('medications-section')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="hover:bg-[#dbeafe] transition-colors group"
            >
              <p
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#0056d2',
                  margin: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  textDecorationColor: 'rgba(0,86,210,0.4)',
                  transition: 'color 0.15s ease, text-decoration-color 0.15s ease',
                }}
                className="group-hover:!text-[#003d99]"
              >
                💊 Add your medications to get more personalised advice →
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
