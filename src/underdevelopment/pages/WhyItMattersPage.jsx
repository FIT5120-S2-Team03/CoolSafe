import Navbar from '../components/layout/Navbar'

const TEMP_CARDS = [
  {
    range: 'Below 28°',
    label: 'SAFE',
    color: '#2A7D4F',
    bg: '#EAF5EE',
    desc: 'Stay hydrated and enjoy outdoor activities at any time of day.',
  },
  {
    range: '28–32°',
    label: 'CAUTION',
    color: '#B87200',
    bg: '#FDF5E6',
    desc: 'Avoid prolonged sun exposure. Drink frequently and rest during peak hours.',
  },
  {
    range: '32–38°',
    label: 'HEAT ALERT',
    color: '#C94B1A',
    bg: '#FDF0EB',
    desc: "Victoria's official threshold. Limit outdoor time. Check on neighbours.",
  },
  {
    range: 'Above 38°',
    label: 'EXTREME',
    color: '#8B0000',
    bg: '#fde8e8',
    desc: 'Stay indoors. Visit a cool space. Call 000 if someone shows heat stroke signs.',
  },
]

export default function WhyItMattersPage() {
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', paddingTop: 80 }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 60px' }}>

        {/* Hero heading */}
        <h1 className="why-heading" style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '2.5rem',
          color: '#0F0F0F',
          letterSpacing: '-1.5px',
          lineHeight: 1.1,
          marginBottom: 8,
          fontWeight: 'normal',
        }}>
          Heat is the deadliest<br />natural hazard in Australia.
        </h1>

        {/* Subheading */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.0625rem',
          color: '#5C5C5C',
          maxWidth: 500,
          lineHeight: 1.65,
          marginBottom: 48,
          marginTop: 0,
        }}>
          Most heat-related illness is preventable. Knowing the numbers and warning signs can save your life or someone else's.
        </p>

        {/* Dark stats panel */}
        <div style={{
          background: '#0F2044',
          borderRadius: 20,
          padding: 40,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 20,
          marginBottom: 48,
        }}>
          {/* Left stat card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '3.5rem', color: '#fff', letterSpacing: '-2px', lineHeight: 1, fontWeight: 'normal' }}>374</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)' }}>
              Excess deaths
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, flex: 1 }}>
              Victoria's 2009 heatwave — more than Black Saturday that same week.
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Victorian Department of Health
            </div>
          </div>

          {/* Middle image */}
          <div style={{
            borderRadius: 14,
            overflow: 'hidden',
            minHeight: 240,
            backgroundImage: 'url(https://cff2.earth.com/uploads/2025/08/04091510/older-adults-heat-waves-1400x850.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />

          {/* Right stat card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '3.5rem', color: '#fff', letterSpacing: '-2px', lineHeight: 1, fontWeight: 'normal' }}>3×</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)' }}>
              Higher risk
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, flex: 1 }}>
              Adults over 65 are three times more likely to suffer heat stroke due to reduced sweating and thirst sensation.
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Australian Institute of Health and Welfare
            </div>
          </div>
        </div>

        {/* Temperature scale */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '1.625rem',
            color: '#0F0F0F',
            marginBottom: 16,
            letterSpacing: '-0.5px',
            fontWeight: 'normal',
          }}>
            What the temperature means
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {TEMP_CARDS.map((card) => (
              <div key={card.range} style={{ background: card.bg, borderRadius: 14, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', color: card.color, letterSpacing: '-0.3px', fontWeight: 'normal' }}>
                  {card.range}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: card.color }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#3A3A3A', lineHeight: 1.6, marginTop: 4 }}>
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
