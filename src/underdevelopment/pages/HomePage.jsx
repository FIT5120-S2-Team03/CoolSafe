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
    <div className="min-h-screen bg-[#fefdf5]">
      <Navbar />
      <div className="pt-[68px]">
        <HeatRiskBanner onCoordsReady={handleCoordsReady} />

        <div className="max-w-[1600px] mx-auto px-4 py-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5 w-full">
            {/* Left column */}
            <div className="min-w-0 flex flex-col gap-4">
              <HourlyForecastStrip hourly={weatherData?.hourly ?? null} />
              <TomorrowAlertCard daily={weatherData?.daily ?? null} />

              {weatherData && (
                <HeatSafetyScore
                  apparentTemp={weatherData.current.apparentTemp}
                  hour={currentHour}
                  selectedMedications={selectedMedications}
                  riskLevel={getRiskLevel(weatherData.current.apparentTemp).level}
                />
              )}

              <MedicationsSection
                selectedMedications={selectedMedications}
                onMedicationsChange={setSelectedMedications}
              />

              {/* Cooling locations CTA */}
              <button
                onClick={() => navigate('/map')}
                className="relative rounded-lg w-full flex justify-between items-center cursor-pointer overflow-hidden"
                style={{
                  padding: '52px 40px',
                  backgroundImage: `linear-gradient(to right, rgba(0,86,210,0.82) 0%, rgba(0,86,210,0.55) 50%, rgba(0,120,255,0.18) 100%), url(https://images.unsplash.com/photo-1462556791646-c201b8241a94?q=80&w=2665&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex flex-col gap-2 items-start">
                  <span className="font-['Public_Sans'] font-bold text-[16px] text-white uppercase tracking-[1.4px] opacity-80">
                    Cooling Locations
                  </span>
                  <span className="font-['Public_Sans'] font-black text-[30px] text-white leading-tight text-left">
                    Find Cool Spaces Near Me
                  </span>
                </div>
                <span className="text-white text-[42px]">→</span>
              </button>

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
