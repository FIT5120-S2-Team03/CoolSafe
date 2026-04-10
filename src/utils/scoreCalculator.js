/**
 * Pure heat safety score calculator — no React dependencies, easy to unit test.
 * @module scoreCalculator
 */

const HIGH_RISK_MEDS = [
  'Blood pressure medication',
  'Diuretics / water tablets',
  'Heart medication',
  'Diabetes medication',
  'Antipsychotics',
]

const LOW_RISK_MEDS = ['Antihistamines', 'Antidepressants']

export const MED_ADVICE = {
  'Blood pressure medication':
    'Blood pressure medication can lower your blood pressure further in heat. Stay cool, sit down if dizzy, and drink water regularly.',
  'Diuretics / water tablets':
    'Diuretics increase fluid loss. Drink at least 2L of water today and avoid going out during peak heat (11AM–3PM).',
  'Heart medication':
    'Heart medication affects how your body responds to heat stress. Avoid any physical exertion outdoors today.',
  'Diabetes medication':
    'Diabetes medication can interact with heat and dehydration. Test your levels more often and drink water even if not thirsty.',
  Antipsychotics:
    'Antipsychotic medications reduce your ability to regulate body temperature. Stay indoors with cooling and check in with someone regularly.',
  Antihistamines:
    'Some antihistamines reduce sweating. Wear light clothing and stay hydrated.',
  Antidepressants:
    'Some antidepressants affect how your body handles heat. Take extra care to stay cool and drink water.',
}

function formatHour(hour) {
  if (hour === 0) return '12AM'
  if (hour < 12) return `${hour}AM`
  if (hour === 12) return '12PM'
  return `${hour - 12}PM`
}

/**
 * @param {{ apparentTemp: number, hour: number, medications: string[] }} params
 * @returns {{ score: number, riskLabel: { label: string, color: string }, factors: object[], adviceLines: string[] }}
 */
export function calculateHeatSafetyScore({ apparentTemp, hour, medications }) {
  // Step 1: Base score
  let baseScore
  if (apparentTemp < 28) baseScore = 15
  else if (apparentTemp <= 34) baseScore = 40
  else if (apparentTemp <= 40) baseScore = 65
  else baseScore = 85

  // Step 2: Time multiplier
  let timeMultiplier
  if (hour < 6 || hour >= 18) timeMultiplier = 0.85
  else if (hour < 10) timeMultiplier = 1.0
  else if (hour < 12 || hour >= 16) timeMultiplier = 1.15
  else timeMultiplier = 1.35

  // Step 3: Medication multiplier
  const activeMeds = medications.filter((m) => m !== 'None of the above')
  let medicationMultiplier = 1.0
  if (activeMeds.some((m) => HIGH_RISK_MEDS.includes(m))) medicationMultiplier = 1.3
  else if (activeMeds.some((m) => LOW_RISK_MEDS.includes(m))) medicationMultiplier = 1.15

  // Step 4: Final score
  const score = Math.min(100, Math.round(baseScore * timeMultiplier * medicationMultiplier))

  // Step 5: Risk label
  let riskLabel
  if (score < 30) riskLabel = { label: 'Low Risk', color: '#22c55e' }
  else if (score < 55) riskLabel = { label: 'Moderate Risk', color: '#f59e0b' }
  else if (score < 75) riskLabel = { label: 'High Risk', color: '#ea580c' }
  else riskLabel = { label: 'Extreme Risk', color: '#dc2626' }

  // Step 6: Factors
  const factors = [{ text: `${apparentTemp}°C Apparent Temp`, icon: '🌡' }]
  if (hour >= 12 && hour < 16)
    factors.push({ text: `Peak Hours (${formatHour(hour)})`, icon: '🕐' })
  else if (hour >= 10 && hour < 12)
    factors.push({ text: `Morning Peak (${formatHour(hour)})`, icon: '🕐' })

  if (activeMeds.length > 0) {
    factors.push({
      text: `${activeMeds.length} Heat-sensitive Med${activeMeds.length > 1 ? 's' : ''}`,
      icon: '💊',
      isHighlighted: true,
    })
  } else {
    factors.push({ text: 'No medications added', icon: '💊', isHighlighted: false })
  }

  // Step 7: Advice lines
  const adviceLines = []

  if (baseScore <= 15)
    adviceLines.push("Conditions are safe today. Stay hydrated and enjoy your day.")
  else if (baseScore <= 40)
    adviceLines.push("It is warm today. Drink water every 20 minutes even if you don't feel thirsty.")
  else if (baseScore <= 65)
    adviceLines.push(
      "Heat is dangerous today. Your area is at elevated risk — limit time outdoors."
    )
  else
    adviceLines.push(
      "Today's heat is dangerous. Staying indoors with cooling is strongly recommended."
    )

  if (timeMultiplier === 1.15)
    adviceLines.push(
      "You are in a shoulder period — heat is building or cooling slowly. Plan trips for before 10AM or after 6PM."
    )
  else if (timeMultiplier === 1.35)
    adviceLines.push(
      "This is peak heat time (12PM–4PM). The risk is significantly higher now. Avoid going outside."
    )

  if (medicationMultiplier > 1.0) {
    for (const med of activeMeds) {
      if (MED_ADVICE[med]) adviceLines.push(MED_ADVICE[med])
    }
  }

  return { score, riskLabel, factors, adviceLines }
}
