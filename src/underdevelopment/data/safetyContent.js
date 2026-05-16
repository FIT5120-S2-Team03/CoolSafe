export const SYMPTOMS = [
  { id: 'sweating', label: 'Heavy sweating', desc: 'Sweat soaking clothes', icon: 'water_drop', severity: 'nurse' },
  { id: 'headache', label: 'Headache / Cramps', desc: 'Throbbing head, muscle aches', icon: 'sentiment_very_dissatisfied', severity: 'nurse' },
  { id: 'dizziness', label: 'Dizziness / Nausea', desc: 'Lightheaded, feeling sick', icon: 'airline_seat_recline_normal', severity: 'nurse' },
  { id: 'dry-skin', label: 'Dry, hot skin', desc: 'No sweating despite the heat', icon: 'device_thermostat', severity: '000' },
  { id: 'confusion', label: 'Confused / Not making sense', desc: 'Disoriented, hard to rouse', icon: 'psychology_alt', severity: '000' },
  { id: 'fainting', label: 'Fainting or unconscious', desc: "Passed out or won't wake up", icon: 'sick', severity: '000' },
]

export const MED_LEVEL = {
  'Heart medication': 'high',
  Antipsychotics: 'high',
  'Blood pressure medication': 'moderate',
  'Diuretics / water tablets': 'moderate',
  Antidepressants: 'moderate',
  'Diabetes medication': 'moderate',
  Antihistamines: 'mild',
  'Pain relievers (NSAIDs)': 'mild',
}

export const LEVEL_META = {
  high: { label: 'Higher', sortOrder: 0, color: '#C94B1A', bg: '#FFF0EE', border: 'rgba(201,75,26,0.28)' },
  moderate: { label: 'Moderate', sortOrder: 1, color: '#B87200', bg: '#FFF8EC', border: 'rgba(184,114,0,0.28)' },
  mild: { label: 'Mild', sortOrder: 2, color: '#2A7D4F', bg: '#EDF5EE', border: 'rgba(42,125,79,0.28)' },
}

export const MED_ADVICE = {
  'Blood pressure medication': 'May affect circulation. Move slowly, rest often, and watch for dizziness.',
  'Diuretics / water tablets': 'Can increase fluid loss. Sip water regularly and avoid long periods outside.',
  Antidepressants: 'Some affect sweating or temperature control. Take heat symptoms seriously.',
  'Diabetes medication': 'Heat can affect blood sugar and medicine storage. Check levels more often.',
  Antihistamines: 'Some can reduce sweating, making overheating easier to miss. Drink water on a schedule.',
  'Heart medication': 'May affect circulation. Keep activity gentle and seek advice if you feel unwell.',
  Antipsychotics: 'Can affect how your body controls temperature. Stay cool and avoid strenuous activity.',
  'Pain relievers (NSAIDs)': 'Take care with dehydration. Drink water and follow the label or doctor advice.',
}

export const RESPONSE = {
  nurse: {
    status: 'HEAT EXHAUSTION',
    headline: 'You may have heat exhaustion.',
    bg: '#FEFAF0',
    border: 'rgba(212,154,58,0.32)',
    iconBg: '#8A5A12',
    icon: 'medical_services',
    accent: '#8A5A12',
    primaryLabel: 'Find a cool space',
    primaryHref: '/spaces',
    primaryIsRoute: true,
    primaryBg: '#8A5A12',
    secondaryCallLabel: 'Call 1300 60 60 24',
    secondaryCallHref: 'tel:1300606024',
    actionTitle: 'Do now',
    avoidTitle: 'Avoid',
    whileYouWait: [
      "Stop what you're doing. Sit or lie down somewhere cool.",
      'Sip water slowly. Avoid alcohol and sugary drinks.',
      'Loosen clothing and use a fan or cool cloth.',
    ],
    avoid: [
      "Don't ignore symptoms that keep getting worse.",
      "Don't return to any physical activity today.",
    ],
  },
  '000': {
    status: 'HEAT STROKE',
    headline: 'These are signs of heat stroke.',
    bg: '#FFF0EE',
    border: '#D88A76',
    iconBg: '#C94B1A',
    icon: 'emergency',
    accent: '#7A2A18',
    primaryLabel: 'Call 000',
    primaryHref: 'tel:000',
    primaryIsRoute: false,
    primaryBg: '#C94B1A',
    secondaryCallLabel: null,
    secondaryCallHref: null,
    actionTitle: 'While you wait',
    avoidTitle: "Don't",
    whileYouWait: [
      'Call 000 immediately.',
      'Get into air-conditioning or shade right now.',
      'Apply cool wet cloths to skin while waiting for help.',
    ],
    avoid: [
      "Don't give food or water if they are confused or unconscious.",
      "Don't leave the person alone.",
    ],
  },
}

export const EARLY = SYMPTOMS.filter((s) => s.severity === 'nurse')
export const URGENT = SYMPTOMS.filter((s) => s.severity === '000')
