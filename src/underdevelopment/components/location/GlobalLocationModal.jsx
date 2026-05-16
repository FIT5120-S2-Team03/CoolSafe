import { useEffect, useState } from 'react'
import { useUserLocation } from '../../hooks/useUserLocation'
import LocationModal from './LocationModal'

export const OPEN_LOCATION_MODAL_EVENT = 'coolsafe:open-location-modal'

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
      canDismiss={Boolean(locationName || localStorage.getItem('coolsafe_coords'))}
    />
  )
}

export function openGlobalLocationModal() {
  window.dispatchEvent(new CustomEvent(OPEN_LOCATION_MODAL_EVENT))
}
