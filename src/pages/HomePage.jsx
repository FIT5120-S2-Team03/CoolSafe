/**
 * Main landing page. Renders the heat risk banner and a two-column content grid
 * with hourly forecast, tomorrow alert, and the status card.
 * Weather data is lifted from HeatRiskBanner via callback to avoid duplicate fetches.
 */
import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeatRiskBanner from '../components/home/HeatRiskBanner'
import HourlyForecastStrip from '../components/home/HourlyForecastStrip'
import TomorrowAlertCard from '../components/home/TomorrowAlertCard'
import StatusCard from '../components/home/StatusCard'

export default function HomePage() {
  const [weatherData, setWeatherData] = useState(null)

  function handleCoordsReady(lat, lng, current, hourly, daily) {
    setWeatherData({ lat, lng, current, hourly, daily })
  }

  return (
    <div className="min-h-screen bg-[#f9f9fc]">
      <Navbar />
      <div className="pt-[68px]">
        <HeatRiskBanner onCoordsReady={handleCoordsReady} />

        <div className="max-w-[1232px] mx-auto px-5 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              <HourlyForecastStrip hourly={weatherData?.hourly ?? null} />
              <TomorrowAlertCard daily={weatherData?.daily ?? null} />
            </div>

            {/* Right column: status card */}
            <StatusCard
              lat={weatherData?.lat ?? null}
              lng={weatherData?.lng ?? null}
              currentTemp={weatherData?.current?.temp ?? null}
              todayMax={weatherData?.daily?.todayMax ?? null}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
