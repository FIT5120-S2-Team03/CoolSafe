/**
 * Section 2 — "Plan your day".
 * Left (60%): editorial temperature chart + Tomorrow Alert card.
 * Right (40%): Safe window card + Peak heat card with cool-space block.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── helpers (exported so HomePage can import them directly) ── */
export function fmtH(h) {
  if (h === 0)  return '12AM'
  if (h < 12)   return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getWindows(hourly) {
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

/* ── Bar colour by temperature ── */
function barColor(temp) {
  if (temp >= 36) return '#8B0000'
  if (temp >= 33) return '#C94B1A'
  if (temp >= 29) return '#B87200'
  return '#4A6741'
}

/* ── Temp label ── */
function tempLabel(temp) {
  if (temp >= 36) return 'Dangerous'
  if (temp >= 33) return 'Hot'
  if (temp >= 29) return 'Warm'
  return 'Comfortable'
}

/* ── Bar chart temperature chart ── */
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

  const W = 560, H = 380
  const PAD = { top: 12, right: 12, bottom: 42, left: 44 }

  const temps = slots.map((s) => s.temp)
  const rawMin = Math.min(...temps)
  const rawMax = Math.max(...temps)
  const peakIdx = temps.indexOf(rawMax)
  const minT   = Math.floor((rawMin - 2) / 4) * 4
  const maxT   = Math.ceil((rawMax + 2) / 4) * 4

  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom
  const getY = (t) => PAD.top + cH * (1 - (t - minT) / (maxT - minT))
  const baseY = getY(minT)

  const slotW   = cW / slots.length
  const barW    = slotW * 0.68

  // Y-axis grid labels every 4°C
  const yLabels = []
  for (let t = minT; t <= maxT; t += 4) yLabels.push(t)

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
              fill="#A8A8A8"
              fontSize="10.5"
              fontFamily="'DM Sans',sans-serif"
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
        const TW = 122, TH = 74, TR = 9
        let tx = barX + barW / 2 - TW / 2
        const ty = barTop < PAD.top + TH + 14 ? barTop + 8 : barTop - TH - 8
        tx = Math.max(PAD.left, Math.min(W - PAD.right - TW, tx))
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={TR} ry={TR} fill="rgba(17,24,39,0.96)" />
            <text x={tx + TW / 2} y={ty + 22} textAnchor="middle" fill="white" fontSize="14" fontFamily="'DM Sans',sans-serif" fontWeight="700">
              {fmtH(h)}
            </text>
            <text x={tx + TW / 2} y={ty + 42} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="14" fontFamily="'DM Sans',sans-serif" fontWeight="500">
              {temp}°C
            </text>
            <text x={tx + TW / 2} y={ty + 61} textAnchor="middle" fill="rgba(255,255,255,0.62)" fontSize="12.5" fontFamily="'DM Sans',sans-serif">
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
export function TomorrowAlert({ daily }) {
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
