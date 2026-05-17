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

function formatHour(hour) {
  if (hour === 0) return '12AM'
  if (hour < 12) return `${hour}AM`
  if (hour === 12) return '12PM'
  return `${hour - 12}PM`
}

/**
 * @param {{ apparentTemp: number, hour: number, medications: string[] }} params
 * @returns {{ score: number, riskLabel: { label: string, color: string }, factors: object[], breakdown: object }}
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

  return { score, riskLabel, factors, breakdown }
}
