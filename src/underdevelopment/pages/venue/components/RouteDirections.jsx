import { fmtDist, maneuverIcon, maneuverLabel } from '../../../utils/venueDetailUtils'
import VenueMap from './VenueMap'

const ROUTE_TABS = [
  { key: 'fastest', label: 'Fastest Route' },
  { key: 'coolest', label: 'Coolest Route' },
]

export default function RouteDirections({
  destinationLabelIcon,
  routeCoords,
  routeError,
  routeLoading,
  routeMode,
  routeSteps,
  setRouteMode,
  startLabelIcon,
  userLocation,
  userPinIcon,
  venue,
  venuePinIcon,
}) {
  return (
    <section className="venue-route-card">
      <h2>Get Directions</h2>
      <p>Choose your preferred walking path based on shade.</p>

      <div className="venue-route-tabs">
        {ROUTE_TABS.map(({ key, label }) => (
          <button
            key={key}
            className="venue-route-tab"
            data-active={routeMode === key ? 'true' : 'false'}
            onClick={() => setRouteMode(key)}
          >
            {routeLoading && routeMode === key && key === 'fastest' ? 'Loading...' : label}
          </button>
        ))}
      </div>

      {routeError && <p className="venue-route-error">{routeError}</p>}

      <div className="venue-route-map">
        <VenueMap
          destinationLabelIcon={destinationLabelIcon}
          routeCoords={routeCoords}
          routeMode={routeMode}
          startLabelIcon={startLabelIcon}
          userLocation={userLocation}
          userPinIcon={userPinIcon}
          venue={venue}
          venuePinIcon={venuePinIcon}
        />
      </div>

      {routeSteps.length > 0 && (
        <div className="venue-route-steps">
          <p className="venue-route-steps-title">Step-by-step</p>
          <div className="venue-route-steps-list">
            {routeSteps.map((step, i) => {
              const dist = fmtDist(step.distance)
              const isLast = i === routeSteps.length - 1
              const isArrive = step.maneuver?.type === 'arrive'
              return (
                <div
                  key={i}
                  className="venue-route-step"
                  data-last={isLast ? 'true' : 'false'}
                  data-arrive={isArrive ? 'true' : 'false'}
                >
                  <div className="venue-route-step-icon">
                    <i className={`ti ${maneuverIcon(step.maneuver)}`} />
                  </div>
                  <div className="venue-route-step-copy">
                    <p>{maneuverLabel(step)}</p>
                    {dist && <span>{dist}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
