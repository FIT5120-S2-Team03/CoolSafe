import { Link } from 'react-router-dom'
import { INK, MUTED, RULE } from '../../styles/colors'

export default function SafetyQuickLinks() {
  return (
    <div className="cs-safety-quick-links" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76, alignSelf: 'start' }}>
      <QuickLink to="/today" icon="thermostat" title="Today's heat risk" subtitle="Check your personal score" />
      <QuickLink to="/spaces" icon="ac_unit" title="Find cool spaces" subtitle="Libraries, parks, centres" />
    </div>
  )
}

function QuickLink({ icon, subtitle, title, to }) {
  return (
    <Link to={to} className="cs-res-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#fff', border: `1px solid ${RULE}`, borderRadius: 18, textDecoration: 'none', color: INK }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color: MUTED, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-body)', color: INK, whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: MUTED }}>{subtitle}</div>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: MUTED, flexShrink: 0 }}>arrow_forward</span>
    </Link>
  )
}
