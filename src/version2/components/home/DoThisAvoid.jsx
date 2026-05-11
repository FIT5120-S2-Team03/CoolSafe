/**
 * Section 3 — "What to do / avoid today".
 * Light background. Four equal cards in one row: 2 DO (left) + 2 AVOID (right).
 * Group tags sit above each pair of cards, outside the card area.
 * Content is driven by the current apparent temperature from useWeatherData.
 */
import { useMemo } from 'react'
import { useWeatherData } from '../../hooks/useWeatherData'

const TIER_CONTENT = {
  safe: {
    do: [
      {
        key: 'outdoors-early',
        title: 'Get Outdoors Early',
        body: 'Morning is the best time for a walk or light activity. Enjoy the cooler air before midday.',
        image: 'https://chaskaheights.com/wp-content/uploads/2024/10/7-fun-outdoor-activities-for-seniors-1.jpg',
        rgb: '42,125,79',
      },
      {
        key: 'hydration',
        title: 'Stay Hydrated',
        body: 'Drink water regularly even on mild days. Your body still loses fluid through normal activity.',
        image: 'https://www.nationalchurchresidences.org/wp-content/uploads/2023/08/iStock-842793752.jpg',
        rgb: '24,82,180',
      },
    ],
    avoid: [
      {
        key: 'sun-protection',
        title: 'Skipping Sun Protection',
        body: "UV can be high even when it doesn't feel hot. Wear a hat and apply SPF 30+ if you're outside for more than 20 minutes.",
        image: 'https://www.jeffersonhealth.org/content/dam/health2021/images/photos/stock/people/non-clinical/woman-applying-sunscreen.jpg',
        rgb: '140,80,0',
      },
      {
        key: 'forecast',
        title: 'Ignoring the Forecast',
        body: "Today may be mild but tomorrow could be very different. Check tomorrow's outlook before planning activities.",
        image: 'https://glamadelaide.com.au/wp-content/uploads/2026/04/IMG_7622.jpeg',
        rgb: '120,40,140',
      },
    ],
  },

  caution: {
    do: [
      {
        key: 'morning-outing',
        title: 'Plan Outings Before 11 AM',
        body: 'Temperatures are rising. Get errands or walks done in the morning while conditions are still manageable.',
        image: 'https://chaskaheights.com/wp-content/uploads/2024/10/7-fun-outdoor-activities-for-seniors-1.jpg',
        rgb: '42,125,79',
      },
      {
        key: 'hourly-water',
        title: 'Drink Water Every Hour',
        body: "Don't wait until you feel thirsty. Older adults have a reduced thirst response — set a reminder if needed.",
        image: 'https://www.nationalchurchresidences.org/wp-content/uploads/2023/08/iStock-842793752.jpg',
        rgb: '24,82,180',
      },
    ],
    avoid: [
      {
        key: 'noon-outdoors',
        title: 'Midday Outdoor Activity',
        body: 'This is when heat stress peaks. If you must go out, stay in the shade and keep it short.',
        image: 'https://d2hl08zg7q4l7p.cloudfront.net/wp-content/uploads/2022/06/09135701/heat-stroke-iStock-956861656.jpg',
        rgb: '140,80,0',
      },
      {
        key: 'alcohol',
        title: 'Alcohol & Caffeine',
        body: 'Both accelerate fluid loss. Stick to water or diluted juice to stay properly hydrated.',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1gcFrz_0HHwnFDqfHt0michiv74pxZ6GkGg&s',
        rgb: '120,40,140',
      },
    ],
  },

  heat: {
    do: [
      {
        key: 'cool-space',
        title: 'Find a Cool Space',
        body: "Libraries, shopping centres and community centres are free to enter and cool. Use the map to find the closest one open now.",
        image: 'https://www.visitmelbourne.com/-/media/atdw/melbourne/see-and-do/art-and-culture/literature/ec199619a66f52d96fac92d67f6230c7_1600x1200.jpeg?ts=20230501390617',
        rgb: '42,125,79',
      },
      {
        key: 'cool-body',
        title: 'Cool Your Body',
        body: 'Apply a cold, damp cloth to your neck, wrists and forehead. This lowers your core temperature quickly.',
        image: 'https://cdn.shopify.com/s/files/1/0661/1936/8857/files/Cooling_Towel_vs_Neck_Fan_Which_One_Is_Better_1_1.png?v=1749545368',
        rgb: '24,82,180',
      },
    ],
    avoid: [
      {
        key: 'no-plan',
        title: 'Going Out Without a Plan',
        body: "Only go out if you know exactly where you're heading. Have a cool destination ready before you leave.",
        image: 'https://static.scientificamerican.com/sciam/cache/file/6A7BF2A3-9FAC-4EB4-96A3BCADD74698D7_source.jpg?w=1200',
        rgb: '140,80,0',
      },
      {
        key: 'strenuous',
        title: 'Strenuous Activity',
        body: "Even in the evening, your body hasn't recovered from the day's heat. Rest and stay cool.",
        image: 'https://mgriblog.org/wp-content/uploads/2018/02/marathon-running.jpg',
        rgb: '120,40,140',
      },
    ],
  },

  extreme: {
    do: [
      {
        key: 'stay-indoors',
        title: 'Stay Indoors All Day',
        body: 'Do not go outside unless it is an emergency. The risk of heat stroke at this temperature is serious and fast-moving.',
        image: 'https://thiis.co.uk/wp-content/uploads/2022/03/Credit_Tunstall-Healthcare-MyAmie-121.jpg',
        rgb: '42,125,79',
      },
      {
        key: 'call-someone',
        title: 'Call Someone Now',
        body: "Phone a family member or neighbour to let them know you're home alone. Agree on a check-in time.",
        image: 'https://www.mentalhealthandaging.com/wp-content/uploads/2021/04/nIPkG25gRdOO69pbj3zs_elderly_parent_calling_multiple_times_a_day_1.png',
        rgb: '24,82,180',
      },
    ],
    avoid: [
      {
        key: 'any-outdoors',
        title: 'Any Outdoor Activity',
        body: 'Even a short walk in 38°+ heat can be dangerous for older adults. Wait until temperatures drop below 30°C.',
        image: 'https://static.scientificamerican.com/sciam/cache/file/6A7BF2A3-9FAC-4EB4-96A3BCADD74698D7_source.jpg?w=1200',
        rgb: '140,80,0',
      },
      {
        key: 'ignore-symptoms',
        title: 'Ignoring Symptoms',
        body: 'Dizziness, confusion or stopping sweating in this heat is a medical emergency — call 000 immediately.',
        image: 'https://www.policehealth.com.au/siteassets/images/page-headers/ph_findingacontractedhospital_headerimage_mobile_v1.jpg',
        rgb: '120,40,140',
      },
    ],
  },
}

const TIER_LABEL = {
  safe:    'Safe conditions',
  caution: 'Caution conditions',
  heat:    'High Risk conditions',
  extreme: 'Extreme Heat',
}

function getTier(apparentTemp) {
  if (apparentTemp == null) return 'caution'
  if (apparentTemp < 28) return 'safe'
  if (apparentTemp < 32) return 'caution'
  if (apparentTemp < 38) return 'heat'
  return 'extreme'
}

const CSS = `
  .g-card {
    position: relative; overflow: hidden; flex: 1; cursor: default;
    border-radius: 12px;
  }
  .g-card-img {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    transition: transform .5s ease;
  }
  .g-card:hover .g-card-img { transform: scale(1.05); }
  .g-card-overlay {
    position: absolute; inset: 0; transition: background .35s;
    background: linear-gradient(to top, rgba(var(--card-rgb),.88) 0%, rgba(0,0,0,.12) 50%, transparent 100%);
  }
  .g-card:hover .g-card-overlay {
    background: linear-gradient(to top, rgba(var(--card-rgb),.95) 0%, rgba(var(--card-rgb),.45) 55%, rgba(0,0,0,.04) 100%);
  }
  .g-card-content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 20px; z-index: 1;
  }
  .g-card-title {
    font-family: 'DM Sans',sans-serif; font-size: 1.125rem;
    font-weight: 700; color: #fff; line-height: 1.25;
  }
  .g-card-body {
    font-family: 'DM Sans',sans-serif; font-size: 0.875rem;
    color: rgba(255,255,255,.85); line-height: 1.55;
    max-height: 0; overflow: hidden;
    transition: max-height .4s cubic-bezier(.4,0,.2,1), margin .3s;
  }
  .g-card:hover .g-card-body { max-height: 160px; margin-top: 8px; }
`

function GCard({ card }) {
  return (
    <div className="g-card" style={{ '--card-rgb': card.rgb }}>
      <div className="g-card-img" style={{ backgroundImage: `url('${card.image}')` }} />
      <div className="g-card-overlay" />
      <div className="g-card-content">
        <div className="g-card-title">{card.title}</div>
        <div className="g-card-body">{card.body}</div>
      </div>
    </div>
  )
}

function GroupTag({ type }) {
  const isDo = type === 'do'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color:      isDo ? '#1a7a40' : '#b84000',
        background: isDo ? 'rgba(26,122,64,0.1)' : 'rgba(184,64,0,0.1)',
        border:     `1px solid ${isDo ? 'rgba(26,122,64,0.25)' : 'rgba(184,64,0,0.25)'}`,
        padding: '4px 12px',
        borderRadius: 99,
      }}>
        {isDo ? '✓  Do this' : '✕  Avoid this'}
      </span>
    </div>
  )
}

export default function DoThisAvoid({ riskLevel }) {
  const { current } = useWeatherData()
  const tier = useMemo(() => getTier(current?.apparentTemp ?? null), [current])
  const { do: doCards, avoid: avoidCards } = TIER_CONTENT[tier]
  const tempStr = current?.apparentTemp != null ? ` (${Math.round(current.apparentTemp)}°C feels like)` : ''

  return (
    <div style={{
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      padding: 'clamp(32px,4.5vh,56px) clamp(20px,4vw,56px) clamp(24px,3.5vh,44px)',
      background: '#F5F3EE',
    }}>
      <style>{CSS}</style>

      {/* Heading */}
      <div style={{ flexShrink: 0, marginBottom: 'clamp(14px,2vh,24px)' }}>
        <div style={{
          fontFamily: "'DM Serif Display',Georgia,serif",
          fontSize: 'clamp(1.5rem,2.8vw,2.25rem)',
          letterSpacing: '-1px',
          color: '#0F0F0F',
          lineHeight: 1.15,
        }}>
          What to do today
        </div>
        <div style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '0.9375rem',
          color: '#6B6B6B',
          marginTop: 6,
          lineHeight: 1.5,
        }}>
          {TIER_LABEL[tier]}{tempStr} — hover any card for advice.
        </div>
      </div>

      {/* Cards row */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 'clamp(12px,2vw,24px)' }}>

        {/* DO group */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <GroupTag type="do" />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 6 }}>
            {doCards.map((card) => <GCard key={card.key} card={card} />)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(0,0,0,0.1)', flexShrink: 0, marginTop: 38 }} />

        {/* AVOID group */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <GroupTag type="avoid" />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 6 }}>
            {avoidCards.map((card) => <GCard key={card.key} card={card} />)}
          </div>
        </div>

      </div>
    </div>
  )
}
