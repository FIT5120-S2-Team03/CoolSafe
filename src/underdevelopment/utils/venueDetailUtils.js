// venueDetailUtils — small formatters used by the venue detail page:
// opening-hours display, turn-by-turn directions, and distance rounding.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Convert a 24-hour "HH:MM" string to a 12-hour "h:MM AM/PM" label.
export function fmt(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// Split a venue's opening hours into "today" and the next 6 upcoming days,
// in display order, for the opening-hours expandable on the detail page.
export function getHoursDisplay(openingHours) {
  if (!openingHours || Object.keys(openingHours).length === 0) return null
  const todayName = new Date().toLocaleDateString('en-AU', { weekday: 'long' })
  const todayIdx = DAYS.indexOf(todayName)
  const todayHours = openingHours[todayName] ?? null

  const upcoming = []
  for (let i = 1; upcoming.length < 6 && i <= 7; i++) {
    const dayName = DAYS[(todayIdx + i) % 7]
    const h = openingHours[dayName]
    upcoming.push({ day: dayName, hours: h ?? null })
  }

  return { todayName, todayHours, upcoming }
}

// Pick a Tabler icon name that visually matches an OSRM maneuver step.
export function maneuverIcon(maneuver) {
  const { type, modifier } = maneuver ?? {}
  if (type === 'arrive') return 'ti-map-pin'
  if (type === 'depart') return 'ti-walk'
  if (type === 'roundabout' || type === 'rotary') return 'ti-rotate-clockwise'
  if (modifier === 'uturn') return 'ti-arrow-back-up'
  if (modifier === 'right' || modifier === 'sharp right') return 'ti-corner-up-right'
  if (modifier === 'left' || modifier === 'sharp left') return 'ti-corner-up-left'
  if (modifier === 'slight right') return 'ti-arrow-up-right'
  if (modifier === 'slight left') return 'ti-arrow-up-left'
  return 'ti-arrow-up'
}

// Build the English instruction line shown alongside the maneuver icon
// (e.g. "Turn right on Collins Street").
export function maneuverLabel(step) {
  const { type, modifier } = step.maneuver ?? {}
  const street = step.name ? ` on ${step.name}` : ''
  if (type === 'depart') return `Start${street}`
  if (type === 'arrive') return 'Arrive at destination'
  if (type === 'roundabout' || type === 'rotary') return `Enter roundabout${street}`
  if (!modifier || modifier === 'straight') return `Continue${street}`
  if (modifier === 'uturn') return `Make a U-turn${street}`
  if (modifier === 'slight right') return `Bear right${street}`
  if (modifier === 'slight left') return `Bear left${street}`
  if (modifier === 'sharp right') return `Turn sharp right${street}`
  if (modifier === 'sharp left') return `Turn sharp left${street}`
  if (modifier === 'right') return `Turn right${street}`
  if (modifier === 'left') return `Turn left${street}`
  return `Continue${street}`
}

// Round a distance in metres to a human-friendly label (or null if <50 m).
export function fmtDist(m) {
  if (m < 50) return null
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(1)} km`
}
