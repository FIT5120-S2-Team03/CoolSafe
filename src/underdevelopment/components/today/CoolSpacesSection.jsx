import MiniMapCard from './MiniMapCard'
import { VENUE_KIND_COLOR, VENUE_KIND_PILL, venueTypeKind, venueTypeLabel } from '../../utils/venueDisplay'
import { FAINT, INK, MUTED, RULE } from '../../styles/colors'
import SectionContainer from '../layout/SectionContainer'

const headingStyle = {
  fontFamily: 'var(--serif)',
  fontSize: 'var(--text-section)',
  fontWeight: 'normal',
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
  color: INK,
  marginBottom: 10,
}

export default function CoolSpacesSection({ lat, nearestVenues, onOpenMap }) {
  return (
    <SectionContainer id="sec-cool-spaces" outerStyle={{ borderBottom: `1px solid ${RULE}` }}>
        <h2 style={headingStyle}>
          Find a cool space near you.
        </h2>
        <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: MUTED, lineHeight: 1.55, marginBottom: 36, maxWidth: 560 }}>
          <span>Cool public places and shaded parks near you.</span>
          <span style={{ display: 'block', marginTop: 6 }}>
            Or tap <span style={{ color: 'var(--color-ai)', fontWeight: 700 }}>✦</span> to match by what you need.
          </span>
        </div>

        <div className="cs-today-spaces-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {nearestVenues.length > 0
              ? nearestVenues.map((v, idx) => {
                  const kind = venueTypeKind(v)
                  const typeTag = venueTypeLabel(v)
                  const kindColor = VENUE_KIND_COLOR[kind]
                  const address = [v.address, v.suburb].filter(Boolean).join(', ')
                  return (
                    <div
                      key={v.id ?? v.name}
                      onClick={() => onOpenMap(v)}
                      style={{ position: 'relative', padding: '16px 36px 16px 40px', borderTop: idx === 0 ? 'none' : `1px solid ${RULE}`, cursor: 'pointer', transition: 'background 0.16s ease, padding-left 0.22s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(243,236,220,0.46)'
                        e.currentTarget.style.paddingLeft = '50px'
                        const arrow = e.currentTarget.querySelector('[data-row-arrow]')
                        if (arrow) {
                          arrow.style.opacity = '1'
                          arrow.style.transform = 'translate(0, -50%)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.paddingLeft = '40px'
                        const arrow = e.currentTarget.querySelector('[data-row-arrow]')
                        if (arrow) {
                          arrow.style.opacity = '0'
                          arrow.style.transform = 'translate(-8px, -50%)'
                        }
                      }}
                    >
                      <div style={{ position: 'absolute', left: 0, top: idx === 0 ? 16 : 18, width: 24, height: 24, borderRadius: '50%', background: kindColor, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.9375rem', fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: '0 2px 8px rgba(34,30,26,0.14)' }}>
                        {idx + 1}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', fontWeight: 500, color: INK, lineHeight: 1.24 }}>{v.name}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: '1rem', color: FAINT, flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <strong style={{ fontWeight: 500 }}>{v.distKm != null ? v.distKm.toFixed(1) : '—'}</strong>
                          <span style={{ fontSize: '0.9375rem' }}>km</span>
                        </div>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', minHeight: 24, padding: '4px 11px', borderRadius: 99, background: VENUE_KIND_PILL[kind].background, fontFamily: "var(--font-body)", fontSize: '0.9375rem', fontWeight: 500, color: VENUE_KIND_PILL[kind].color, marginTop: 3, marginBottom: address ? 4 : 0, lineHeight: 1 }}>
                        {typeTag}
                      </div>
                      {address && (
                        <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: FAINT, marginTop: 2 }}>{address}</div>
                      )}
                      <span
                        data-row-arrow
                        aria-hidden="true"
                        style={{ position: 'absolute', right: 8, top: 30, transform: 'translate(-8px, -50%)', opacity: 0, color: FAINT, fontSize: 24, lineHeight: 1, transition: 'opacity 0.18s ease, transform 0.18s ease' }}
                      >
                        →
                      </span>
                    </div>
                  )
                })
              : (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: '0.9375rem', color: '#9A9A9A', padding: '20px 0' }}>
                    {lat == null ? 'Set your location to see nearby cool spaces.' : 'Finding nearby cool spaces…'}
                  </div>
                )
            }
          </div>

          <div style={{ marginTop: 18 }}>
            <MiniMapCard venues={nearestVenues} onOpen={() => onOpenMap()} />
          </div>
        </div>
    </SectionContainer>
  )
}
