import { useMemo } from 'react'
import useCoolSpaces from '../../hooks/useCoolSpaces'
import useFountains from '../../hooks/useFountains'
import { CATEGORY_MARKER_COLORS } from '../../utils/categoryMapping'

const ORDERED_CATEGORIES = [
  'Arts & Culture',
  'Recreation',
  'Learning',
  'Community Support',
  'Visitor Info',
  'Fountain',
]

export default function MapSidebar({ mobile = false, selectedCategories, onCategoriesChange, showHVI, onHVIToggle }) {
  const { venues } = useCoolSpaces()
  const { fountains } = useFountains()

  const counts = useMemo(() => {
    const result = {}
    for (const v of venues) {
      result[v.category] = (result[v.category] ?? 0) + 1
    }
    result['Fountain'] = fountains.length
    return result
  }, [venues, fountains])

  const isAll = selectedCategories.length === 0

  function toggleCategory(cat) {
    if (cat === 'All') { onCategoriesChange([]); return }
    const next = new Set(selectedCategories)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    onCategoriesChange([...next])
  }

  return (
    <aside
      className={mobile ? 'cs-map-sidebar cs-map-sidebar-mobile' : 'cs-map-sidebar hidden md:flex flex-col gap-5 overflow-y-auto shrink-0'}
      style={{
        width: mobile ? '100%' : 320,
        height: mobile ? 'auto' : '100%',
        backgroundColor: 'var(--color-paper)',
        borderRight: mobile ? 'none' : '1px solid var(--color-rule)',
        padding: mobile ? 0 : '24px 18px',
      }}
    >
      <style>{`
        .cs-map-pill,
        .cs-map-hvi {
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease;
        }
        .cs-map-pill:hover,
        .cs-map-hvi:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(34,30,26,0.08);
        }
        .cs-map-pill:active,
        .cs-map-hvi:active {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 3px 8px rgba(34,30,26,0.08);
        }
        .cs-map-pill:focus-visible,
        .cs-map-hvi:focus-visible {
          outline: 3px solid rgba(24,82,180,0.16);
          outline-offset: 3px;
        }
      `}</style>

      {/* Category section */}
      <div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 'var(--text-label)',
          color: 'var(--color-ink-muted)',
          letterSpacing: 0,
          marginBottom: 12,
        }}>
          Category
        </p>

        {/* Natural-width flex-wrap pills — each pill sizes to its content */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <CategoryPill
            label="All"
            count={venues.length}
            dotColor="#1a1a1a"
            isSelected={isAll}
            onClick={() => toggleCategory('All')}
          />
          {ORDERED_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              count={counts[cat] ?? 0}
              dotColor={CATEGORY_MARKER_COLORS[cat]}
              isSelected={!isAll && selectedCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* HVI Layer toggle */}
      <button
        type="button"
        className="cs-map-hvi"
        onClick={onHVIToggle}
        aria-pressed={showHVI}
        aria-label="Toggle Heat Vulnerability Layer"
        style={{
          backgroundColor: 'var(--color-warm)',
          border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          textAlign: 'left',
          cursor: 'pointer',
        }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 'var(--text-caption)',
          color: 'var(--color-ink)',
          marginBottom: 6,
        }}>
          Heat Vulnerability
        </p>

        {/* subtitle + toggle on the same row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-caption)',
            color: 'var(--color-ink-muted)',
            lineHeight: 1.4,
          }}>
            Shows high-risk suburbs
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'relative',
              display: 'inline-block',
              width: 44,
              height: 24,
              backgroundColor: showHVI ? 'var(--color-blue)' : 'var(--color-rule)',
              borderRadius: 'var(--radius-pill)',
              flexShrink: 0,
              transition: 'background-color 0.2s',
              padding: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              left: showHVI ? 24 : 4,
              top: 4,
              width: 16,
              height: 16,
              backgroundColor: '#fff',
              borderRadius: '50%',
              transition: 'left 0.2s',
            }} />
          </span>
        </div>
      </button>
    </aside>
  )
}

function CategoryPill({ label, count, dotColor, isSelected, onClick }) {
  const pillStyle = isSelected
    ? { background: 'var(--color-surface)', border: `2px solid ${dotColor}`, color: 'var(--color-ink)' }
    : { background: 'var(--color-surface)', border: '1.5px solid var(--color-rule)', color: 'var(--color-ink)' }

  return (
    <button
      type="button"
      className="cs-map-pill"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-caption)',
        fontWeight: isSelected ? 600 : 400,
        whiteSpace: 'nowrap',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease, background 0.15s, border-color 0.15s, color 0.15s',
        ...pillStyle,
      }}
    >
      {/* Legend dot */}
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: dotColor,
        opacity: isSelected ? 1 : 0.8,
        display: 'inline-block',
      }} />

      <span>{label}</span>

      {/* Count */}
      <span style={{
        flexShrink: 0,
        opacity: isSelected ? 0.6 : 0.45,
        fontWeight: 400,
      }}>
        {count}
      </span>
    </button>
  )
}
