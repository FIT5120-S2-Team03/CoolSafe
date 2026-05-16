import { FAINT, INK, MUTED, PAPER, RULE } from '../../styles/colors'
import SectionContainer from '../layout/SectionContainer'

export default function RiskScoreBanner({
  breakdown,
  score,
  scoreColor,
  selectedMedications,
  showScoreInfo,
  verdict,
  onShowScoreInfoChange,
}) {
  return (
    <SectionContainer
      outerStyle={{ borderBottom: `1px solid ${RULE}` }}
      padding="28px var(--content-gutter)"
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,4vw,48px)', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>
              Your risk today
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontFamily: "var(--font-title)", fontSize: 'clamp(3.5rem,6vw,4.5rem)', color: scoreColor, lineHeight: 0.8, fontWeight: 'normal' }}>
                {score}
              </span>
              <span style={{ fontFamily: "var(--font-title)", fontSize: '1.625rem', color: FAINT, lineHeight: 1, marginBottom: 4 }}>/100</span>

              <div
                style={{ position: 'relative', marginLeft: 4, marginBottom: 4 }}
                onMouseEnter={() => onShowScoreInfoChange(true)}
                onMouseLeave={() => onShowScoreInfoChange(false)}
              >
                <button
                  style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${RULE}`, background: 'transparent', cursor: 'pointer', fontSize: '0.9375rem', fontFamily: "var(--font-body)", fontWeight: 700, color: FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >?</button>

                {showScoreInfo && breakdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)', background: '#FFFCF6', color: INK, border: `1px solid ${RULE}`, borderRadius: 16, padding: '15px 18px', minWidth: 280, boxShadow: '0 18px 44px rgba(34,30,26,0.16)', zIndex: 100 }}>
                    <div style={{ position: 'absolute', top: -7, left: '50%', width: 14, height: 14, transform: 'translateX(-50%) rotate(45deg)', background: '#FFFCF6', borderLeft: `1px solid ${RULE}`, borderTop: `1px solid ${RULE}` }} />
                    <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, textAlign: 'center', marginBottom: 10, position: 'relative' }}>
                      How your score is calculated
                    </div>
                    {[
                      { label: 'Weather heat risk', pts: breakdown.weatherPts },
                      { label: 'Time of day', pts: breakdown.timePts },
                      { label: 'Medication risk', pts: breakdown.medPts },
                    ].map(({ label, pts }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${RULE}`, fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, position: 'relative' }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 700, color: INK }}>{pts >= 0 ? '+' : ''}{pts}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${RULE}`, fontFamily: "var(--font-body)", fontSize: '1rem', color: INK, fontWeight: 700 }}>
                      <span>Total</span>
                      <span style={{ color: scoreColor }}>{score}</span>
                    </div>
                    <div style={{ marginTop: 10, fontFamily: "var(--font-body)", fontSize: '1rem', color: FAINT, lineHeight: 1.35 }}>
                      Weather uses today's forecast. Time of day reflects the current hour.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 30,
              width: 'fit-content',
              marginTop: 14,
              padding: '0.3rem 1rem',
              borderRadius: 999,
              background: selectedMedications.length > 0 ? '#D9DEC0' : '#F3ECDC',
              color: selectedMedications.length > 0 ? '#4F5A2B' : '#6E6358',
              border: selectedMedications.length > 0 ? '1px solid rgba(79,90,43,0.22)' : `1px solid ${RULE}`,
              fontFamily: 'var(--mono)',
              fontSize: 'var(--text-caption)',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              {selectedMedications.length > 0 ? 'Personalised' : 'Baseline only'}
            </span>
          </div>

          <div style={{ width: 1, height: 70, background: RULE, flexShrink: 0 }} />

          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>Verdict</div>
            <div style={{ fontFamily: "var(--font-title)", fontStyle: 'italic', fontSize: 'clamp(1.625rem,3vw,2rem)', color: scoreColor, lineHeight: 1 }}>
              {verdict}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', minWidth: 180 }}>
            <div style={{ position: 'relative', height: 12, borderRadius: 99, background: 'linear-gradient(to right,#6B7A3A 0%,#D49A3A 50%,#B85A3C 100%)' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: `${Math.min(95, Math.max(5, score))}%`,
                transform: 'translate(-50%,-50%)',
                width: 28, height: 28,
                background: PAPER,
                border: `3px solid ${INK}`,
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(34,30,26,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'left 0.5s ease',
                zIndex: 2,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B85A3C' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A' }}>
              {['Calm', 'Mild', 'Moderate', 'High', 'Extreme'].map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        </div>
    </SectionContainer>
  )
}
