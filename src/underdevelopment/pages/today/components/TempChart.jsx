import { useEffect, useState } from 'react'
import { fmtH, todayStr } from '../forecastUtils'

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
  const [isMobileChart, setIsMobileChart] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 720px)').matches
  })

  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)')
    const update = () => setIsMobileChart(query.matches)
    update()
    query.addEventListener('change', update)
    return () => {
      query.removeEventListener('change', update)
    }
  }, [])

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
  const rangeHours = isMobileChart ? 8 : 24
  const slots = startIdx >= 0 ? allSlots.slice(startIdx, startIdx + rangeHours) : allSlots.slice(0, rangeHours)
  if (slots.length < 2) return null

  const W = isMobileChart ? 520 : 780
  const H = isMobileChart ? 320 : 500
  const isCompact = isMobileChart
  const axisLabelHeight = isCompact ? 22 : 24
  const yLabelTopSafe = isCompact ? 14 : 12
  const topBreathingRoom = isCompact ? 14 : 12
  const bottomBreathingRoom = isCompact ? 2 : 4
  const PAD = { top: 0, right: 8, bottom: axisLabelHeight, left: isCompact ? 34 : 38 }

  const temps = slots.map((s) => s.temp)
  const rawMax = Math.max(...temps)
  const peakIdx = temps.indexOf(rawMax)
  const minT = 0
  const maxT = Math.ceil(rawMax / 8) * 8

  const cW  = W - PAD.left - PAD.right
  const plotTop = topBreathingRoom
  const plotBottom = H - axisLabelHeight - bottomBreathingRoom
  const plotH = Math.max(120, plotBottom - plotTop)
  const getY = (t) => plotTop + plotH * (1 - (t - minT) / (maxT - minT))
  const baseY = getY(minT)

  const slotW   = cW / slots.length
  const barW    = slotW * 0.76
  const axisFontSize = isCompact ? 'var(--text-label)' : 'var(--text-caption)'
  const tooltipFontSize = isCompact ? 'var(--text-body-sm)' : 'var(--text-label)'

  const yLabels = []
  for (let t = minT; t <= maxT; t += 8) yLabels.push(t)

  const targetLabelGap = isCompact ? 62 : 76
  const xStep = Math.max(1, Math.ceil(targetLabelGap / slotW))
  const xLabelSlots = slots.filter((_, i) => i % xStep === 0 || i === slots.length - 1)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
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
              x={PAD.left - 6} y={Math.max(y + 4, yLabelTopSafe).toFixed(1)}
              textAnchor="end"
              fill="#6E6358"
              style={{ fontSize: axisFontSize, fontFamily: 'var(--font-body)', fontWeight: 500 }}
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
            y={plotTop}
            width={slotW.toFixed(1)}
            height={plotH}
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
        const TW = isCompact ? 146 : 132
        const TH = isCompact ? 88 : 80
        const TR = 9
        let tx = barX + barW / 2 - TW / 2
        const ty = barTop < PAD.top + TH + 14 ? barTop + 8 : barTop - TH - 8
        tx = Math.max(PAD.left, Math.min(W - PAD.right - TW, tx))
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={TR} ry={TR} fill="rgba(17,24,39,0.96)" />
            <text x={tx + TW / 2} y={ty + (isCompact ? 27 : 24)} textAnchor="middle" fill="white" style={{ fontSize: tooltipFontSize, fontFamily: 'var(--font-body)', fontWeight: 700 }}>
              {fmtH(h)}
            </text>
            <text x={tx + TW / 2} y={ty + (isCompact ? 52 : 46)} textAnchor="middle" fill="rgba(255,255,255,0.9)" style={{ fontSize: tooltipFontSize, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {temp}°C
            </text>
            <text x={tx + TW / 2} y={ty + (isCompact ? 75 : 66)} textAnchor="middle" fill="rgba(255,255,255,0.72)" style={{ fontSize: axisFontSize, fontFamily: 'var(--font-body)' }}>
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
            x={x.toFixed(1)} y={(baseY + axisLabelHeight * 0.64).toFixed(1)}
            textAnchor="middle"
            fill="#5C5C5C"
            style={{ fontSize: axisFontSize, fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {fmtH(h)}
          </text>
        )
      })}
      </svg>
    </div>
  )
}
