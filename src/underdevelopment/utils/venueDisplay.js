import {
  CATEGORY_MARKER_COLORS,
  CATEGORY_UI_BACKGROUNDS,
  CATEGORY_UI_COLORS,
  getCategoryFromSubTheme,
} from './categoryMapping'

export const VENUE_KIND_COLOR = {
  ...CATEGORY_UI_COLORS,
  default: '#6E6358',
}

export const VENUE_KIND_PILL = {
  'Arts & Culture': { background: CATEGORY_UI_BACKGROUNDS['Arts & Culture'], color: CATEGORY_UI_COLORS['Arts & Culture'] },
  Recreation: { background: CATEGORY_UI_BACKGROUNDS.Recreation, color: CATEGORY_UI_COLORS.Recreation },
  Learning: { background: CATEGORY_UI_BACKGROUNDS.Learning, color: CATEGORY_UI_COLORS.Learning },
  'Community Support': { background: CATEGORY_UI_BACKGROUNDS['Community Support'], color: CATEGORY_UI_COLORS['Community Support'] },
  'Visitor Info': { background: CATEGORY_UI_BACKGROUNDS['Visitor Info'], color: CATEGORY_UI_COLORS['Visitor Info'] },
  Fountain: { background: CATEGORY_UI_BACKGROUNDS.Fountain, color: CATEGORY_UI_COLORS.Fountain },
  default: { background: '#F0EDE8', color: '#5A5048' },
}

export function venueTypeSource(venueOrType = '') {
  if (typeof venueOrType === 'string') return venueOrType
  return [
    venueOrType.name,
    venueOrType.type,
    venueOrType.category,
    venueOrType.sub_theme,
    venueOrType.subTheme,
    venueOrType.theme,
  ].filter(Boolean).join(' ')
}

export function isFountainVenue(venue) {
  return venueTypeSource(venue).toLowerCase().includes('fountain')
}

export function venueTypeKind(venueOrType = '') {
  const t = venueTypeSource(venueOrType).toLowerCase()
  if (typeof venueOrType === 'object' && venueOrType !== null) {
    if (venueOrType.category && CATEGORY_MARKER_COLORS[venueOrType.category]) return venueOrType.category
    const mapped = getCategoryFromSubTheme(venueOrType.sub_theme ?? venueOrType.subTheme ?? venueOrType.type)
    if (mapped) return mapped
  }
  if (t.includes('gallery') || t.includes('museum') || t.includes('arts & culture') || t.includes('theatre') || t.includes('cinema')) return 'Arts & Culture'
  if (t.includes('park') || t.includes('garden') || t.includes('reserve') || t.includes('informal outdoor') || t.includes('recreation') || t.includes('aquarium')) return 'Recreation'
  if (t.includes('library') || t.includes('learning') || t.includes('education')) return 'Learning'
  if (t.includes('visitor info') || t.includes('visitor centre') || t.includes('conference') || t.includes('exhibition')) return 'Visitor Info'
  if (t.includes('community') || t.includes('support') || t.includes('public building') || t.includes('hospital')) return 'Community Support'
  return 'default'
}

export function venueTypeLabel(venueOrType = '') {
  const source = venueTypeSource(venueOrType)
  const kind = venueTypeKind(venueOrType)
  if (typeof venueOrType === 'object' && venueOrType !== null) {
    const subTheme = venueOrType.sub_theme ?? venueOrType.subTheme ?? venueOrType.type
    if (subTheme) return subTheme
  }
  return kind === 'default' ? (source || 'Public space') : kind
}

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
