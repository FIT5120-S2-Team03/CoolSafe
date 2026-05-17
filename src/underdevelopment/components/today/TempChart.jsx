import { useState } from 'react'
import { fmtH, todayStr } from './forecastUtils'

function barColor(temp) {
  if (temp >= 36) return '#8B0000'
  if (temp >= 33) return '#C94B1A'
  if (temp >= 29) return '#B87200'
  return '#4A6741'
}

function tempLabel(temp) {
  if (temp >= 36) return 'Dangerous'
  if (temp >= 33) return 'Hot'
  if (temp >= 29) return 'Warm'
  return 'Comfortable'
}

export function TempChart({ hourly }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!hourly) return (
    <div style={{ width: '100%', height: '100%', background: '#E5E1DA', borderRadius: 8 }} />
  )

  const now = new Date()
  const currentDay = todayStr()
  const currentHour = now.getHours()
  const allSlots = hourly.time.map((t, i) => ({
    t,
    temp: hourly.apparent_temperature[i],
    day: t.slice(0, 10),
    hour: parseInt(t.slice(11, 13)),
    date: new Date(t),
  }))
  let startIdx = allSlots.findIndex((s) => s.day === currentDay && s.hour >= currentHour)
  if (startIdx < 0) startIdx = allSlots.findIndex((s) => s.date >= now)
  const slots = startIdx >= 0 ? allSlots.slice(startIdx, startIdx + 24) : allSlots.slice(0, 24)
  if (slots.length < 2) return null

  const W = 560, H = 320
  const PAD = { top: 12, right: 12, bottom: 38, left: 50 }

  const temps = slots.map((s) => s.temp)
  const rawMax = Math.max(...temps)
  const peakIdx = temps.indexOf(rawMax)
  const minT   = 0
  const maxT   = Math.ceil(rawMax / 8) * 8

  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom
  const getY = (t) => PAD.top + cH * (1 - t / maxT)
  const baseY = getY(0)

  const slotW   = cW / slots.length
  const barW    = slotW * 0.68

  const yLabels = []
  for (let t = 0; t <= maxT; t += 8) yLabels.push(t)

  const xLabelSlots = slots.filter((_, i) => i % 3 === 0 || i === slots.length - 1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: 'block', overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Horizontal grid lines + Y-axis labels */}
      {yLabels.map((t) => {
        const y = getY(t)
        if (y < PAD.top - 4 || y > H - PAD.bottom + 4) return null
        return (
          <g key={t}>
            <line
              x1={PAD.left} y1={y.toFixed(1)}
              x2={W - PAD.right} y2={y.toFixed(1)}
              stroke="rgba(0,0,0,0.07)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={(y + 4).toFixed(1)}
              textAnchor="end"
              fill="#6E6358"
              fontSize="16"
              fontFamily="var(--font-body)"
              fontWeight="500"
            >
              {t}°
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {slots.map((s, i) => {
        const barX = PAD.left + i * slotW + (slotW - barW) / 2
        const barTop = getY(s.temp)
        const barH = baseY - barTop
        const color = barColor(s.temp)
        const isPeak = i === peakIdx
        const isHovered = i === hoveredIdx
        const opacity = isPeak ? 1 : isHovered ? 1 : 0.72
        return (
          <rect
            key={i}
            x={barX.toFixed(1)}
            y={barTop.toFixed(1)}
            width={barW.toFixed(1)}
            height={Math.max(0, barH).toFixed(1)}
            rx="4" ry="4"
            fill={color}
            opacity={opacity}
            style={{ transition: 'opacity 0.15s' }}
          />
        )
      })}

      {/* Invisible wide rect overlay per bar slot for hover detection */}
      {slots.map((s, i) => {
        const slotX = PAD.left + i * slotW
        return (
          <rect
            key={`hit-${i}`}
            x={slotX.toFixed(1)}
            y={PAD.top}
            width={slotW.toFixed(1)}
            height={cH}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        )
      })}

      {/* Hover tooltip */}
      {hoveredIdx != null && (() => {
        const s    = slots[hoveredIdx]
        const i    = hoveredIdx
        const barX = PAD.left + i * slotW + (slotW - barW) / 2
        const barTop = getY(s.temp)
        const h    = parseInt(s.t.slice(11, 13))
        const temp = Math.round(s.temp)
        const label = tempLabel(s.temp)
        const TW = 132, TH = 80, TR = 9
        let tx = barX + barW / 2 - TW / 2
        const ty = barTop < PAD.top + TH + 14 ? barTop + 8 : barTop - TH - 8
        tx = Math.max(PAD.left, Math.min(W - PAD.right - TW, tx))
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={TR} ry={TR} fill="rgba(17,24,39,0.96)" />
            <text x={tx + TW / 2} y={ty + 24} textAnchor="middle" fill="white" fontSize="16" fontFamily="var(--font-body)" fontWeight="700">
              {fmtH(h)}
            </text>
            <text x={tx + TW / 2} y={ty + 46} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="16" fontFamily="var(--font-body)" fontWeight="500">
              {temp}°C
            </text>
            <text x={tx + TW / 2} y={ty + 66} textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="15" fontFamily="var(--font-body)">
              {label}
            </text>
          </g>
        )
      })()}

      {/* X-axis hour labels every 3 slots */}
      {xLabelSlots.map((s) => {
        const idx = slots.indexOf(s)
        const x   = PAD.left + idx * slotW + slotW / 2
        const h   = parseInt(s.t.slice(11, 13))
        return (
          <text
            key={s.t}
            x={x.toFixed(1)} y={H - 5}
            textAnchor="middle"
            fill="#5C5C5C" fontSize="16"
            fontFamily="var(--font-body)"
            fontWeight="500"
          >
            {fmtH(h)}
          </text>
        )
      })}
    </svg>
  )
}
