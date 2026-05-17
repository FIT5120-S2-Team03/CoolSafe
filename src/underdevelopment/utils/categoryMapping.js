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

export const CATEGORY_MARKER_COLORS = {
  'Arts & Culture':    '#D85A3A',
  'Recreation':        '#2FA86E',
  'Learning':          '#7C6FE8',
  'Community Support': '#D65A96',
  'Visitor Info':      '#E09A2F',
  'Fountain':          '#36AEDD',
}

export const CATEGORY_UI_COLORS = {
  'Arts & Culture':    '#A85F4D',
  'Recreation':        '#5F8E75',
  'Learning':          '#756B9A',
  'Community Support': '#A86B89',
  'Visitor Info':      '#A98A4F',
  'Fountain':          '#5F97B0',
}

export const CATEGORY_UI_BACKGROUNDS = {
  'Arts & Culture':    '#F7E6E0',
  'Recreation':        '#E5F2EA',
  'Learning':          '#EEEAFB',
  'Community Support': '#F7E5EF',
  'Visitor Info':      '#F8EEDB',
  'Fountain':          '#E5F4FA',
}
