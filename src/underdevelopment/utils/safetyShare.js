import { STORAGE_KEYS } from '../constants/storageKeys'

export function buildSafetyShareText({ maxSeverity, selectedMedications, selectedSymptoms, symptoms, gpsCoords, locationName: locationNameProp }) {
  const locationName = locationNameProp || localStorage.getItem(STORAGE_KEYS.locationName) || ''
  const symptomLabels = selectedSymptoms
    .map((id) => symptoms.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => s.label)

  let text = maxSeverity === '000'
    ? '🚨 I need urgent help right now.\n\n'
    : "⚠️ I'm not feeling well from the heat.\n\n"

  if (locationName && gpsCoords) {
    text += `📍 ${locationName}, VIC — https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}\n`
  } else if (locationName) {
    text += `📍 Around ${locationName}, VIC\n`
  } else if (gpsCoords) {
    text += `📍 https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}\n`
  }

  if (symptomLabels.length > 0) {
    text += `Symptoms: ${symptomLabels.join(', ')}\n`
  }
  if (selectedMedications.length > 0) {
    text += `Medications: ${selectedMedications.join(', ')}\n`
  }
  text += maxSeverity === '000'
    ? '\nPlease call 000 or come to me now.'
    : "\nI'm resting somewhere cool. Please check on me."

  return text
}
