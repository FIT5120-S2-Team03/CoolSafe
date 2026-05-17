import { useMemo, useState } from 'react'
import SectionContainer from '../../../components/layout/SectionContainer'
import {
  getPeriodContent,
  heatCopy,
  periodRange,
  scoreColour,
  tomorrowOutlook,
} from '../todayHeatRules'
import { ROUTINE_META } from '../todayRoutineMeta'
import { TempChart } from './TempChart'
import './RoutinePlanner.css'

const PERIODS = [
  { key: 'morning', label: 'Morning', color: '#6B7A3A' },
  { key: 'midday', label: 'Midday', color: '#B85A3C' },
  { key: 'evening', label: 'Evening', color: '#5B7A8C' },
]

function initialPeriod() {
  const h = new Date().getHours()
  if (h >= 11 && h < 16) return 'midday'
  if (h >= 16 || h < 6) return 'evening'
  return 'morning'
}

function AdviceBox({ tone, title, items }) {
  const isDo = tone === 'do'
  const color = isDo ? '#4A6741' : '#8A3F28'
  const bulletColor = isDo ? '#4A6741' : '#C94B1A'
  const labelBg = isDo ? 'rgba(74,103,65,0.12)' : 'rgba(201,75,26,0.08)'

  return (
    <div className={`cs-routine-advice-box cs-routine-advice-box--${tone}`}>
      <span className="cs-routine-advice-label" style={{ color, background: labelBg }}>{title}</span>
      {items.map((item, i) => (
        <div key={i} className="cs-routine-advice-item" style={{ marginTop: i > 0 ? 5 : 0 }}>
          <span className="cs-routine-advice-bullet" style={{ color: bulletColor }}>•</span>
          <span className="cs-routine-advice-copy">{item}</span>
        </div>
      ))}
    </div>
  )
}

export default function RoutinePlanner({ hourly, daily, locationName, band }) {
  const [activePeriod, setActivePeriod] = useState(initialPeriod)
  const copy = heatCopy(band)
  const activeMeta = ROUTINE_META[activePeriod]

  const periodRanges = useMemo(() => ({
    morning: periodRange(hourly, 6, 11, '17-22°'),
    midday: periodRange(hourly, 11, 16, '24-31°'),
    evening: periodRange(hourly, 16, 20, '20-25°'),
  }), [hourly])

  const periodContent = getPeriodContent(activePeriod, band)
  const tomorrowMax = daily?.tomorrowMax

  return (
    <SectionContainer id="sec-chart" innerClassName="cs-today-routine-section">
      <h2 className="cs-routine-heading">Your day, looked after.</h2>
      <p className="cs-routine-subtitle">Tap a time of day to see your plan.</p>

      <div className="cs-routine-card">
        <div className="cs-routine-chart-panel">
          <div className="cs-routine-kicker">
            Hourly Temperature · {locationName ?? 'Melbourne'}
          </div>

          <div className="cs-routine-chart-plot">
            <TempChart hourly={hourly} />
          </div>

          <div className="cs-routine-outlook">
            <div className="cs-routine-outlook-label">
              <div className="cs-routine-pulse" />
              <span>Tomorrow's Outlook: {tomorrowOutlook(tomorrowMax)}</span>
            </div>
            <span
              className="cs-routine-outlook-temp"
              style={{ color: tomorrowMax != null ? scoreColour(Math.min(100, tomorrowMax * 2)) : '#B85A3C' }}
            >
              {tomorrowMax != null ? `Max ${Math.round(tomorrowMax)}°C` : '—'}
            </span>
          </div>
        </div>

        <div className="cs-routine-panel">
          <div className="cs-routine-tabs">
            {PERIODS.map(({ key, label, color }) => {
              const isActive = activePeriod === key
              return (
                <button
                  key={key}
                  className="cs-routine-tab"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => setActivePeriod(key)}
                  style={isActive ? { background: color, borderColor: color } : undefined}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="cs-routine-period-visual" style={{ background: activeMeta.bg }}>
            {activeMeta.svg}
            <span className="cs-routine-period-badge">{periodRanges[activePeriod]}</span>
          </div>

          <div className="cs-routine-period-advice">
            <div className="cs-routine-advice-stack">
              <h3 className="cs-routine-period-title">
                {copy.routine[activePeriod] || activeMeta.title}
              </h3>
              <AdviceBox tone="do" title="Do this" items={periodContent.do} />
              <AdviceBox tone="avoid" title="Avoid" items={periodContent.avoid} />
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
