/**
 * Always-visible card comparing tomorrow's forecast to today's and offering
 * a simple actionable suggestion based on the expected heat level.
 */
export default function TomorrowAlertCard({ daily }) {
  if (!daily || daily.tomorrowMax == null) return null

  const { tomorrowMax, todayMax } = daily

  let title, subtitle, suggestion

  if (tomorrowMax >= 35) {
    const isSafer = tomorrowMax < todayMax
    title = isSafer ? 'Tomorrow looks a little safer' : 'Tomorrow is also dangerous'
    subtitle = `Today peaks at ${Math.round(todayMax)}°C · Tomorrow peaks at ${Math.round(tomorrowMax)}°C`
    suggestion = isSafer
      ? '→ Consider planning outdoor errands for tomorrow morning before 10 AM'
      : '→ Plan ahead: locate your nearest cooling centre before the heat arrives'
  } else if (tomorrowMax >= 28) {
    title = 'Tomorrow will be warm'
    subtitle = `Tomorrow peaks at ${Math.round(tomorrowMax)}°C — warm but manageable`
    suggestion = '→ Stick to morning or evening for outdoor activity and keep water handy'
  } else {
    title = 'Tomorrow looks cool and comfortable'
    subtitle = `Tomorrow peaks at ${Math.round(tomorrowMax)}°C — great conditions to be outside`
    suggestion = '→ A good day to run errands, go for a walk, or spend time outdoors'
  }

  return (
    <div
      className="bg-white rounded-[8px] flex gap-4 items-start w-full"
      style={{
        borderLeft: '4px solid #0d9488',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        padding: '16px 16px 16px 20px',
      }}
    >
      <span className="text-[24px] pt-1">🌤</span>
      <div className="flex flex-col gap-1">
        <p className="font-['Public_Sans'] font-bold text-[16px] text-[#1a1c1e]">{title}</p>
        <p className="font-['Public_Sans'] text-[14px] text-[#64748b]">{subtitle}</p>
        <p className="font-['Public_Sans'] text-[14px] text-[#0d9488]" style={{ fontWeight: 500 }}>
          {suggestion}
        </p>
      </div>
    </div>
  )
}
