import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePageDev from './underdevelopment/pages/HomePage'
import MapPageDev from './underdevelopment/pages/MapPage'

import HomePageV1 from './version1/pages/HomePage'
import MapPageV1 from './version1/pages/MapPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePageDev />} />
        <Route path="/map" element={<MapPageDev />} />

        <Route path="/underdevelopment" element={<HomePageDev />} />
        <Route path="/underdevelopment/map" element={<MapPageDev />} />

        <Route path="/version1" element={<HomePageV1 />} />
        <Route path="/version1/map" element={<MapPageV1 />} />
      </Routes>
    </BrowserRouter>
  )
}
