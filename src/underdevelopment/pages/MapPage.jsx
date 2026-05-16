import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import MapSidebar from '../components/map/MapSidebar'
import CoolSpacesMap from '../components/map/CoolSpacesMap'

export default function MapPage() {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showHVI, setShowHVI] = useState(false)
  const { state } = useLocation()
  const flyTo = state?.flyTo ?? null
  const openVenueId = state?.openVenueId ?? null

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      {/* Spacer for fixed navbar */}
      <div className="shrink-0 h-[76px]" />
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <MapSidebar
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          showHVI={showHVI}
          onHVIToggle={() => setShowHVI((v) => !v)}
        />
        <div className="flex-1 relative overflow-hidden">
          <CoolSpacesMap selectedCategories={selectedCategories} flyTo={flyTo} showHVI={showHVI} openVenueId={openVenueId} />
        </div>
      </div>
    </div>
  )
}
