import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { getWalkingMinutes } from '../../utils/routing/haversine'
import useVenue from '../../hooks/useVenue'
import ShareRouteModal from './components/ShareRouteModal'
import RouteDirections from './components/RouteDirections'
import VenueInfoCards from './components/VenueInfoCards'
import VenueMap from './components/VenueMap'
import { getHoursDisplay } from '../../utils/venueDetailUtils'
import mockLocation from '../../mocks/mockLocation.json'
import {
  userPinIcon,
  venuePinIcon,
  startLabelIcon,
  destinationLabelIcon,
} from '../../constants/leafletIcons'
import { getCachedRoute, getRouteCacheKey, setCachedRoute } from '../../utils/routing/routeCache'
import { buildCoolestRouteResult, decodePolyline, fetchFastestRoute as requestFastestRoute } from '../../utils/routing/routeUtils'
import './VenueDetailPage.css'


export default function VenueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isShareView = searchParams.get('share') === 'true'
  const shareLat = parseFloat(searchParams.get('from_lat'))
  const shareLng = parseFloat(searchParams.get('from_lng'))
  const shareRouteType = searchParams.get('route_type') ?? 'fastest'
  const sharePolylineParam = searchParams.get('polyline')

  const { venue, loading, error } = useVenue(id, location.state?.venue)

  const [userLocation, setUserLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showDeniedAlert, setShowDeniedAlert] = useState(false)
  const [routeMode, setRouteMode] = useState(isShareView ? shareRouteType : 'fastest')
  const [routeCoords, setRouteCoords] = useState([])
  const [routeSteps, setRouteSteps] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const fetchFastestRoute = useCallback(async (from) => {
    if (!venue) return
    try {
      setRouteLoading(true)
      setRouteError('')
      const route = await requestFastestRoute(from, venue, { includeSteps: true })
      setRouteCoords(route.coords)
      setRouteSteps(route.steps)
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setRouteLoading(false)
    }
  }, [venue])

  const fetchCoolestRoute = useCallback(async (from) => {
    if (!venue) return
    try {
      setRouteLoading(true)
      setRouteError('')
      const cacheKey = getRouteCacheKey(from, venue)
      const cachedRoute = getCachedRoute(cacheKey)

      if (cachedRoute) {
        setRouteCoords(cachedRoute.coolestCoords)
        setRouteSteps(cachedRoute.coolestSteps ?? [])
        return
      }

      const result = await buildCoolestRouteResult(venue, from)
      setRouteCoords(result.coolestCoords)
      setRouteSteps(result.coolestSteps)
      setCachedRoute(cacheKey, result)
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setRouteLoading(false)
    }
  }, [venue])

  useEffect(() => {
    if (mockLocation.enabled) {
      setUserLocation({ lat: mockLocation.lat, lng: mockLocation.lng })
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true)
    )
  }, [isShareView])

  useEffect(() => {
    if (isShareView || !userLocation || !venue) return
    if (routeMode === 'fastest') {
      fetchFastestRoute(userLocation)
    } else {
      fetchCoolestRoute(userLocation)
    }
  }, [userLocation, routeMode, venue, isShareView, fetchFastestRoute, fetchCoolestRoute])

  useEffect(() => {
    if (!isShareView || !venue) return
    if (sharePolylineParam) {
      setRouteCoords(decodePolyline(sharePolylineParam))
      return
    }
    if (isNaN(shareLat) || isNaN(shareLng)) return
    if (shareRouteType === 'coolest') {
      fetchCoolestRoute({ lat: shareLat, lng: shareLng })
    } else {
      fetchFastestRoute({ lat: shareLat, lng: shareLng })
    }
  }, [isShareView, venue, shareLat, shareLng, shareRouteType, sharePolylineParam, fetchFastestRoute, fetchCoolestRoute])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  function requestLocation() {
    if (mockLocation.enabled) {
      setUserLocation({ lat: mockLocation.lat, lng: mockLocation.lng })
      setLocationDenied(false)
      setShowDeniedAlert(false)
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationDenied(false)
        setShowDeniedAlert(false)
      },
      () => {
        setLocationDenied(true)
        setShowDeniedAlert(true)
      }
    )
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen venue-page">
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div className="venue-loading-spinner" />
      </main>
    </div>
  )

  if (error || !venue) return (
    <div className="flex flex-col min-h-screen venue-page">
      <Navbar />
      <main className="flex-1 pt-[68px] flex items-center justify-center">
        <div className="venue-empty-state">
          <p>Venue not found.</p>
          <button onClick={() => navigate('/spaces')} className="venue-text-button">
            Back to Spaces
          </button>
        </div>
      </main>
    </div>
  )

  const hoursDisplay = getHoursDisplay(venue.opening_hours)
  const walkMins = userLocation
    ? getWalkingMinutes(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
    : null
  const shareWalkMins = !isNaN(shareLat) && !isNaN(shareLng)
    ? getWalkingMinutes(shareLat, shareLng, venue.lat, venue.lng)
    : null

  if (isShareView) {
    return (
      <div className="venue-share-view">
        <div className="venue-share-header">
          <h2>{venue.name}</h2>
          <p>
            {[venue.suburb, shareWalkMins ? `~${shareWalkMins} min walk` : null].filter(Boolean).join(' · ')}
          </p>
          {routeLoading && (
            <p>Loading route...</p>
          )}
        </div>
        <div className="venue-share-map">
          <VenueMap
            center={[venue.lat, venue.lng]}
            destinationLabelIcon={destinationLabelIcon}
            routeCoords={routeCoords}
            routeMode={routeMode}
            startLabelIcon={startLabelIcon}
            userLocation={!isNaN(shareLat) && !isNaN(shareLng) ? { lat: shareLat, lng: shareLng } : null}
            userPinIcon={userPinIcon}
            venue={venue}
            venuePinIcon={venuePinIcon}
            zoom={15}
            zoomControl
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen venue-page">
      <Navbar />

      <main className="flex-1 venue-detail-main">
        <div className="venue-detail-shell">

          {/* Breadcrumb */}
          <nav className="venue-breadcrumb">
            <button onClick={() => navigate('/')}>
              Home
            </button>
            <span className="venue-breadcrumb-separator">›</span>
            <button onClick={() => navigate('/spaces')}>
              Spaces
            </button>
            <span className="venue-breadcrumb-separator">›</span>
            <span className="venue-breadcrumb-current">{venue.name}</span>
          </nav>

          {/* Venue name */}
          <h1 className="venue-title">{venue.name}</h1>

          <VenueInfoCards
            hoursDisplay={hoursDisplay}
            locationDenied={locationDenied}
            onRequestLocation={requestLocation}
            showDeniedAlert={showDeniedAlert}
            userLocation={userLocation}
            venue={venue}
            walkMins={walkMins}
          />

          <RouteDirections
            destinationLabelIcon={destinationLabelIcon}
            routeCoords={routeCoords}
            routeError={routeError}
            routeLoading={routeLoading}
            routeMode={routeMode}
            routeSteps={routeSteps}
            setRouteMode={setRouteMode}
            startLabelIcon={startLabelIcon}
            userLocation={userLocation}
            userPinIcon={userPinIcon}
            venue={venue}
            venuePinIcon={venuePinIcon}
          />

          {/* Share This Route with Family button */}
          <button className="venue-detail-link venue-share-route-button" onClick={() => setShareModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share This Route with Family
          </button>
          <p className="venue-share-route-note">
            Let your family know where you're going
          </p>

          {/* View on Spaces button */}
          <button className="venue-detail-action venue-view-spaces-button" onClick={() => navigate('/spaces', { state: { flyTo: { lat: venue.lat, lng: venue.lng }, openVenueId: venue.id } })}>
            View in Spaces →
          </button>

        </div>
      </main>

      <ShareRouteModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        venueId={venue.id}
        venueName={venue.name}
        routeType={routeMode}
        userLocation={userLocation}
        routeCoords={routeCoords}
      />
    </div>
  )
}
