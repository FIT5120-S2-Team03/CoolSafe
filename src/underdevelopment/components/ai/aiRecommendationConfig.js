export const INTENT_LABELS = {
  cool_down: 'Just need to cool down',
  something_to_do: 'Something to do today',
  free_nearby: 'Free & nearby',
  easy_walk: 'Close enough to walk',
  quiet_sit: 'Quiet place to sit',
}

export const INTENT_INSTRUCTIONS = {
  cool_down:
    'Prioritise indoor venues likely to offer strong cooling — libraries, galleries, shopping centres, or indoor recreation spaces. Do NOT recommend outdoor parks or gardens.',
  something_to_do:
    'Recommend venues that are suitable for a gentle outing today, such as galleries, libraries, cinemas, or indoor recreation spaces with a clear activity or feature.',
  free_nearby:
    'Prioritise venues that are likely to be free to enter, such as libraries, free galleries, or public gardens with shade. Exclude venue types that are usually paid.',
  easy_walk:
    'Only recommend venues under 10 minutes walk. Rank strictly by walking_minutes — closest first. Exclude any venue over 10 min walk even if it matches other criteria.',
  quiet_sit:
    'Prioritise quiet, calm spaces such as libraries, reading rooms, conservatories, or quiet gallery areas. Exclude shopping centres, markets, and noisy venues.',
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
