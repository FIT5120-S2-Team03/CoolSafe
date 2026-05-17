import L from 'leaflet'
import { BLUE, MUTED } from '../styles/colors'

// User's current location — neutral dark pin
export const userPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#5A5048"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#5A5048"/>
  </svg>`,
})

// Venue destination — blue pin
export const venuePinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="${BLUE}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="${BLUE}"/>
  </svg>`,
})

// User location on the spaces map — brighter blue pin
export const locationPinIcon = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.9 14 22 14 22S28 23.9 28 14C28 6.268 21.732 0 14 0z" fill="#003fa4"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3.5" fill="#003fa4"/>
  </svg>`,
})

export function makeLabelIcon(label, tone = 'blue') {
  const isBlue = tone === 'blue'
  return L.divIcon({
    className: '',
    iconSize: [92, 28],
    iconAnchor: [46, -4],
    html: `<div style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:72px;
      height:28px;
      padding:0 10px;
      border-radius:999px;
      background:rgba(255,255,255,0.95);
      border:1px solid ${isBlue ? 'rgba(24,82,180,0.22)' : 'rgba(90,80,72,0.22)'};
      box-shadow:0 6px 18px rgba(0,0,0,0.10);
      color:${isBlue ? BLUE : MUTED};
      font-family:var(--font-body);
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
    ">${label}</div>`,
  })
}

export const startLabelIcon = makeLabelIcon('Start', 'neutral')
export const destinationLabelIcon = makeLabelIcon('Destination', 'blue')
