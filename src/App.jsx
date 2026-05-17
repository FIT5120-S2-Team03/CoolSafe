import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import PasswordGate from './PasswordGate'
import useFountains from './underdevelopment/hooks/useFountains'
import useHVI from './underdevelopment/hooks/useHVI'
import GlobalLocationModal from './underdevelopment/components/location/GlobalLocationModal'

// Kicks off background fetches so map data is cached before the user navigates there.
function Prefetch() {
  useFountains()
  useHVI()
  return null
}

import LandingPage from './underdevelopment/pages/LandingPage'
import TodayPage from './underdevelopment/pages/TodayPage'
import SpacesPage from './underdevelopment/pages/SpacesPage'
import HealthPage from './underdevelopment/pages/HealthPage'
import VenueDetailPage from './underdevelopment/pages/VenueDetailPage'
import AIFinderButton from './underdevelopment/components/ai/AIFinderButton'

import HomePageV1 from './version1/pages/HomePage'
import MapPageV1 from './version1/pages/MapPage'

import HomePageV2 from './version2/pages/HomePage'
import MapPageV2 from './version2/pages/MapPage'

function DevLayout({ children }) {
  const { search } = useLocation()
  const isShareView = new URLSearchParams(search).get('share') === 'true'
  return (
    <>
      <GlobalLocationModal />
      {!isShareView && <AIFinderButton />}
      {children}
    </>
  )
}

function ScrollToTop() {
  const { pathname, state } = useLocation()

  useEffect(() => {
    if (state?.scrollTo === 'directions') return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, state?.scrollTo])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <Prefetch />
      <ScrollToTop />
      <Routes>

        {/* ── Landing page — logo always navigates here ── */}
        <Route path="/" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><LandingPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── Today / heat risk page ── */}
        <Route path="/today" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><TodayPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── Spaces page ── */}
        <Route path="/spaces" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><SpacesPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── Health check page ── */}
        <Route path="/health" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><HealthPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── Venue detail ── */}
        <Route path="/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><VenueDetailPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── /underdevelopment aliases (backwards-compatible) ── */}
        <Route path="/underdevelopment" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><LandingPage /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/today" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><TodayPage /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/spaces" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><SpacesPage /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/health" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><HealthPage /></DevLayout>
          </PasswordGate>
        } />
        <Route path="/underdevelopment/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <DevLayout><VenueDetailPage /></DevLayout>
          </PasswordGate>
        } />

        {/* ── Version 1 ── */}
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

        {/* ── Version 2 ── */}
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
