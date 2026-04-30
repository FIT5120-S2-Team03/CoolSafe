import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PasswordGate from './PasswordGate'

import HomePageDev from './underdevelopment/pages/HomePage'
import MapPageDev from './underdevelopment/pages/MapPage'
<<<<<<< HEAD
=======
import VenueDetailPage from './underdevelopment/pages/VenueDetailPage'
>>>>>>> dev

import HomePageV1 from './version1/pages/HomePage'
import MapPageV1 from './version1/pages/MapPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PasswordGate storageKey="auth_dev">
            <HomePageDev />
          </PasswordGate>
        } />
        <Route path="/map" element={
          <PasswordGate storageKey="auth_dev">
            <MapPageDev />
          </PasswordGate>
        } />

        <Route path="/underdevelopment" element={
          <PasswordGate storageKey="auth_dev">
            <HomePageDev />
          </PasswordGate>
        } />
        <Route path="/underdevelopment/map" element={
          <PasswordGate storageKey="auth_dev">
            <MapPageDev />
          </PasswordGate>
        } />

<<<<<<< HEAD
=======
        <Route path="/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <VenueDetailPage />
          </PasswordGate>
        } />
        <Route path="/underdevelopment/venue/:id" element={
          <PasswordGate storageKey="auth_dev">
            <VenueDetailPage />
          </PasswordGate>
        } />

>>>>>>> dev
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
      </Routes>
    </BrowserRouter>
  )
}
