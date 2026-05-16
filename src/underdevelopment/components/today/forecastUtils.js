export function fmtH(h) {
  if (h === 0)  return '12AM'
  if (h < 12)   return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getWindows(hourly) {
  if (!hourly) return null
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ t, temp: hourly.apparent_temperature[i] }))
    .filter((s) => s.t.startsWith(today))
  if (!slots.length) return null

  const HOT = 28
  const firstHot = slots.findIndex((s) => s.temp >= HOT)
  const lastHot  = slots.length - 1 - [...slots].reverse().findIndex((s) => s.temp >= HOT)

  const peakMax  = Math.max(...slots.map((s) => s.temp))
  const peakSlot = slots.find((s) => s.temp === peakMax)
  const peakHour = peakSlot ? parseInt(peakSlot.t.slice(11, 13)) : null

  if (firstHot === -1) {
    return { safeTime: 'All day — safe conditions', peakTime: null, peakMax, peakHour }
  }

  const safeBeforeH = parseInt(slots[firstHot].t.slice(11, 13))
  const afterIdx    = lastHot + 1
  const safeAfterH  = afterIdx < slots.length ? parseInt(slots[afterIdx].t.slice(11, 13)) : null

  return {
    safeTime: safeAfterH
      ? `Before ${fmtH(safeBeforeH)} or after ${fmtH(safeAfterH)}`
      : `Before ${fmtH(safeBeforeH)}`,
    peakTime: safeAfterH
      ? `${fmtH(safeBeforeH)} – ${fmtH(safeAfterH)}`
      : `From ${fmtH(safeBeforeH)}`,
    peakMax,
    peakHour,
  }
}
