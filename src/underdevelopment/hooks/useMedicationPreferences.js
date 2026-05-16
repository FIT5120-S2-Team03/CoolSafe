import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'

export function useMedicationPreferences() {
  const [selectedMedications, setSelectedMedications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.medications) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(selectedMedications))
  }, [selectedMedications])

  return [selectedMedications, setSelectedMedications]
}
