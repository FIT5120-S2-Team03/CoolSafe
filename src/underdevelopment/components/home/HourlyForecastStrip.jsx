/**
 * Horizontally scrollable strip of hourly apparent-temperature cards for today.
 * Shows the current hour onwards with colour-coded risk dots and a "best time
 * to go out" recommendation window based on safe (<28°C) temperature slots.
 */
import { getRiskLevel } from '../../utils/riskLevel'
import { TYPOGRAPHY, FONT_SIZE } from '../../styles/typography'

function fmtH(h) {
  if (h === 0) return '12AM'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function formatHour(isoStr) {
  return fmtH(parseInt(isoStr.slice(11, 13)))
}

function getSafeWindowLabel(times, temps) {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const slots = times
    .map((t, i) => ({ t, temp: temps[i] }))
    .filter((s) => s.t.startsWith(todayStr))

  const firstHotIdx = slots.findIndex((s) => s.temp >= 28)
  if (firstHotIdx === -1) return null

  const lastHotIdx = slots.length - 1 - [...slots].reverse().findIndex((s) => s.temp >= 28)
  if (firstHotIdx === 0 && lastHotIdx === slots.length - 1) {
    return 'No safe window today — stay indoors if possible'
  }

  const beforeStr = fmtH(parseInt(slots[firstHotIdx].t.slice(11, 13)))
  const afterIdx = lastHotIdx + 1
  const afterStr = afterIdx < slots.length ? fmtH(parseInt(slots[afterIdx].t.slice(11, 13))) : null

  return afterStr
    ? `Recommended: Before ${beforeStr} or after ${afterStr}`
    : `Recommended: Before ${beforeStr}`
}

function SkeletonCard() {
  return <div className="flex-none w-[64px] h-[88px] bg-[#f3f3f6] rounded-[4px] animate-pulse" />
}

export default function HourlyForecastStrip({ hourly }) {
  const wrapClass = 'bg-white rounded-[8px] p-[24px] w-full overflow-hidden'
  const wrapStyle = { border: '1px solid rgba(195,198,214,0.3)' }

  if (!hourly) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <div className="h-5 w-52 bg-[#f3f3f6] rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-[#f3f3f6] rounded animate-pulse mb-4" />
        <div className="flex gap-0">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentHourStr = `${todayStr}T${String(now.getHours()).padStart(2, '0')}:00`

  // Current hour + next 24 hours
  const todaySlots = hourly.time
    .map((t, i) => ({ t, temp: hourly.apparent_temperature[i] }))
    .filter((s) => s.t >= currentHourStr)
    .slice(0, 25)

  if (!todaySlots.length) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <p className="font-['Lexend'] text-[18px] text-[#64748b] text-center">
          Forecast unavailable
        </p>
      </div>
    )
  }

  const safeWindowLabel = getSafeWindowLabel(hourly.time, hourly.apparent_temperature)

  return (
    <div className={wrapClass} style={wrapStyle}>
      <div className="mb-3">
        <p className={TYPOGRAPHY.h3}>
          🕐 Best Time to Go Out Today
        </p>
        {safeWindowLabel && (
          <p className={`${TYPOGRAPHY.subtitle} text-[#0d9488]`}>
            {safeWindowLabel}
          </p>
        )}
      </div>

      <div
        className="flex flex-nowrap [&::-webkit-scrollbar]:hidden"
        style={{ overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {todaySlots.map(({ t, temp }) => {
          const risk = getRiskLevel(temp)
          const isCurrent = t === currentHourStr
          const isHot = risk.warningLevel >= 3

          const bgStyle = isCurrent
            ? { background: '#EFF6FF', border: '1px solid #BFDBFE' }
            : isHot
            ? { background: 'rgba(254,242,242,0.5)' }
            : {}

          return (
            <div
              key={t}
              className="flex-none w-[72px] flex flex-col items-center rounded-[4px]"
              style={{ paddingTop: isCurrent ? '0' : '18px', paddingBottom: '8px' }}
            >
              {isCurrent && (
                <span style={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: FONT_SIZE.small, color: '#3B82F6', marginBottom: '2px', display: 'block', textAlign: 'center' }}>
                  ▼ Now
                </span>
              )}
              <div
                className="w-full flex flex-col items-center justify-center rounded-[4px]"
                style={{ ...bgStyle, height: '92px' }}
              >
              <span className={`${TYPOGRAPHY.dataSmall} text-[#64748b] mb-1`}>
                {formatHour(t)}
              </span>
              <span className={`${TYPOGRAPHY.dataSmall} font-bold text-[#1a1c1e] mb-2`}>
                {Math.round(temp)}°
              </span>
              <div
                className="rounded-full"
                style={{ width: '10px', height: '10px', background: risk.dot }}
              />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
