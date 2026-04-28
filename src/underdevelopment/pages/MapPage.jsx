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

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar />
      {/* View toggle bar */}
      <div className="bg-white border-b border-[rgba(195,198,214,0.3)] px-10 flex justify-end shrink-0">
        <div className="h-[76px] flex items-center">
          <div className="flex items-center gap-[3.99px] p-1 rounded-lg bg-[#e8e8ea]">
            <div className="bg-[#003fa4] flex gap-2 items-center px-6 py-2 rounded">
              <span className="font-['Lexend'] font-bold text-[14px] text-white">Map View</span>
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <MapSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showHVI={showHVI}
          onHVIToggle={() => setShowHVI((v) => !v)}
        />
        <div className="flex-1 relative overflow-hidden">
          <CoolSpacesMap selectedCategory={selectedCategory} flyTo={flyTo} showHVI={showHVI} />
        </div>
      </div>
    </div>
  )
}
