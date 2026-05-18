// categoryMapping — single source of truth that collapses raw "sub_theme"
// strings from the venue dataset into the 5 user-facing categories, and
// defines the marker / UI / background colours each category uses.

// Maps the raw sub_theme values from the dataset to one of our 5 categories.
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

// Bright, saturated colours used on map markers so categories stand out.
export const CATEGORY_MARKER_COLORS = {
  'Arts & Culture':    '#D85A3A',
  'Recreation':        '#2FA86E',
  'Learning':          '#7C6FE8',
  'Community Support': '#D65A96',
  'Visitor Info':      '#E09A2F',
  'Fountain':          '#36AEDD',
}

// Muted variants for text and pill outlines in the UI.
export const CATEGORY_UI_COLORS = {
  'Arts & Culture':    '#A85F4D',
  'Recreation':        '#5F8E75',
  'Learning':          '#756B9A',
  'Community Support': '#A86B89',
  'Visitor Info':      '#A98A4F',
  'Fountain':          '#5F97B0',
}

// Pastel backgrounds for category chip / pill backgrounds.
export const CATEGORY_UI_BACKGROUNDS = {
  'Arts & Culture':    '#F7E6E0',
  'Recreation':        '#E5F2EA',
  'Learning':          '#EEEAFB',
  'Community Support': '#F7E5EF',
  'Visitor Info':      '#F8EEDB',
  'Fountain':          '#E5F4FA',
}
