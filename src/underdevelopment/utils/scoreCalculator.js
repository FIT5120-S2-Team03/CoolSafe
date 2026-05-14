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
  'Pain relievers (NSAIDs)',
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
  'Pain relievers (NSAIDs)':
    'Regular NSAIDs, such as ibuprofen or naproxen, can be harder on the kidneys when fluids are low. Keep hydrated and ask a doctor or pharmacist if you use them often.',
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
  const activeMeds = medications
  let medicationMultiplier = 1.0
  if (activeMeds.some((m) => HIGH_RISK_MEDS.includes(m))) medicationMultiplier = 1.3
  else if (activeMeds.some((m) => LOW_RISK_MEDS.includes(m))) medicationMultiplier = 1.15

  // Step 4: Final score + additive breakdown (weatherPts + timePts + medPts = score)
  const afterTime = Math.min(100, Math.round(baseScore * timeMultiplier))
  const score = Math.min(100, Math.round(baseScore * timeMultiplier * medicationMultiplier))
  const breakdown = {
    weatherPts: baseScore,
    timePts: afterTime - baseScore,
    medPts: score - afterTime,
  }

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
    adviceLines.push(
      "Conditions are comfortable today — no significant heat risk detected. Keep a water bottle with you, wear sunscreen if heading outside, and enjoy your day. It's still worth checking back later if the temperature rises."
    )
  else if (baseScore <= 40)
    adviceLines.push(
      "It's warm today and your body will lose fluids faster than usual, even if you don't feel thirsty. Drink water every 20–30 minutes, wear light and loose clothing, and try to stay in the shade when outdoors. Older adults and young children should take extra care."
    )
  else if (baseScore <= 65)
    adviceLines.push(
      "Heat levels today are elevated and prolonged exposure can be harmful. Limit time spent outdoors and take regular breaks in cool or shaded areas. If you feel dizzy, unusually tired, or stop sweating, move indoors immediately and drink cool water."
    )
  else
    adviceLines.push(
      "Today's heat is at a dangerous level. Your body may struggle to cool itself even at rest, especially without air conditioning. Stay indoors with cooling as much as possible, close blinds to block direct sunlight, and avoid any physical exertion. If you do not have access to a cool space, consider visiting a nearby shopping centre, library, or community cooling centre."
    )

  if (baseScore > 40) {
    if (timeMultiplier === 1.15)
      adviceLines.push(
        "You are in a shoulder period — temperatures are either still climbing or haven't fully cooled yet. If you need to go out, earlier mornings (before 10AM) or evenings (after 6PM) are significantly safer windows."
      )
    else if (timeMultiplier === 1.35)
      adviceLines.push(
        "This is peak heat time (12PM–4PM), when the sun's intensity and ground heat combine to push apparent temperatures to their highest. Heat-related illness risk is at its greatest right now — avoid going outside unless absolutely necessary."
      )
  }

  if (medicationMultiplier > 1.0) {
    for (const med of activeMeds) {
      if (MED_ADVICE[med]) adviceLines.push(MED_ADVICE[med])
    }
  }

  return { score, riskLabel, factors, adviceLines, breakdown }
}
