import { useNavigate } from 'react-router-dom'

const ArrowIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Dot = ({ color }) => (
  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, marginTop: '0.2em' }} />
)

export default function GetHelpSection() {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 860, padding: '0 56px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '2.25rem', color: '#0F0F0F', letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 8 }}>
            If you need help
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#5C5C5C' }}>
            Know the warning signs and who to call
          </div>
        </div>

        {/* Two side-by-side banners */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Left — Not feeling well? */}
          <div style={{ background: 'rgba(24,82,180,0.06)', border: '1px solid rgba(24,82,180,0.15)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', color: '#1852B4', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Not feeling well?
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.125rem', fontWeight: 700, color: '#0F0F0F', marginBottom: 14 }}>
                Check how you feel
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Feeling unusually tired or dizzy',
                  'Headache or nausea',
                  "Skin feels hot but you're not sweating",
                  "Dark urine or haven't urinated recently",
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#3A3A3A', lineHeight: 1.5 }}>
                    <Dot color="#1852B4" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <a
              href="tel:1300606024"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1852B4', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', marginTop: 'auto' }}
            >
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>
                  Free · 24 hours · Nurse-on-Call
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.375rem', fontWeight: 700, color: '#fff' }}>
                  1300 606 024
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <ArrowIcon />
              </div>
            </a>
          </div>

          {/* Right — Emergency warning signs */}
          <div style={{ background: 'rgba(201,75,26,0.06)', border: '1px solid rgba(201,75,26,0.15)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', color: '#C94B1A', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Emergency Warning Signs
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.125rem', fontWeight: 700, color: '#0F0F0F', marginBottom: 14 }}>
                Call 000 immediately if you see:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: '#C94B1A', bold: 'Heat stroke', rest: ' — hot dry skin, confusion, not sweating' },
                  { color: '#E85D1A', bold: 'Severe heat exhaustion', rest: ' — heavy sweating, weakness, pale skin' },
                  { color: '#E85D1A', bold: 'Collapse or unconsciousness', rest: ' — any loss of consciousness in heat' },
                ].map((item) => (
                  <div key={item.bold} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: '#3A3A3A', lineHeight: 1.5 }}>
                    <Dot color={item.color} />
                    <span><strong>{item.bold}</strong>{item.rest}</span>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="tel:000"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#C94B1A', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', marginTop: 'auto' }}
            >
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>
                  Emergency · Ambulance · Fire · Police
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.375rem', fontWeight: 700, color: '#fff' }}>
                  000
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <ArrowIcon />
              </div>
            </a>
          </div>

        </div>

        {/* Full-width cooling locations bar */}
        <div
          onClick={() => navigate('/map')}
          style={{ background: '#2A7D4F', borderRadius: 14, padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'opacity 0.18s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
              Cooling Locations
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#fff', fontWeight: 500 }}>
              Find a cool space near me — libraries, gardens and community centres open now
            </div>
          </div>
          <div style={{ color: '#fff', marginLeft: 20, flexShrink: 0 }}>
            <ArrowIcon size={18} />
          </div>
        </div>

      </div>
    </div>
  )
}
