import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PasswordGate from './PasswordGate'
import useFountains from './underdevelopment/hooks/useFountains'
import useHVI from './underdevelopment/hooks/useHVI'

// Kicks off background fetches so map data is cached before the user navigates there.
// useCoolSpaces is already called on the home page so it doesn't need to be here.
function Prefetch() {
  useFountains()
  useHVI()
  return null
}

import HomePageDev from './underdevelopment/pages/HomePage'
import MapPageDev from './underdevelopment/pages/MapPage'
import VenueDetailPage from './underdevelopment/pages/VenueDetailPage'
import WhyItMattersPage from './underdevelopment/pages/WhyItMattersPage'
import FontSizeToggle from './underdevelopment/components/layout/FontSizeToggle'
import AIFinderButton from './underdevelopment/components/ai/AIFinderButton'

import HomePageV1 from './version1/pages/HomePage'
import MapPageV1 from './version1/pages/MapPage'

import HomePageV2 from './version2/pages/HomePage'
import MapPageV2 from './version2/pages/MapPage'

function DevLayout({ children }) {
  return (
    <>
      <FontSizeToggle />
      <AIFinderButton />
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Prefetch />
      <Routes>
        <Route path="/" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><HomePageDev /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/map" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><MapPageDev /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/why" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><WhyItMattersPage /></DevLayout>
          </PasswordGate>
        } />

        <Route path="/underdevelopment" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><HomePageDev /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/map" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><MapPageDev /></DevLayout>
          </PasswordGate>
        } />

        <Route path="/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><VenueDetailPage /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><VenueDetailPage /></DevLayout>
          </PasswordGate>
        } />

        <Route path="/version1" element={
          <PasswordGate storageKey="auth_v1">
            <HomePageV1 />
          </PasswordGate>
        } />
        <Route path="/version1/map" element={
          <PasswordGate storageKey="auth_v1">
            <MapPageV1 />
          </PasswordGate>
        } />

        <Route path="/version2" element={
          <PasswordGate storageKey="auth_v2">
            <HomePageV2 />
          </PasswordGate>
        } />
        <Route path="/version2/map" element={
          <PasswordGate storageKey="auth_v2">
            <MapPageV2 />
          </PasswordGate>
        } />
      </Routes>
    </BrowserRouter>
  )
}
