import { WeatherCallout } from './TodayCards'
import { aqiBadgeColor, SCORE_COLOR } from '../../utils/todayHeat'
import { FAINT, INK, MUTED, RULE } from '../../styles/colors'
import SectionContainer from '../layout/SectionContainer'

export default function TodayHero({
  current,
  daily,
  aqi,
  aqiInfo,
  heroSlogan,
  heroDesc,
  peakBadge,
  risk,
  selectedMedications,
  uvInfo,
  onEditMedications,
}) {
  return (
    <SectionContainer
      innerClassName="cs-today-hero-inner"
      outerStyle={{ borderBottom: `1px solid ${RULE}` }}
      padding="clamp(100px,12vh,132px) var(--content-gutter) clamp(48px,6vw,80px)"
      innerStyle={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(24px,4vw,60px)',
        alignItems: 'center',
      }}
    >
        <div>
          <h1 style={{
            fontFamily: "var(--font-title)",
            fontSize: 'clamp(3rem,6vw,5rem)',
            fontWeight: 'normal',
            color: INK,
            letterSpacing: '-0.03em',
            lineHeight: 0.98,
            marginBottom: 24,
          }}>
            {heroSlogan.before}{' '}
            <em style={{ fontStyle: 'italic', color: INK }}>{heroSlogan.accent}</em>
          </h1>

          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: '1.125rem',
            color: MUTED,
            lineHeight: 1.55,
            maxWidth: 520,
            marginBottom: 28,
          }}>
            {current ? heroDesc : 'Loading today\'s conditions for your area…'}
          </p>

          <button
            onClick={onEditMedications}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 48,
              padding: '0.85rem 1.35rem',
              borderRadius: 999,
              border: selectedMedications.length > 0 ? `1px solid ${RULE}` : '1px solid rgba(138,63,40,0.22)',
              background: selectedMedications.length > 0 ? '#fff' : '#8A3F28',
              color: selectedMedications.length > 0 ? '#221E1A' : '#fff',
              fontFamily: 'var(--sans)',
              fontWeight: 700,
              fontSize: 'var(--text-label)',
              cursor: 'pointer',
              boxShadow: selectedMedications.length > 0 ? 'var(--shadow-soft)' : '0 10px 24px -18px rgba(138,63,40,0.9)',
              transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
          >
            {selectedMedications.length > 0
              ? 'Review or edit medications'
              : 'Add your medications for accuracy'}
            <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="cs-today-hero-media" style={{ position: 'relative' }}>
          <img
            src="/risk-hero-indoor.png"
            alt="Older Melburnian staying cool indoors during hot weather"
            style={{ width: '100%', borderRadius: 20, display: 'block', objectFit: 'cover' }}
          />
          <WeatherCallout
            value={current ? `${Math.round(current.apparentTemp)}°C` : '—'}
            label="Feels like"
            badge={risk?.label ?? '—'}
            badgeColor={risk ? SCORE_COLOR[risk.level] : FAINT}
            style={{ position: 'absolute', top: '14%', left: '-10%' }}
          />
          <WeatherCallout
            value={uvInfo ? String(uvInfo.index) : '—'}
            label="UVI"
            badge={uvInfo?.label ?? '—'}
            badgeColor={uvInfo?.color ?? FAINT}
            style={{ position: 'absolute', top: '30%', right: '-12%' }}
          />
          <WeatherCallout
            value={daily?.todayMax != null ? `${Math.round(daily.todayMax)}°C` : '—'}
            label="Peak today"
            badge={peakBadge.label}
            badgeColor={peakBadge.color}
            style={{ position: 'absolute', top: '56%', left: '-4%' }}
          />
          <WeatherCallout
            value={aqi != null ? String(aqi) : '—'}
            label="AQI"
            badge={aqiInfo?.label ?? '—'}
            badgeColor={aqiBadgeColor(aqiInfo)}
            style={{ position: 'absolute', top: '68%', right: '-13%' }}
          />
        </div>
    </SectionContainer>
  )
}
