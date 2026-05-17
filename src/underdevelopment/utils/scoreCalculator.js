/**
 * Pure heat safety score calculator — no React dependencies, easy to unit test.
 * @module scoreCalculator
 *
 * Score = current conditions (0–40) + today's peak (0–35) + medication (0–25) = max 100
 */

// Aligned with MED_LEVEL in safetyContent.js
const MED_RISK = {
  'Heart medication':           'high',
  'Antipsychotics':             'high',
  'Blood pressure medication':  'moderate',
  'Diuretics / water tablets':  'moderate',
  'Antidepressants':            'moderate',
  'Diabetes medication':        'moderate',
  'Antihistamines':             'mild',
  'Pain relievers (NSAIDs)':    'mild',
}

const MED_PTS = { high: 25, moderate: 15, mild: 8 }
const MED_ORDER = { high: 0, moderate: 1, mild: 2 }

/**
 * @param {{ currentTemp: number, todayMax: number, medications: string[] }} params
 * @returns {{ score: number, riskLabel: { label: string, color: string }, factors: object[], breakdown: object }}
 */
export function calculateHeatSafetyScore({ currentTemp, todayMax, medications }) {
  // Current conditions (0–40 pts)
  let currentPts
  if (currentTemp < 24)      currentPts = 0
  else if (currentTemp < 28) currentPts = 10
  else if (currentTemp < 32) currentPts = 20
  else if (currentTemp < 38) currentPts = 30
  else                       currentPts = 40

  // Today's peak (0–35 pts)
  let peakPts
  if (todayMax < 28)      peakPts = 0
  else if (todayMax < 32) peakPts = 15
  else if (todayMax < 38) peakPts = 25
  else                    peakPts = 35

  // Medication — highest tier among selected meds wins (0–25 pts)
  const highestTier = medications.reduce((best, med) => {
    const tier = MED_RISK[med]
    if (!tier) return best
    if (best === null || MED_ORDER[tier] < MED_ORDER[best]) return tier
    return best
  }, null)
  const medPts = highestTier ? MED_PTS[highestTier] : 0

  const score = currentPts + peakPts + medPts

  // Risk label
  let riskLabel
  if (score < 30)      riskLabel = { label: 'Low Risk',      color: '#22c55e' }
  else if (score < 55) riskLabel = { label: 'Moderate Risk', color: '#f59e0b' }
  else if (score < 75) riskLabel = { label: 'High Risk',     color: '#ea580c' }
  else                 riskLabel = { label: 'Extreme Risk',   color: '#dc2626' }

  const breakdown = { currentPts, peakPts, medPts }

  const factors = [
    { text: `${Math.round(currentTemp)}°C feels like now`, icon: '🌡' },
    { text: `${Math.round(todayMax)}°C today's peak`, icon: '📈' },
  ]
  if (medications.length > 0) {
    factors.push({
      text: `${medications.length} heat-sensitive med${medications.length > 1 ? 's' : ''}`,
      icon: '💊',
      isHighlighted: true,
    })
  } else {
    factors.push({ text: 'No medications added', icon: '💊', isHighlighted: false })
  }

  return { score, riskLabel, factors, breakdown }
}
