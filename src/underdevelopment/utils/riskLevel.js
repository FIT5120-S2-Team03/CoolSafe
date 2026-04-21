/** @param {number} tempCelsius Air temperature at 2 m (°C), same basis as BOM-style forecasts */
export function getRiskLevel(tempCelsius) {
  if (tempCelsius < 28) return { level: 'Low', label: 'Low Risk Alert', bannerBg: '#166534', dot: '#22c55e', warningLevel: 1 }
  if (tempCelsius < 35) return { level: 'Moderate', label: 'Moderate Risk Alert', bannerBg: '#92400e', dot: '#f59e0b', warningLevel: 2 }
  if (tempCelsius <= 40) return { level: 'High', label: 'High Risk Alert', bannerBg: '#9a3412', dot: '#ea580c', warningLevel: 3 }
  return { level: 'Extreme', label: 'Extreme Risk Alert', bannerBg: '#940013', dot: '#dc2626', warningLevel: 4 }
}

export function getAqiInfo(value) {
  if (value <= 20) return { label: 'Good', color: '#22c55e' }
  if (value <= 40) return { label: 'Fair', color: '#65a30d' }
  if (value <= 60) return { label: 'Moderate', color: '#f59e0b' }
  if (value <= 80) return { label: 'Poor', color: '#ea580c' }
  if (value <= 100) return { label: 'Very Poor', color: '#dc2626' }
  return { label: 'Extremely Poor', color: '#7c3aed' }
}
