import { useEffect, useState } from 'react'
import { useUserLocation } from '../../hooks/useUserLocation'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import LocationModal from './LocationModal'
import { OPEN_LOCATION_MODAL_EVENT } from './locationModalEvents'

export default function GlobalLocationModal() {
  const { locationName, requestGps, fetchByPostcode } = useUserLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onOpenLocationModal() {
      setOpen(true)
    }
    window.addEventListener(OPEN_LOCATION_MODAL_EVENT, onOpenLocationModal)
    return () => window.removeEventListener(OPEN_LOCATION_MODAL_EVENT, onOpenLocationModal)
  }, [])

  return (
    <LocationModal
      open={open}
      onClose={() => setOpen(false)}
      requestGps={requestGps}
      fetchByPostcode={fetchByPostcode}
      canDismiss={Boolean(locationName || localStorage.getItem(STORAGE_KEYS.coords))}
    />
  )
}
