/**
 * Two-column card showing risk-appropriate DO THIS / AVOID advice.
 * Content is static and keyed by riskLevel prop.
 * @module DoThisAvoid
 */

const CONTENT = {
  Low: {
    doThis: [
      '💧 Drink water regularly',
      '🧢 Wear a hat if going outside',
      '🌿 Enjoy outdoor activities in the morning',
      '🏠 Keep your home ventilated',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Intense exercise during midday',
      '🍺 Alcohol in the heat',
      '🚗 Leaving pets or kids in cars',
      '🌞 Extended sun exposure without protection',
      '🍳 Heating up your home with the oven',
    ],
  },
  Moderate: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in cool, shaded areas',
      '🌡 Monitor how you feel throughout the day',
      '👥 Check on neighbours & elderly',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Outdoor exercise or heavy labor',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Going outside during peak heat (11AM–3PM)',
      '🍳 Using the oven or stovetop',
    ],
  },
  High: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in air-conditioned rooms',
      '🪟 Keep blinds and curtains closed',
      '👥 Check on neighbours & elderly',
      '👕 Wear light, loose clothing',
    ],
    avoid: [
      '🏃 Outdoor exercise or heavy labor',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Being outside during peak heat',
      '🍳 Using the oven or stovetop',
    ],
  },
  Extreme: {
    doThis: [
      '💧 Sip water every 20 minutes',
      '🏠 Stay in air-conditioned rooms — go to a cool space if needed',
      '🪟 Keep blinds and curtains closed',
      '👥 Check on neighbours & elderly — call them if possible',
      '🚨 Call 000 if you feel chest pain, confusion or collapse',
    ],
    avoid: [
      '🏃 Any outdoor activity — even brief trips',
      '🍺 Alcohol and excess caffeine',
      '🚗 Leaving pets or kids in cars',
      '☀️ Being outside at any time today',
      '🍳 Using the oven or stovetop — it heats your home',
    ],
  },
}

export default function DoThisAvoid({ riskLevel }) {
  const content = CONTENT[riskLevel] ?? CONTENT.Low

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* DO THIS */}
      <div
        className="shadow-sm"
        style={{
          background: '#e8f5e9',
          borderLeft: '8px solid #006e2f',
          borderRadius: 8,
          padding: '32px 32px 60px 40px',
        }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 30 }}>✅</span>
          <span
            className="uppercase"
            style={{ fontFamily: 'Public Sans', fontWeight: 900, fontSize: 30, color: '#006e2f' }}
          >
            Do This
          </span>
        </div>
        <ul className="flex flex-col" style={{ gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
          {content.doThis.map((item) => (
            <li
              key={item}
              style={{ fontFamily: 'Public Sans', fontWeight: 700, fontSize: 20, color: '#1e293b' }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* AVOID */}
      <div
        className="shadow-sm"
        style={{
          background: '#fff3e0',
          borderLeft: '8px solid rgba(195,198,214,0.3)',
          borderRadius: 8,
          padding: '32px 32px 32px 40px',
        }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 30 }}>❌</span>
          <span
            className="uppercase"
            style={{ fontFamily: 'Public Sans', fontWeight: 900, fontSize: 30, color: '#ea580c' }}
          >
            Avoid
          </span>
        </div>
        <ul className="flex flex-col" style={{ gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
          {content.avoid.map((item) => (
            <li
              key={item}
              style={{ fontFamily: 'Public Sans', fontWeight: 700, fontSize: 20, color: '#1e293b' }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
