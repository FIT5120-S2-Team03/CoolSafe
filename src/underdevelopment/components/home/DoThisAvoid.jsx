/**
 * Section 3 — "What to do / avoid today".
 * Two labelled rows of three image-based hover-expand cards each.
 * Dark background #111A2C.
 */

const DO_CARDS = [
  {
    key: 'hydration',
    title: 'Stay Hydrated',
    category: 'DO THIS',
    body: "Drink a glass of water every hour — even if you don't feel thirsty. Your body needs fluid to regulate heat.",
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=700&q=80',
    cls: 'gc-hydration',
  },
  {
    key: 'cool-body',
    title: 'Cool Your Body',
    category: 'DO THIS',
    body: 'Apply a cool, damp cloth to your neck and wrists. Cooling pulse points lowers your core temperature fast.',
    image: 'https://images.unsplash.com/photo-1602932213623-cc17e9541bb4?q=80&w=2670&auto=format&fit=crop',
    cls: 'gc-cool-body',
  },
  {
    key: 'cool-space',
    title: 'Find a Cool Space',
    category: 'DO THIS',
    body: "Libraries, community centres and shopping centres are free and air-conditioned. Check the map for what's open near you.",
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80',
    cls: 'gc-cool-space',
  },
]

const AVOID_CARDS = [
  {
    key: 'peak-sun',
    title: 'Peak Sun Hours',
    category: 'AVOID',
    body: 'Avoid being outdoors between 11 AM and 4 PM. Direct sun during peak hours dramatically increases your heat risk.',
    image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=700&q=80',
    cls: 'gc-peak-sun',
  },
  {
    key: 'alcohol',
    title: 'Alcohol & Heavy Meals',
    category: 'AVOID',
    body: 'Alcohol accelerates dehydration and impairs heat response. Heavy meals generate extra internal heat — both raise your risk.',
    image: 'https://plus.unsplash.com/premium_photo-1728176933865-3c2221defa69?q=80&w=2680&auto=format&fit=crop',
    cls: 'gc-alcohol',
  },
  {
    key: 'alone',
    title: 'Staying Home Alone',
    category: 'AVOID',
    body: 'Poorly ventilated homes can exceed outdoor temperatures. Let someone know where you are and check on elderly neighbours.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80',
    cls: 'gc-alone',
  },
]

const CSS = `
  .g-card{position:relative;overflow:hidden;flex:1;min-height:0;transition:flex .45s cubic-bezier(.4,0,.2,1);cursor:default;}
  .g-card:hover{flex:2.6;}
  .g-card:not(:last-child){border-right:1px solid rgba(255,255,255,0.06);}
  .g-card-img{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .5s ease;}
  .g-card:hover .g-card-img{transform:scale(1.04);}
  .g-card-overlay{position:absolute;inset:0;transition:background .35s;}
  .g-card-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:22px;z-index:1;}
  .g-card-cat{font-family:'DM Sans',sans-serif;font-size:0.8125rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:7px;opacity:0;transition:opacity .3s;}
  .g-card:hover .g-card-cat{opacity:1;}
  .g-card-title{font-family:'DM Sans',sans-serif;font-size:1.25rem;font-weight:700;color:#fff;line-height:1.2;margin-bottom:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:white-space .1s .3s;}
  .g-card:hover .g-card-title{white-space:normal;text-overflow:unset;}
  .g-card-body{font-family:'DM Sans',sans-serif;font-size:0.9375rem;color:rgba(255,255,255,.8);line-height:1.6;max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1),margin .3s;}
  .g-card:hover .g-card-body{max-height:200px;margin-top:10px;}

  /* per-card overlay colours */
  .gc-hydration  .g-card-overlay{background:linear-gradient(to top,rgba(24,82,180,.82) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-hydration:hover .g-card-overlay{background:linear-gradient(to top,rgba(24,82,180,.92) 0%,rgba(24,82,180,.4) 55%,rgba(0,0,0,.05) 100%);}
  .gc-cool-body  .g-card-overlay{background:linear-gradient(to top,rgba(42,125,79,.82) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-cool-body:hover .g-card-overlay{background:linear-gradient(to top,rgba(42,125,79,.92) 0%,rgba(42,125,79,.4) 55%,rgba(0,0,0,.05) 100%);}
  .gc-cool-space .g-card-overlay{background:linear-gradient(to top,rgba(42,125,79,.9) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-cool-space:hover .g-card-overlay{background:linear-gradient(to top,rgba(42,125,79,.92) 0%,rgba(42,125,79,.4) 55%,rgba(0,0,0,.05) 100%);}
  .gc-peak-sun   .g-card-overlay{background:linear-gradient(to top,rgba(140,80,0,.82) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-peak-sun:hover .g-card-overlay{background:linear-gradient(to top,rgba(140,80,0,.92) 0%,rgba(140,80,0,.4) 55%,rgba(0,0,0,.05) 100%);}
  .gc-alcohol    .g-card-overlay{background:linear-gradient(to top,rgba(80,40,140,.82) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-alcohol:hover .g-card-overlay{background:linear-gradient(to top,rgba(80,40,140,.92) 0%,rgba(80,40,140,.4) 55%,rgba(0,0,0,.05) 100%);}
  .gc-alone      .g-card-overlay{background:linear-gradient(to top,rgba(120,40,140,.9) 0%,rgba(0,0,0,.2) 55%,transparent 100%);}
  .gc-alone:hover .g-card-overlay{background:linear-gradient(to top,rgba(120,40,140,.92) 0%,rgba(120,40,140,.4) 55%,rgba(0,0,0,.05) 100%);}
`

function GCard({ card }) {
  return (
    <div className={`g-card ${card.cls}`}>
      <div className="g-card-img" style={{ backgroundImage: `url('${card.image}')` }} />
      <div className="g-card-overlay" />
      <div className="g-card-content">
        <div className="g-card-cat">{card.category}</div>
        <div className="g-card-title">{card.title}</div>
        <div className="g-card-body">{card.body}</div>
      </div>
    </div>
  )
}

function RowLabel({ color, icon, text, dividerColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color }}>
        {icon} {text}
      </span>
      <span style={{ flex: 1, height: 1, background: dividerColor }} />
    </div>
  )
}

/* riskLevel prop is accepted but cards are static (matching the HTML prototype) */
export default function DoThisAvoid({ riskLevel }) {
  return (
    <div style={{ padding: 'clamp(40px,5vh,72px) clamp(20px,4vw,56px) 32px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{CSS}</style>

      {/* Section heading */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 'clamp(1.375rem,2.5vw,2rem)', letterSpacing: '-1px', color: '#fff' }}>
          What to do today
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.9375rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          Hover any card for details — based on today's heat conditions
        </div>
      </div>

      {/* DO THIS label + cards */}
      <RowLabel color="#6fcf97" icon="✓" text="Do this" dividerColor="rgba(111,207,151,0.2)" />
      <div style={{ display: 'flex', minHeight: 0, borderRadius: 14, overflow: 'hidden', gap: 2, background: 'rgba(255,255,255,0.05)', flex: 1, marginTop: 6, marginBottom: 14 }}>
        {DO_CARDS.map((card) => <GCard key={card.key} card={card} />)}
      </div>

      {/* AVOID label + cards */}
      <RowLabel color="#f2994a" icon="✕" text="Avoid this" dividerColor="rgba(242,153,74,0.2)" />
      <div style={{ display: 'flex', minHeight: 0, borderRadius: 14, overflow: 'hidden', gap: 2, background: 'rgba(255,255,255,0.05)', flex: 1, marginTop: 6 }}>
        {AVOID_CARDS.map((card) => <GCard key={card.key} card={card} />)}
      </div>
    </div>
  )
}
