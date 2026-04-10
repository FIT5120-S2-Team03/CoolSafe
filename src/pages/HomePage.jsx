/**
 * Main landing page. Renders the heat risk banner and a two-column content grid
 * with hourly forecast, tomorrow alert, heat safety score, and status card.
 * Weather data is lifted from HeatRiskBanner via callback to avoid duplicate fetches.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeatRiskBanner from '../components/home/HeatRiskBanner'
import HourlyForecastStrip from '../components/home/HourlyForecastStrip'
import TomorrowAlertCard from '../components/home/TomorrowAlertCard'
import StatusCard from '../components/home/StatusCard'
import HeatSafetyScore from '../components/home/HeatSafetyScore'
import DoThisAvoid from '../components/home/DoThisAvoid'
import MedicationsSection from '../components/home/MedicationsSection'
import { getRiskLevel } from '../utils/riskLevel'

export default function HomePage() {
  const [weatherData, setWeatherData] = useState(null)
  const [selectedMedications, setSelectedMedications] = useState([])
  const navigate = useNavigate()
  const currentHour = new Date().getHours()

  function handleCoordsReady(lat, lng, current, hourly, daily, locationName) {
    setWeatherData({ lat, lng, current, hourly, daily, locationName })
  }

  return (
    <div className="min-h-screen bg-[#f9f9fc]">
      <Navbar />
      <div className="pt-[68px]">
        <HeatRiskBanner onCoordsReady={handleCoordsReady} />

        <div className="max-w-[1232px] mx-auto px-5 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Left column */}
            <div className="min-w-0 flex flex-col gap-6">
              <HourlyForecastStrip hourly={weatherData?.hourly ?? null} />
              <TomorrowAlertCard daily={weatherData?.daily ?? null} />

              {weatherData && (
                <HeatSafetyScore
                  apparentTemp={weatherData.current.apparentTemp}
                  hour={currentHour}
                  selectedMedications={selectedMedications}
                />
              )}

              {/* Cooling locations CTA */}
              <button
                onClick={() => navigate('/map')}
                className="bg-[#0056d2] rounded-lg p-10 w-full flex justify-between items-center cursor-pointer"
              >
                <div className="flex flex-col gap-2">
                  <span className="font-['Public_Sans'] font-bold text-[14px] text-white uppercase tracking-[1.4px] opacity-80">
                    Cooling Locations
                  </span>
                  <span className="font-['Public_Sans'] font-black text-[36px] text-white leading-tight">
                    Find Cool Spaces Near Me
                  </span>
                </div>
                <span className="text-white text-[40px]">→</span>
              </button>

              {weatherData && (
                <DoThisAvoid riskLevel={getRiskLevel(weatherData.current.apparentTemp).level} />
              )}

              <MedicationsSection
                selectedMedications={selectedMedications}
                onMedicationsChange={setSelectedMedications}
              />
            </div>

            {/* Right column: status card */}
            <StatusCard
              lat={weatherData?.lat ?? null}
              lng={weatherData?.lng ?? null}
              currentTemp={weatherData?.current?.temp ?? null}
              todayMax={weatherData?.daily?.todayMax ?? null}
              locationName={weatherData?.locationName ?? null}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
