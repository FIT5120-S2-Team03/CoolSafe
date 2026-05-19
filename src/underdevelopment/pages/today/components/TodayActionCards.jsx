import { ThingCard } from './TodayCards'
import { MUTED, RULE } from '../../../styles/colors'
import SectionContainer from '../../../components/layout/SectionContainer'

const headingStyle = {
  fontFamily: 'var(--serif)',
  fontSize: 'var(--text-section)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-title)',
  lineHeight: 'var(--leading-title)',
  color: '#0F0F0F',
  marginBottom: 10,
}

function actionHeading(score) {
  if (score >= 75) return 'Extreme heat risk'
  if (score >= 55) return 'High heat risk'
  if (score >= 30) return 'Moderate heat risk'
  return 'Low heat risk'
}

export default function TodayActionCards({
  medicationCount,
  onGoSafety,
  outing,
  score,
}) {
  const currentHour = new Date().getHours()

  return (
    <SectionContainer innerClassName="cs-today-actions-section">
        <h2 style={headingStyle}>
          {actionHeading(score)} — here's how to make the most of it.
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 'var(--text-body-sm)', color: MUTED, lineHeight: 'var(--leading-body)', marginBottom: 36, maxWidth: 520 }}>
          Tap a card to see more. Your details stay private.
        </p>

        <div className="cs-today-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <ThingCard
            iconBg="#D9DEC0"
            icon="schedule"
            title={outing?.windowTime
              ? `Best time to head out: ${outing.windowTime}.`
              : (currentHour >= 20 ? 'Time to wind down for the night.' : 'Too hot to head out safely today.')}
            windowLabel={outing?.windowLabel}
            windowIntro={outing?.windowTime
              ? (outing.windowAvgTemp != null ? `Around ${outing.windowAvgTemp}° during this window` : undefined)
              : (outing?.peakTemp != null && currentHour < 20 ? `Reaches ~${outing.peakTemp}° today` : undefined)}
            desc={currentHour >= 20
              ? "A good night's rest helps your body handle heat better tomorrow."
              : outing?.windowTime
              ? 'Use this window for errands, a walk, or getting to a cool space.'
              : 'Stay cool indoors — use the AI finder if you need a cool space nearby.'}
            cta="View hourly forecast"
            ctaIcon="arrow_downward"
            onClick={() => document.getElementById('sec-chart')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <ThingCard
            iconBg="#CFDDE5"
            icon="location_on"
            title="Find cool spaces near you."
            desc="Air-conditioned libraries, community centres, and shaded parks across Melbourne."
            cta="See nearby spaces"
            ctaIcon="arrow_downward"
            onClick={() => document.getElementById('sec-cool-spaces')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <ThingCard
            iconBg="#F2DDB3"
            icon="pill"
            title={medicationCount > 0
              ? `${medicationCount} medication${medicationCount > 1 ? 's' : ''} in your plan.`
              : 'Check how your body is feeling.'}
            desc={medicationCount > 0
              ? 'Start with the symptom checker, then review how your medicines may affect heat today.'
              : 'Use the symptom checker for heat signs and next steps. Medication notes appear below if they apply.'}
            cta="Check symptoms and medication notes"
            ctaIcon="arrow_forward"
            onClick={onGoSafety}
          />
        </div>
    </SectionContainer>
  )
}
