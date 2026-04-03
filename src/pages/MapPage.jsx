/**
 * Placeholder for the interactive heat map page (coming in a future epic).
 */
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#f9f9fc] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-[68px]">
        <p className="font-['Lexend'] text-[#475569] text-xl">Map coming soon</p>
      </div>
      <Footer />
    </div>
  )
}
