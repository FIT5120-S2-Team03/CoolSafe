export const OPEN_LOCATION_MODAL_EVENT = 'coolsafe:open-location-modal'

export function openGlobalLocationModal() {
  window.dispatchEvent(new CustomEvent(OPEN_LOCATION_MODAL_EVENT))
}
