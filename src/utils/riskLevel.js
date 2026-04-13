
// Unsplash images chosen to match each heat risk level
const BANNER_IMAGES = {
  // Shady green park path — cool and pleasant
  Low: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80',
  // Bright hazy summer afternoon
  Moderate: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=1600&q=80',
  // Scorching sun over cracked dry earth
  High: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
  // Blazing sun in a fierce orange sky
  Extreme: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
}
 
// Colour tint layered over the image so text stays readable and risk colour is preserved
const BANNER_OVERLAY = {
  Low:      'rgba(22,101,52,0.55)',
  Moderate: 'rgba(146,64,14,0.60)',
  High:     'rgba(154,52,18,0.65)',
  Extreme:  'rgba(148,0,19,0.70)',
}
 
/** @param {number} tempCelsius Air temperature at 2 m (°C), same basis as BOM-style forecasts */
export function getRiskLevel(tempCelsius) {
  if (tempCelsius < 28) return { level: 'Low', label: 'Low Risk Alert', bannerBg: '#166534', dot: '#22c55e', warningLevel: 1 }
  if (tempCelsius < 35) return { level: 'Moderate', label: 'Moderate Risk Alert', bannerBg: '#92400e', dot: '#f59e0b', warningLevel: 2 }
  if (tempCelsius <= 40) return { level: 'High', label: 'High Risk Alert', bannerBg: '#9a3412', dot: '#ea580c', warningLevel: 3 }
  return { level: 'Extreme', label: 'Extreme Risk Alert', bannerBg: '#940013', dot: '#dc2626', warningLevel: 4 }
  if (tempCelsius < 28) return { level: 'Low', label: 'Low Risk Alert', bannerBg: '#166534', bannerImg: BANNER_IMAGES.Low, bannerOverlay: BANNER_OVERLAY.Low, dot: '#22c55e', warningLevel: 1 }
  if (tempCelsius < 35) return { level: 'Moderate', label: 'Moderate Risk Alert', bannerBg: '#92400e', bannerImg: BANNER_IMAGES.Moderate, bannerOverlay: BANNER_OVERLAY.Moderate, dot: '#f59e0b', warningLevel: 2 }
  if (tempCelsius <= 40) return { level: 'High', label: 'High Risk Alert', bannerBg: '#9a3412', bannerImg: BANNER_IMAGES.High, bannerOverlay: BANNER_OVERLAY.High, dot: '#ea580c', warningLevel: 3 }
  return { level: 'Extreme', label: 'Extreme Risk Alert', bannerBg: '#940013', bannerImg: BANNER_IMAGES.Extreme, bannerOverlay: BANNER_OVERLAY.Extreme, dot: '#dc2626', warningLevel: 4 }
}


export function getAqiInfo(value) {
  if (value <= 20) return { label: 'Good', color: '#22c55e' }
  if (value <= 40) return { label: 'Fair', color: '#65a30d' }
  if (value <= 60) return { label: 'Moderate', color: '#f59e0b' }
  if (value <= 80) return { label: 'Poor', color: '#ea580c' }
  if (value <= 100) return { label: 'Very Poor', color: '#dc2626' }
  return { label: 'Extremely Poor', color: '#7c3aed' }
}
