/**
 * Section 2 — "Plan your day".
 * Left (60%): editorial temperature chart + Tomorrow Alert card.
 * Right (40%): Safe window card + Peak heat card with cool-space block.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── helpers ── */
function fmtH(h) {
  if (h === 0)  return '12AM'
  if (h < 12)   return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWindows(hourly) {
  if (!hourly) return null
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ t, temp: hourly.apparent_temperature[i] }))
    .filter((s) => s.t.startsWith(today))
  if (!slots.length) return null

  const HOT = 28
  const firstHot = slots.findIndex((s) => s.temp >= HOT)
  const lastHot  = slots.length - 1 - [...slots].reverse().findIndex((s) => s.temp >= HOT)

  const peakMax  = Math.max(...slots.map((s) => s.temp))
  const peakSlot = slots.find((s) => s.temp === peakMax)
  const peakHour = peakSlot ? parseInt(peakSlot.t.slice(11, 13)) : null

  if (firstHot === -1) {
    return { safeTime: 'All day — safe conditions', peakTime: null, peakMax, peakHour }
  }

  const safeBeforeH = parseInt(slots[firstHot].t.slice(11, 13))
  const afterIdx    = lastHot + 1
  const safeAfterH  = afterIdx < slots.length ? parseInt(slots[afterIdx].t.slice(11, 13)) : null

  return {
    safeTime: safeAfterH
      ? `Before ${fmtH(safeBeforeH)} or after ${fmtH(safeAfterH)}`
      : `Before ${fmtH(safeBeforeH)}`,
    peakTime: safeAfterH
      ? `${fmtH(safeBeforeH)} – ${fmtH(safeAfterH)}`
      : `From ${fmtH(safeBeforeH)}`,
    peakMax,
    peakHour,
  }
}

/* ── Catmull-Rom to bezier path ── */
function catmullRomPath(pts) {
  if (pts.length < 2) return ''
  const d = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d.push(`C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`)
  }
  return d.join(' ')
}

/* ── Editorial temperature chart ── */
function TempChart({ hourly }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!hourly) return (
    <div style={{ width: '100%', height: '100%', background: '#E5E1DA', borderRadius: 8 }} />
  )

  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ t, temp: hourly.apparent_temperature[i] }))
    .filter((s) => s.t.startsWith(today))
  if (slots.length < 2) return null

  const W = 560, H = 260
  const PAD = { top: 20, right: 12, bottom: 32, left: 44 }
  const THRESHOLD = 32

  const temps = slots.map((s) => s.temp)
  const rawMin = Math.min(...temps, THRESHOLD - 2)
  const rawMax = Math.max(...temps, THRESHOLD + 2)
  const minT   = Math.floor((rawMin - 2) / 4) * 4
  const maxT   = Math.ceil((rawMax + 2) / 4) * 4

  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom
  const getX = (i) => PAD.left + (i / (slots.length - 1)) * cW
  const getY = (t) => PAD.top  + cH * (1 - (t - minT) / (maxT - minT))

  // Y-axis grid labels every 4°C
  const yLabels = []
  for (let t = minT; t <= maxT; t += 4) yLabels.push(t)

  const pts      = slots.map((s, i) => ({ x: getX(i), y: getY(s.temp) }))
  const linePath = catmullRomPath(pts)
  const areaPath = `${linePath} L ${getX(slots.length - 1).toFixed(1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`

  const threshY    = getY(THRESHOLD)
  const nowH       = new Date().getHours()
  const nowIdx     = slots.findIndex((s) => parseInt(s.t.slice(11, 13)) === nowH)
  const xLabelSlots = slots.filter((_, i) => i % 3 === 0)

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
        const isThresh = t === THRESHOLD
        return (
          <g key={t}>
            <line
              x1={PAD.left} y1={y.toFixed(1)}
              x2={W - PAD.right} y2={y.toFixed(1)}
              stroke={isThresh ? 'rgba(232,93,26,0.15)' : 'rgba(0,0,0,0.07)'}
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={(y + 4).toFixed(1)}
              textAnchor="end"
              fill={isThresh ? '#E85D1A' : '#A8A8A8'}
              fontSize="10.5"
              fontFamily="'DM Sans',sans-serif"
              fontWeight={isThresh ? '600' : '400'}
            >
              {t}°
            </text>
          </g>
        )
      })}

      {/* Warm tan fill */}
      <path d={areaPath} fill="#D4B896" fillOpacity="0.42" />

      {/* Heat threshold dashed line */}
      {threshY >= PAD.top && threshY <= H - PAD.bottom && (
        <line
          x1={PAD.left} y1={threshY.toFixed(1)}
          x2={W - PAD.right} y2={threshY.toFixed(1)}
          stroke="#E85D1A" strokeWidth="1.5"
          strokeDasharray="7 4" opacity="0.9"
        />
      )}

      {/* Smooth temperature curve */}
      <path
        d={linePath}
        fill="none" stroke="#1852B4" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Data points */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r={i === nowIdx || i === hoveredIdx ? '5' : '3.5'}
          fill={i === hoveredIdx ? '#2563EB' : '#1852B4'}
          stroke={i === nowIdx || i === hoveredIdx ? '#fff' : 'none'}
          strokeWidth={i === nowIdx || i === hoveredIdx ? '2' : '0'}
        />
      ))}

      {/* Invisible hover targets (larger hit area) */}
      {pts.map((p, i) => (
        <circle
          key={`hit-${i}`}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="14"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredIdx != null && (() => {
        const p   = pts[hoveredIdx]
        const s   = slots[hoveredIdx]
        const h   = parseInt(s.t.slice(11, 13))
        const temp = Math.round(s.temp)
        const TW  = 82, TH = 50, TR = 7
        let tx = p.x - TW / 2
        const ty = p.y < H * 0.45 ? p.y + 14 : p.y - TH - 14
        tx = Math.max(PAD.left, Math.min(W - PAD.right - TW, tx))
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={TR} ry={TR} fill="rgba(17,24,39,0.96)" />
            <text x={tx + TW / 2} y={ty + 17} textAnchor="middle" fill="white" fontSize="12" fontFamily="'DM Sans',sans-serif" fontWeight="700">
              {fmtH(h)}
            </text>
            <rect x={tx + 11} y={ty + 27} width={9} height={9} rx="2" ry="2" fill="#1852B4" />
            <text x={tx + 25} y={ty + 36} fill="rgba(255,255,255,0.9)" fontSize="11" fontFamily="'DM Sans',sans-serif" fontWeight="500">
              {temp}°C
            </text>
          </g>
        )
      })()}

      {/* X-axis time labels */}
      {xLabelSlots.map((s) => {
        const idx = slots.indexOf(s)
        const x   = getX(idx)
        const h   = parseInt(s.t.slice(11, 13))
        return (
          <text
            key={s.t}
            x={x.toFixed(1)} y={H - 5}
            textAnchor="middle"
            fill="#5C5C5C" fontSize="10.5"
            fontFamily="'DM Sans',sans-serif"
          >
            {fmtH(h)}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Tomorrow Alert ── */
function TomorrowAlert({ daily }) {
  if (!daily || daily.tomorrowMax == null) return null
  const { tomorrowMax, todayMax } = daily

  let tag, msg
  if (tomorrowMax >= 35) {
    const safer = tomorrowMax < todayMax
    tag = safer ? '🟡 Tomorrow looks a little safer' : '🔴 Tomorrow is also dangerous'
    msg = safer
      ? 'Consider planning outdoor errands for tomorrow morning before 10 AM.'
      : 'Plan ahead: find a cool space and avoid being outdoors between 11 AM–4 PM.'
  } else if (tomorrowMax >= 28) {
    tag = '🟠 Tomorrow will be warm'
    msg = 'Stick to morning or evening for outdoor activity and keep water handy.'
  } else {
    tag = '🟢 Tomorrow looks cool'
    msg = 'Good day to run errands, go for a walk, or spend time outdoors.'
  }

  return (
    <div style={{ marginTop: 14, borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.09)', background: '#FAF8F5', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5C5C5C', marginBottom: 3 }}>Today</div>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.5rem', color: '#B87200', letterSpacing: '-1px' }}>{Math.round(todayMax)}°C</div>
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.125rem', color: '#5C5C5C' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5C5C5C', marginBottom: 3 }}>Tomorrow</div>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.5rem', color: '#C94B1A', letterSpacing: '-1px' }}>{Math.round(tomorrowMax)}°C</div>
        </div>
      </div>
      <div style={{ flex: 1, borderLeft: '0.5px solid rgba(0,0,0,0.09)', paddingLeft: 18 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 6, background: tomorrowMax >= 35 ? '#FDF0EB' : '#EAF5EE', color: tomorrowMax >= 35 ? '#C94B1A' : '#2A7D4F' }}>
          {tag}
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#3A3A3A', lineHeight: 1.5 }}>{msg}</div>
      </div>
    </div>
  )
}

/* ── Checklist item ── */
function CheckItem({ label }) {
  const [done, setDone] = useState(false)
  return (
    <div
      onClick={() => setDone(!done)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: done ? 'rgba(0,0,0,0.3)' : '#3A3A3A', textDecoration: done ? 'line-through' : 'none', cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 5, border: done ? 'none' : '1.5px solid rgba(0,0,0,0.2)', background: done ? '#2A7D4F' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 5-4.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label}
    </div>
  )
}

/* ── UV colour based on index ── */
function uvColor(index) {
  if (index == null) return '#B87200'
  if (index <= 2)  return '#2A7D4F'
  if (index <= 5)  return '#B87200'
  if (index <= 7)  return '#C94B1A'
  return '#8B0000'
}

/* ── Main component ── */
export default function HourlyForecastStrip({ hourly, daily, nearestVenue, uvInfo }) {
  const navigate = useNavigate()
  const windows  = getWindows(hourly)

  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ padding: 'clamp(56px,6vh,88px) clamp(20px,4vw,56px) 36px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 'clamp(1.5rem,3vw,2.25rem)', letterSpacing: '-1px', color: '#0F0F0F' }}>
          Plan your day
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', fontWeight: 500, color: '#5C5C5C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {date}
        </div>
      </div>

      {/* Two-column content */}
      <div style={{ display: 'flex', gap: 'clamp(16px,3vw,36px)', alignItems: 'stretch', flex: 1, minHeight: 0, marginTop: 4 }}>

        {/* Left — chart + legend + tomorrow alert (60%) */}
        <div style={{ flex: 6, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Chart container — grows to fill remaining space */}
          <div style={{ flex: 1, minHeight: '200px', minWidth: 0, position: 'relative' }}>
            <TempChart hourly={hourly} />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: '#5C5C5C' }}>
              <div style={{ width: 20, height: 2, borderRadius: 1, background: '#1852B4' }} />
              Temperature
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: '#5C5C5C' }}>
              <div style={{ width: 20, borderTop: '2px dashed #E85D1A' }} />
              Heat alert threshold (32°C)
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <TomorrowAlert daily={daily} />
          </div>
        </div>

        {/* Right — time window cards (40%) */}
        <div style={{ flex: 4, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* ── Safe to go out card ── */}
          <div style={{ flex: 1, borderRadius: 14, background: '#fff', border: '0.5px solid rgba(42,125,79,0.15)', borderLeft: '3px solid #2A7D4F', display: 'flex', flexDirection: 'column', padding: '18px 16px', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2A7D4F', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2A7D4F' }}>Safe to go out</span>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(1rem,1.6vw,1.25rem)', fontWeight: 700, color: '#2A7D4F', letterSpacing: '-0.5px', marginBottom: 4 }}>
              {windows?.safeTime ?? '—'}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#3A3A3A', marginBottom: 12 }}>
              Good conditions for a walk or outdoor activities.
            </div>

            {/* UV + peak stats */}
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              {/* UV Index */}
              <div style={{ flex: 1, background: '#F0EDE8', border: '1px solid #E5E1DA', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5C5C5C', marginBottom: 6 }}>UV Index</div>
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.375rem', color: uvColor(uvInfo?.index) }}>
                  {uvInfo != null ? uvInfo.index : '—'}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: uvColor(uvInfo?.index), fontWeight: 500, marginTop: 2 }}>
                  {uvInfo != null ? uvInfo.label : '—'}
                </div>
              </div>

              {/* Today's Peak */}
              <div style={{ flex: 1, background: '#F0EDE8', border: '1px solid #E5E1DA', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5C5C5C', marginBottom: 6 }}>Today's peak</div>
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '1.375rem', color: '#0F0F0F' }}>
                  {daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '—'}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', color: '#5C5C5C', marginTop: 2 }}>
                  {windows?.peakHour != null ? `at ${fmtH(windows.peakHour)}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stay indoors / Peak heat card ── */}
          <div style={{ flex: 1, borderRadius: 14, background: '#fff', border: '0.5px solid rgba(184,114,0,0.15)', borderLeft: '3px solid #B87200', display: 'flex', flexDirection: 'column', padding: '18px 16px 148px', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#B87200', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B87200' }}>Stay indoors</span>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'clamp(1rem,1.6vw,1.25rem)', fontWeight: 700, color: '#B87200', letterSpacing: '-0.5px', marginBottom: 4 }}>
              {windows?.peakTime ?? 'Peak hours'}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', color: '#3A3A3A', marginBottom: 8 }}>
              Peak heat. Stay cool and drink water regularly.
            </div>
            <div>
              {['Water bottle filled', 'Hat and sunscreen ready', 'Phone charged', 'Check on a neighbour'].map((item) => (
                <CheckItem key={item} label={item} />
              ))}
            </div>

            {/* Cool space nearby */}
            <div
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 148, padding: '12px 16px 14px', background: '#FDF5E6', borderTop: '0.5px solid rgba(184,114,0,0.15)', overflow: 'hidden' }}
            >
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: 4 }}>
                Cool space nearby
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', fontWeight: 700, color: '#0F0F0F', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nearestVenue?.name ?? '—'}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.8125rem', color: '#5C5C5C', marginBottom: 10 }}>
                {nearestVenue?.walkMins != null ? `${nearestVenue.walkMins} min walk` : 'Nearby'}
              </div>
              <button
                onClick={() => navigate('/map')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: '#B87200', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: '0.875rem', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'opacity 0.18s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                <span>Go here</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div
        onClick={() => document.getElementById('sec2')?.scrollIntoView({ behavior: 'smooth' })}
        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', paddingTop: 12 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
      </div>
    </div>
  )
}
