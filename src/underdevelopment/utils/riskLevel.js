// riskLevel — maps temperature and air-quality numbers into the four-tier
// label/colour scheme used by the heat banner and AQI badges across the app.

// Map a current air temperature into a heat-risk tier (Low / Moderate / High /
// Extreme) plus the colours the banner uses.
/** @param {number} tempCelsius Air temperature at 2 m (°C), same basis as BOM-style forecasts */
export function getRiskLevel(tempCelsius) {
  if (tempCelsius < 28) return { level: 'Low', label: 'Low Risk', bannerBg: '#166534', dot: '#22c55e', warningLevel: 1 }
  if (tempCelsius < 35) return { level: 'Moderate', label: 'Moderate Risk', bannerBg: '#92400e', dot: '#f59e0b', warningLevel: 2 }
  if (tempCelsius <= 40) return { level: 'High', label: 'High Risk', bannerBg: '#9a3412', dot: '#ea580c', warningLevel: 3 }
  return { level: 'Extreme', label: 'Extreme Risk', bannerBg: '#940013', dot: '#dc2626', warningLevel: 4 }
}

// Map a European AQI value into a user-friendly label + colour.
export function getAqiInfo(value) {
  if (value <= 20) return { label: 'Good', color: '#22c55e' }
  if (value <= 40) return { label: 'Fair', color: '#65a30d' }
  if (value <= 60) return { label: 'Moderate', color: '#f59e0b' }
  if (value <= 80) return { label: 'Poor', color: '#ea580c' }
  if (value <= 100) return { label: 'Very Poor', color: '#dc2626' }
  return { label: 'Extremely Poor', color: '#7c3aed' }
}
