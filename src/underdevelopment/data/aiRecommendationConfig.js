export const INTENT_LABELS = {
  cool_down: 'Just need to cool down',
  something_to_do: 'Something to do today',
  free_nearby: 'Free & nearby',
  easy_walk: 'Close enough to walk',
  quiet_sit: 'Quiet place to sit',
}

export const INTENT_INSTRUCTIONS = {
  cool_down:
    'Search specifically for venues with confirmed strong air conditioning — shopping centres, libraries, or indoor pools. Do NOT recommend outdoor parks or gardens.',
  something_to_do:
    'Search specifically for a real event, class, exhibition or community program running TODAY that elderly people aged 65+ can attend — e.g. art exhibition opening, gentle yoga, craft workshop, morning tea. Do NOT recommend venues based on permanent features alone.',
  free_nearby:
    'Search specifically for venues that are completely free to enter with no booking required — libraries, free galleries, public gardens with shade. Exclude any venue with an entry fee.',
  easy_walk:
    'Only recommend venues under 10 minutes walk. Rank strictly by walking_minutes — closest first. Exclude any venue over 10 min walk even if it matches other criteria.',
  quiet_sit:
    'Search specifically for quiet, calm indoor spaces — libraries reading rooms, botanical gardens conservatories, quiet gallery wings. Exclude shopping centres, markets, and any noisy or crowded venues.',
}

export const INDOOR_SUBTYPES = [
  'art gallery/museum',
  'theatre live',
  'cinema',
  'library',
  'indoor recreation facility',
  'gymnasium/health club',
  'function/conference/exhibition centre',
  'aquarium',
  'observation tower/wheel',
  'major sports & recreation facility',
]

export const EVENT_SUBTYPES = [
  'art gallery/museum',
  'theatre live',
  'cinema',
  'indoor recreation facility',
  'function/conference/exhibition centre',
  'aquarium',
  'observation tower/wheel',
  'major sports & recreation facility',
]

export const PAID_SUBTYPES = [
  'theatre live',
  'major sports & recreation facility',
  'gymnasium/health club',
  'aquarium',
  'observation tower/wheel',
]

export const QUIET_SUBTYPES = [
  'library',
  'art gallery/museum',
  'informal outdoor facility (park/garden/reserve)',
]
