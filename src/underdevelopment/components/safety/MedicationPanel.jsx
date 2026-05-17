import { useState } from 'react'
import { LEVEL_META, MED_ADVICE, MED_LEVEL } from '../../data/safetyContent'
import { INK, MUTED, RULE } from '../../styles/colors'

export default function MedicationPanel({ selectedMedications }) {
  const sorted = [...selectedMedications].sort((a, b) =>
    (LEVEL_META[MED_LEVEL[a] ?? 'mild'].sortOrder) - (LEVEL_META[MED_LEVEL[b] ?? 'mild'].sortOrder)
  )

  const levels = [...new Set(sorted.map(m => MED_LEVEL[m] ?? 'mild'))]
  const showTabs = levels.length > 1

  const [activeTab, setActiveTab] = useState('all')

  const displayed = activeTab === 'all'
    ? sorted
    : sorted.filter(m => (MED_LEVEL[m] ?? 'mild') === activeTab)

  return (
    <div style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 22, padding: '22px 24px', boxShadow: '0 1px 8px rgba(34,30,26,0.06)' }}>
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-title-sm)', fontWeight: 'normal', color: INK, margin: '0 0 16px', lineHeight: 1.1 }}>
        How your medications affect heat.
      </h3>

      {showTabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', background: 'rgba(34,30,26,0.04)', padding: 4, borderRadius: 12 }}>
          {['all', ...levels].map(tab => {
            const meta = tab === 'all' ? null : LEVEL_META[tab]
            const active = activeTab === tab
            return (
              <button
                key={tab}
                className="cs-med-tab"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 9, cursor: 'pointer', border: 'none',
                  background: active ? INK : '#fff',
                  color: active ? '#fff' : MUTED,
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.02em',
                }}
              >
                {tab === 'all' ? 'All' : meta.label}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {displayed.map((med) => {
          const level = MED_LEVEL[med] ?? 'mild'
          const meta = LEVEL_META[level]
          return (
            <div key={med} style={{ background: '#FFFCF8', border: `1px solid ${RULE}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', fontWeight: 700, color: INK }}>{med}</span>
                <span style={{ padding: '3px 10px', borderRadius: 99, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {meta.label}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: MUTED, lineHeight: 1.5, margin: 0 }}>
                {MED_ADVICE[med] ?? 'Ask your doctor or pharmacist how this medicine may affect you in hot weather.'}
              </p>
            </div>
          )
        })}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: MUTED, lineHeight: 1.45, margin: '12px 0 0', paddingTop: 12, borderTop: `1px solid ${RULE}`, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, marginTop: 1, flexShrink: 0, color: MUTED }}>info</span>
        These notes are general. Keep taking prescribed medicine unless a clinician tells you otherwise.
      </p>
    </div>
  )
}
