import L from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { VENUE_KIND_COLOR, venueTypeKind } from '../../../utils/venueDisplay'
import { INK, RULE } from '../../../styles/colors'
import { MELBOURNE_CENTER } from '../../../constants/locations'

export default function MiniMapCard({ venues, onOpen }) {
  const dots = venues.length ? venues : [{ name: 'Nearby cool space', type: 'Library' }]
  const validDots = dots.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
  const center = validDots.length
    ? [validDots[0].lat, validDots[0].lng]
    : MELBOURNE_CENTER

  return (
    <div
      className="cs-mini-map-card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
      style={{ height: 360, background: '#E8F0F5', borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `1px solid ${RULE}`, boxShadow: '0 4px 24px rgba(34,30,26,0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 20px 46px rgba(34,30,26,0.12)'
        e.currentTarget.style.borderColor = 'rgba(138,63,40,0.28)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(34,30,26,0.04)'
        e.currentTarget.style.borderColor = RULE
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          key={`${center[0]}-${center[1]}-${validDots.length}`}
          center={center}
          zoom={14}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', filter: 'saturate(0.76) contrast(0.94) brightness(1.04)' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {validDots.slice(0, 3).map((v, i) => {
            const kind = venueTypeKind(v)
            const color = VENUE_KIND_COLOR[kind]
            return (
              <Marker
                key={v.id ?? v.name ?? i}
                position={[v.lat, v.lng]}
                icon={L.divIcon({
                  className: '',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                  html: `<div style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:${color};color:white;border:3px solid white;box-shadow:0 4px 12px rgba(34,30,26,.22);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700">${i + 1}</div>`,
                })}
              />
            )
          })}
        </MapContainer>
      </div>
      {validDots.length === 0 && dots.slice(0, 3).map((v, i) => {
        const kind = venueTypeKind(v)
        const color = VENUE_KIND_COLOR[kind]
        const positions = [[28, 34], [62, 52], [44, 70]]
        return (
          <div key={v.id ?? v.name ?? i} title={v.name} style={{ position: 'absolute', left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, transform: 'translate(-50%,-50%)', width: 26, height: 26, borderRadius: '50%', background: color, border: '3px solid #fff', boxShadow: '0 6px 16px rgba(34,30,26,0.22)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 800 }}>
            {i + 1}
          </div>
        )
      })}
      <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', borderRadius: 99, padding: '9px 18px', boxShadow: '0 8px 24px rgba(34,30,26,0.12)', fontFamily: "var(--font-body)", fontSize: 'var(--text-label)', fontWeight: 600, color: INK }}>
        Open spaces →
      </div>
    </div>
  )
}
