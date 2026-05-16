import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import MapSidebar from '../components/map/MapSidebar'
import CoolSpacesMap from '../components/map/CoolSpacesMap'

export default function SpacesPage() {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showHVI, setShowHVI] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { state } = useLocation()
  const flyTo = state?.flyTo ?? null
  const openVenueId = state?.openVenueId ?? null

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      {/* Spacer for fixed navbar */}
      <div className="shrink-0" style={{ height: 'var(--nav-clearance)' }} />
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

      <button
        type="button"
        className="cs-mobile-filter-trigger"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Open space filters"
      >
        <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
        Filters
        {(selectedCategories.length > 0 || showHVI) && (
          <span aria-hidden="true">{selectedCategories.length + (showHVI ? 1 : 0)}</span>
        )}
      </button>

      {showMobileFilters && (
        <div className="cs-mobile-filter-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="cs-mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="cs-mobile-filter-header">
              <div>
                <p>Spaces filters</p>
                <span>Choose what appears on the map.</span>
              </div>
              <button type="button" onClick={() => setShowMobileFilters(false)} aria-label="Close filters">
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <MapSidebar
              mobile
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              showHVI={showHVI}
              onHVIToggle={() => setShowHVI((v) => !v)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
