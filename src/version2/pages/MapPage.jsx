import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import MapSidebar from '../components/map/MapSidebar'
import CoolSpacesMap from '../components/map/CoolSpacesMap'

export default function MapPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showHVI, setShowHVI] = useState(false)
  const { state } = useLocation()
  const flyTo = state?.flyTo ?? null
  const openVenueId = state?.openVenueId ?? null

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar />
      {/* Spacer for fixed navbar */}
      <div className="shrink-0 h-[76px]" />
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <MapSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showHVI={showHVI}
          onHVIToggle={() => setShowHVI((v) => !v)}
        />
        <div className="flex-1 relative overflow-hidden">
          <CoolSpacesMap selectedCategory={selectedCategory} flyTo={flyTo} showHVI={showHVI} openVenueId={openVenueId} />
        </div>
      </div>
    </div>
  )
}
