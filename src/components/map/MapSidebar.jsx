/**
 * MapSidebar — left panel for the Cool Spaces Map page.
 * Contains category filter pills, a static Heat Vulnerability Layer toggle,
 * and a colour-coded legend.
 *
 * Props:
 *   selectedCategory {string}   — currently active category ('All' or a category name)
 *   onCategoryChange {function} — called with the new category string when a pill is clicked
 */

const CATEGORIES = [
  'All',
  'Arts & Culture',
  'Recreation',
  'Learning',
  'Community Support',
  'Visitor Info',
  'Fountain',
]

const LEGEND_ITEMS = [
  { color: '#8b5cf6', label: 'Arts & Culture' },
  { color: '#10b981', label: 'Recreation' },
  { color: '#1d4ed8', label: 'Learning' },
  { color: '#ec4899', label: 'Support' },
  { color: '#f59e0b', label: 'Visitor Info' },
  { color: '#0ea5e9', label: 'Fountain' },
]

export default function MapSidebar({ selectedCategory, onCategoryChange }) {
  return (
    <aside
      className="hidden md:flex flex-col gap-8 overflow-y-auto shrink-0"
      style={{
        width: 280,
        height: '100%',
        backgroundColor: '#fff',
        borderRight: '1px solid #f1f5f9',
        padding: 24,
      }}
    >
      {/* Category filter */}
      <div>
        <p
          className="uppercase tracking-[0.7px]"
          style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#94a3b8' }}
        >
          Category
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => {
            const active = cat === selectedCategory
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  borderRadius: 12,
                  padding: '7px 12px',
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  backgroundColor: active ? '#003fa4' : '#f3f3f6',
                  borderColor:     active ? '#003fa4' : 'transparent',
                  color:           active ? '#fff'    : '#424654',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* HVI Layer toggle (static OFF state) */}
      <div
        style={{
          backgroundColor: 'rgba(248,250,252,0.5)',
          border: '1px solid #f1f5f9',
          borderRadius: 8,
          padding: 17,
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>🔥</span>
            <div className="flex flex-col">
              <span
                style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 14, color: '#1e293b' }}
              >
                Heat Vulnerability Layer
              </span>
              <span
                style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 12, color: '#64748b' }}
              >
                Shows high-risk suburbs
              </span>
            </div>
          </div>
          {/* Static OFF toggle */}
          <div style={{ position: 'relative', width: 31, height: 24, backgroundColor: '#e2e8f0', borderRadius: 12 }}>
            <div
              style={{
                position: 'absolute',
                left: 4,
                top: 4,
                width: 16,
                height: 16,
                backgroundColor: '#fff',
                borderRadius: '50%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
        <p
          className="uppercase tracking-[1.1px] mb-3"
          style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: '#94a3b8' }}
        >
          Legend
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {LEGEND_ITEMS.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
              />
              <span
                style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 12, color: '#475569' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
