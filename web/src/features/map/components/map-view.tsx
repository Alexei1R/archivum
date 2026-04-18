import "maplibre-gl/dist/maplibre-gl.css";

import { useMap, useRoutePlan } from "../hooks";
import MapPoiLayer from "./map-poi-layer";
import MapRoutePlanLayer from "./map-route-plan-layer";

const MapView = () => {
  const { containerRef, error, isReady, map } = useMap();
  const routePlan = useRoutePlan();

  return (
    <section className="map-view" aria-label="City map">
      <div ref={containerRef} className="map-view__canvas" />

      <MapPoiLayer isReady={isReady} map={map} />
      <MapRoutePlanLayer
        isReady={isReady}
        map={map}
        onClearClickedStops={routePlan.clearManualRouteStops}
        plannedStopCount={routePlan.manualRouteStopCount}
        stops={routePlan.plannedStops}
      />

      {!isReady && !error && (
        <div className="map-view__status" role="status">
          Loading map
        </div>
      )}

      {error && (
        <div className="map-view__status map-view__status--error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
};

export default MapView;
