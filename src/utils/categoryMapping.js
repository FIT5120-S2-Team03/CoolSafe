const SUB_THEME_MAP = {
  'Art Gallery/Museum':                              'Arts & Culture',
  'Theatre Live':                                    'Arts & Culture',
  'Cinema':                                          'Arts & Culture',
  'Informal Outdoor Facility (Park/Garden/Reserve)': 'Recreation',
  'Indoor Recreation Facility':                      'Recreation',
  'Major Sports & Recreation Facility':              'Recreation',
  'Gymnasium/Health Club':                           'Recreation',
  'Aquarium':                                        'Recreation',
  'Observation Tower/Wheel':                         'Recreation',
  'Outdoor Recreation Facility (Zoo, Golf Course)':  'Recreation',
  'Library':                                         'Learning',
  'Tertiary (University)':                           'Learning',
  'Further Education':                               'Learning',
  'Public Buildings':                                'Community Support',
  'Public Hospital':                                 'Community Support',
  'Visitor Centre':                                  'Visitor Info',
  'Function/Conference/Exhibition Centre':           'Visitor Info',
}

export function getCategoryFromSubTheme(sub_theme) {
  return SUB_THEME_MAP[sub_theme] ?? null
}

export const CATEGORY_COLORS = {
  'Arts & Culture':    '#8b5cf6',
  'Recreation':        '#10b981',
  'Learning':          '#1d4ed8',
  'Community Support': '#ec4899',
  'Visitor Info':      '#f59e0b',
  'Fountain':          '#0ea5e9',
}
