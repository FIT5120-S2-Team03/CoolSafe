/**
 * Horizontally scrollable strip of hourly apparent-temperature cards for today.
 * Shows the current hour onwards with colour-coded risk dots and a "best time
 * to go out" recommendation window based on safe (<28°C) temperature slots.
 */
import { getRiskLevel } from '../../utils/riskLevel'

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
  return <div className="grow min-w-[72px] h-[88px] bg-[#f3f3f6] rounded-[4px] animate-pulse" />
}

export default function HourlyForecastStrip({ hourly }) {
  const wrapClass = 'bg-white rounded-[8px] p-[17px] w-full'
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

  const todaySlots = hourly.time
    .map((t, i) => ({ t, temp: hourly.apparent_temperature[i] }))
    .filter((s) => s.t.startsWith(todayStr) && s.t >= currentHourStr)

  if (!todaySlots.length) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <p className="font-['Lexend'] text-[16px] text-[#64748b] text-center">
          Forecast unavailable
        </p>
      </div>
    )
  }

  const safeWindowLabel = getSafeWindowLabel(hourly.time, hourly.apparent_temperature)

  return (
    <div className={wrapClass} style={wrapStyle}>
      <div className="mb-3">
        <p className="font-['Public_Sans'] font-bold text-[16px] text-[#1a1c1e]">
          🕐 Best Time to Go Out Today
        </p>
        {safeWindowLabel && (
          <p className="font-['Public_Sans'] text-[14px] text-[#0d9488]" style={{ fontWeight: 500 }}>
            {safeWindowLabel}
          </p>
        )}
      </div>

      <div
        className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {todaySlots.map(({ t, temp }) => {
          const risk = getRiskLevel(temp)
          const isCurrent = t === currentHourStr
          const isHot = risk.warningLevel >= 3

          const bgStyle = isCurrent
            ? { background: '#f0fdfa', border: '1px solid #99f6e4' }
            : isHot
            ? { background: 'rgba(254,242,242,0.5)' }
            : {}

          return (
            <div
              key={t}
              className="grow min-w-[72px] h-[88px] flex flex-col items-center justify-center rounded-[4px]"
              style={bgStyle}
            >
              <span className="font-['Public_Sans'] text-[14px] text-[#64748b] mb-1">
                {formatHour(t)}
              </span>
              <span className="font-['Public_Sans'] font-bold text-[18px] text-[#1a1c1e] mb-2">
                {Math.round(temp)}°
              </span>
              <div
                className="rounded-full"
                style={{ width: '10px', height: '10px', background: risk.dot }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
