import { todayStr } from './forecastUtils'

export const SCORE_COLOR = {
  Low: '#6B7A3A',
  Moderate: '#B87200',
  High: '#C94B1A',
  Extreme: '#8B0000',
}

export const UV_BY_RISK = {
  Low: { index: 2, label: 'Low', color: '#6B7A3A' },
  Moderate: { index: 4, label: 'Moderate', color: '#B87200' },
  High: { index: 7, label: 'High', color: '#C94B1A' },
  Extreme: { index: 10, label: 'Very High', color: '#8B0000' },
}

export function scoreColour(score) {
  if (score >= 75) return '#B85A3C'
  if (score >= 50) return '#D49A3A'
  return '#6B7A3A'
}

export function peakTempBadgeInfo(maxTemp, fallbackColor = '#6E6358') {
  if (maxTemp == null) return { label: '—', color: fallbackColor }
  if (maxTemp >= 32) return { label: 'Very hot', color: '#8B0000' }
  if (maxTemp >= 30) return { label: 'Hot', color: '#C94B1A' }
  if (maxTemp >= 24) return { label: 'Warm', color: '#B87200' }
  return { label: 'Mild', color: '#6B7A3A' }
}

export function aqiBadgeColor(info, fallbackColor = '#6E6358') {
  if (!info) return fallbackColor
  if (info.label === 'Good' || info.label === 'Fair') return '#6B7A3A'
  if (info.label === 'Moderate') return '#B87200'
  if (info.label === 'Poor') return '#C94B1A'
  return '#8B0000'
}

export function scoreVerdict(score) {
  if (score >= 75) return 'Stay indoors'
  if (score >= 55) return 'Take action'
  if (score >= 30) return 'Be careful'
  return 'All clear'
}

export function heatBand(maxTemp) {
  if (maxTemp == null) return 'mild'
  if (maxTemp >= 32) return 'extreme'
  if (maxTemp >= 30) return 'hot'
  if (maxTemp >= 24) return 'warm'
  return 'mild'
}

export function heatCopy(band) {
  const map = {
    mild: {
      slogan: { before: "You're in the", accent: 'clear today.' },
      desc: "Conditions look mild today. Your plan will adjust if medicines add heat sensitivity.",
      cardTitle: 'Most of today should feel comfortable.',
      windowLabel: '',
      cardDesc: (m) => `Conditions stay around ${m != null ? Math.round(m) : '--'}° through the day. Use the hourly chart if you want to pick the most pleasant time for a walk or errands.`,
      baseVerdict: 'All clear',
      routine: { morning: 'Start steady and check the day.', midday: 'Keep the middle of the day comfortable.', evening: 'Wind down and reset your space.' },
    },
    warm: {
      slogan: { before: 'Take it', accent: 'easy today.' },
      desc: "The day is warming up. Your plan will adjust if medicines add heat sensitivity.",
      cardTitle: 'A comfortable morning, warmer later.',
      windowLabel: 'AM good for errands',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. The earlier window may be easier for light errands or time outside.`,
      baseVerdict: 'Mostly safe',
      routine: { morning: 'Use the easier morning window.', midday: 'Pace yourself through the warmer hours.', evening: 'Let the day ease down.' },
    },
    hot: {
      slogan: { before: 'Take it', accent: 'easy today.' },
      desc: "Heat is expected to build today. Medicines can change what extra care you need.",
      cardTitle: 'Use the cooler morning window.',
      windowLabel: 'AM best for outdoors',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. Plan walks, errands, or laundry on the line earlier if you can.`,
      baseVerdict: 'Be careful',
      routine: { morning: 'Use the cooler window. Keep it easy.', midday: 'Stay steady while heat builds.', evening: 'Things ease. So can you.' },
    },
    extreme: {
      slogan: { before: 'Stay', accent: 'indoors today.' },
      desc: "High heat can become risky quickly. Medicines can change what extra care you need.",
      cardTitle: 'Morning is your safest window.',
      windowLabel: 'AM safest for essentials',
      cardDesc: (m) => `By midday it should feel around ${m != null ? Math.round(m) : '--'}°. Keep outdoor tasks early, short, and only if they are necessary.`,
      baseVerdict: 'Stay indoors',
      routine: { morning: 'Use the safest window for essentials.', midday: 'Stay cool and keep plans simple.', evening: 'Recover gently and prepare for tomorrow.' },
    },
  }
  return map[band] ?? map.mild
}

export function bestMorningWindow(hourly) {
  if (!hourly) return null
  const today = todayStr()
  const candidates = []
  for (let startH = 6; startH <= 10; startH++) {
    const slots = hourly.time
      .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
      .filter((s) => s.date === today && s.h >= startH && s.h < startH + 2)
    if (!slots.length) continue
    const avg = slots.reduce((sum, s) => sum + s.temp, 0) / slots.length
    candidates.push({ startH, avg })
  }
  if (!candidates.length) return null
  return candidates.reduce((a, b) => a.avg < b.avg ? a : b)
}

function formatHour(hour) {
  const suffix = hour >= 12 ? 'pm' : 'am'
  const value = hour % 12 || 12
  return `${value}${suffix}`
}

function formatWindow(startH, endH) {
  return `${formatHour(startH)}-${formatHour(endH)}`
}

function contiguousWindows(slots) {
  const windows = []
  let current = null

  for (const slot of slots) {
    if (!current || slot.h !== current.endH) {
      current = { startH: slot.h, endH: slot.h + 1, temps: [slot.temp] }
      windows.push(current)
    } else {
      current.endH = slot.h + 1
      current.temps.push(slot.temp)
    }
  }

  return windows.map((window) => ({
    ...window,
    avg: window.temps.reduce((sum, temp) => sum + temp, 0) / window.temps.length,
    max: Math.max(...window.temps),
  }))
}

export function outingRecommendation(hourly) {
  const now = new Date()
  const currentHour = now.getHours()
  const today = todayStr()
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`

  if (!hourly?.time || !hourly?.apparent_temperature) {
    return {
      windowTime: null,
      windowLabel: '',
      desc: 'Use the chart below to choose a cooler daylight window for errands, walks, or time outside.',
    }
  }

  const allSlots = hourly.time
    .map((t, i) => ({
      h: parseInt(t.slice(11, 13)),
      temp: hourly.apparent_temperature[i],
      date: t.slice(0, 10),
    }))
    .filter((s) => Number.isFinite(s.temp))

  const todayFutureSlots = allSlots
    .filter((s) => s.date === today && s.h >= Math.max(6, currentHour) && s.h < 20)
    .sort((a, b) => a.h - b.h)

  const tomorrowDaySlots = allSlots
    .filter((s) => s.date === tomorrow && s.h >= 6 && s.h < 20)
    .sort((a, b) => a.h - b.h)

  // all-mild shortcut (today only)
  if (todayFutureSlots.length > 0 && todayFutureSlots.every((s) => s.temp <= 24)) {
    const endH = currentHour < 18 ? 18 : 20
    return {
      windowTime: currentHour < 6 ? formatWindow(6, 18) : `Now–${formatHour(endH)}`,
      windowLabel: 'Good for going out',
      intro: 'Feels-like temperatures stay below 24° through the useful part of the day.',
    }
  }

  // look for a comfortable window today, then tomorrow
  function firstWindow(slots, isToday) {
    const comfortable = slots.filter((s) => s.temp <= 26)
    const wins = contiguousWindows(comfortable)
    if (!wins.length) return null
    const w = wins[0]
    if (isToday) {
      const startsNow = currentHour >= w.startH && currentHour < w.endH
      return {
        windowTime: startsNow ? `Now–${formatHour(w.endH)}` : formatWindow(w.startH, w.endH),
        windowLabel: 'Good for going out',
        windowAvgTemp: Math.round(w.avg),
      }
    }
    return {
      windowTime: `Tomorrow ${formatWindow(w.startH, w.endH)}`,
      windowLabel: 'Best window tomorrow',
      windowAvgTemp: Math.round(w.avg),
    }
  }

  const todayWindow = firstWindow(todayFutureSlots, true)
  if (todayWindow) return todayWindow

  const tomorrowWindow = firstWindow(tomorrowDaySlots, false)
  if (tomorrowWindow) return tomorrowWindow

  const dayMax = todayFutureSlots.length > 0
    ? Math.max(...todayFutureSlots.map((s) => s.temp))
    : null
  return {
    windowTime: null,
    windowAvgTemp: null,
    peakTemp: dayMax != null ? Math.round(dayMax) : null,
  }
}

export function getPeriodContent(period, band) {
  const content = {
    morning: {
      mild: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      warm: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      hot: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
      extreme: {
        do: ["Drink a full glass of water before you start anything else.", "Check the hourly chart before planning errands or time outside."],
        avoid: ["Avoid rushing into the day before checking how you feel."],
      },
    },
    midday: {
      mild: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      warm: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      hot: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
      extreme: {
        do: ["Take a short pause and drink water before your next task.", "Keep blinds, windows, or fans set for comfort."],
        avoid: ["Pushing through tiredness or dizziness."],
      },
    },
    evening: {
      mild: {
        do: ["Open windows for fresh airflow.", "Good time for a walk or time in the garden."],
        avoid: ["Don't forget to check tomorrow's forecast before bed."],
      },
      warm: {
        do: ["Open windows once it cools — check outside air first.", "A light walk is fine after 6 PM."],
        avoid: ["Don't overdo it — ease back into activity gently."],
      },
      hot: {
        do: ["Wait until it cools below 30°C before going outside.", "Open windows once the outside air feels cooler."],
        avoid: ["Phone someone to check in if you're not feeling well."],
      },
      extreme: {
        do: ["Open windows once outside air cools below 28°C.", "Phone someone to check in on how you're feeling."],
        avoid: ["Don't assume it's safe just because the sun has set."],
      },
    },
  }

  const eyebrows = {
    morning: 'Morning · 6–11 am',
    midday: 'Midday · 11 am – 4 pm',
    evening: 'Evening · 4–9 pm',
  }

  return {
    eyebrow: eyebrows[period],
    ...(content[period]?.[band] ?? content[period]?.mild),
  }
}

export function periodAvg(hourly, fromH, toH) {
  if (!hourly) return null
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
    .filter((s) => s.date === today && s.h >= fromH && s.h < toH)
  if (!slots.length) return null
  return slots.reduce((sum, s) => sum + s.temp, 0) / slots.length
}

export function periodRange(hourly, fromH, toH, fallback) {
  if (!hourly) return fallback
  const today = todayStr()
  const slots = hourly.time
    .map((t, i) => ({ h: parseInt(t.slice(11, 13)), temp: hourly.apparent_temperature[i], date: t.slice(0, 10) }))
    .filter((s) => s.date === today && s.h >= fromH && s.h < toH && Number.isFinite(s.temp))
  if (!slots.length) return fallback
  const temps = slots.map((s) => Math.round(s.temp))
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return min === max ? `${min}°` : `${min}-${max}°`
}

export function tomorrowOutlook(maxTemp) {
  if (maxTemp == null) return 'Checking forecast...'
  if (maxTemp >= 32) return 'High risk persists.'
  if (maxTemp >= 30) return 'Warm conditions continue.'
  if (maxTemp >= 24) return 'Milder, but keep checking in.'
  return 'Cooler conditions expected.'
}
