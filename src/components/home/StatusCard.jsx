/**
 * Sidebar card showing current heat status, today's max air temperature, warning level,
 * air quality index, and a map thumbnail linking to the Map page.
 */
import { useNavigate } from 'react-router-dom'
import { useAirQuality } from '../../hooks/useAirQuality'
import { getRiskLevel, getAqiInfo } from '../../utils/riskLevel'

function Row({ label, children }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: '1px solid rgba(195,198,214,0.3)' }}
    >
      <span className="font-['Lexend'] text-[16px] text-[#64748b]">{label}</span>
      <span>{children}</span>
    </div>
  )
}

export default function StatusCard({ lat, lng, currentTemp, todayMax }) {
  const navigate = useNavigate()
  const { aqi } = useAirQuality({ lat, lng })

  const hasData = currentTemp != null
  const risk = hasData ? getRiskLevel(currentTemp) : null
  const aqiInfo = aqi != null ? getAqiInfo(aqi) : null

  const statusEmoji =
    risk?.level === 'High' || risk?.level === 'Extreme'
      ? '☀️'
      : risk?.level === 'Moderate'
      ? '🌤'
      : '🌥'

  const warningColor =
    risk?.warningLevel >= 3
      ? '#dc2626'
      : risk?.warningLevel === 2
      ? '#f59e0b'
      : '#22c55e'

  return (
    <div
      className="bg-white rounded-[12px] p-6"
      style={{
        border: '1px solid rgba(195,198,214,0.3)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between py-4"
        style={{ borderBottom: '1px solid rgba(195,198,214,0.3)' }}
      >
        <span
          className="font-['Lexend'] text-[11px] text-[#64748b] uppercase"
          style={{ letterSpacing: '0.1em' }}
        >
          Status
        </span>
        <span className="font-['Public_Sans'] font-bold text-[18px] text-[#1a1c1e]">
          {hasData ? `${risk.level} Heat ${statusEmoji}` : '—'}
        </span>
      </div>

      <Row label="Max Forecast">
        <span className="font-['Inter'] font-semibold text-[20px] text-[#1a1c1e]">
          {todayMax != null ? `${Math.round(todayMax)}°C` : '—'}
        </span>
      </Row>

      <Row label="Warning">
        <span
          className="font-['Inter'] font-semibold text-[16px]"
          style={{ color: hasData ? warningColor : '#64748b' }}
        >
          {hasData ? `LEVEL ${risk.warningLevel}` : '—'}
        </span>
      </Row>

      <Row label="Air Quality">
        {aqiInfo ? (
          <span
            className="font-['Inter'] font-semibold text-[16px]"
            style={{ color: aqiInfo.color }}
          >
            {aqi} ({aqiInfo.label})
          </span>
        ) : (
          <span className="font-['Inter'] font-semibold text-[16px] text-[#64748b]">
            Unavailable
          </span>
        )}
      </Row>

      {/* Map thumbnail */}
      <div
        className="relative mt-4 rounded-[8px] overflow-hidden cursor-pointer flex items-center justify-center"
        style={{ height: '160px', background: '#c8d6d6' }}
        onClick={() => navigate('/map')}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[32px]">📍</span>
          <span className="font-['Public_Sans'] font-bold text-[14px] text-[#1a1c1e]">
            Melbourne CBD
          </span>
        </div>
        <button
          className="absolute bottom-2 right-2 bg-white rounded text-[#0056d2] text-[12px] px-2 py-1 font-['Public_Sans'] font-bold"
          onClick={(e) => {
            e.stopPropagation()
            navigate('/map')
          }}
        >
          EXPAND ↗
        </button>
      </div>
    </div>
  )
}
