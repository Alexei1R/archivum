import { useEffect } from "react";
import type { GeoJSONSource, Map } from "maplibre-gl";

import {
  MAP_ROUTE_LAYERS,
  MAP_ROUTE_SOURCE_ID,
} from "../constants";
import { useRouteGeometry } from "../hooks";
import type { RoutePlanStop } from "../types";

interface MapRoutePlanLayerProps {
  isReady: boolean;
  map: Map | null;
  onClearClickedStops: () => void;
  plannedStopCount: number;
  stops: RoutePlanStop[];
}

const canUseMapStyle = (map: Map) => {
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
};

const getMapRoot = (map: Map) =>
  map.getContainer().closest(".map-view") || document.documentElement;

const getCssValue = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

const removeRouteLayers = (map: Map) => {
  if (!canUseMapStyle(map)) return;

  [MAP_ROUTE_LAYERS.route, MAP_ROUTE_LAYERS.routeCasing].forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      // MapLibre may already be tearing down during route changes.
    }
  });

  try {
    if (map.getSource(MAP_ROUTE_SOURCE_ID)) {
      map.removeSource(MAP_ROUTE_SOURCE_ID);
    }
  } catch {
    // MapLibre may already be tearing down during route changes.
  }
};

const addRouteLayers = (
  map: Map,
  route: GeoJSON.FeatureCollection<GeoJSON.LineString>,
) => {
  if (!canUseMapStyle(map)) return;

  removeRouteLayers(map);

  const root = getMapRoot(map);
  const routeColor = getCssValue(root, "--map-route-line") || "rgb(205, 132, 72)";
  const routeCasingColor = getCssValue(root, "--map-surface") || "white";

  map.addSource(MAP_ROUTE_SOURCE_ID, {
    type: "geojson",
    data: route,
  });

  map.addLayer({
    id: MAP_ROUTE_LAYERS.routeCasing,
    type: "line",
    source: MAP_ROUTE_SOURCE_ID,
    paint: {
      "line-color": routeCasingColor,
      "line-opacity": 0.95,
      "line-width": ["interpolate", ["linear"], ["zoom"], 7, 3, 12, 5, 16, 7],
    },
  });

  map.addLayer({
    id: MAP_ROUTE_LAYERS.route,
    type: "line",
    source: MAP_ROUTE_SOURCE_ID,
    paint: {
      "line-color": routeColor,
      "line-opacity": 0.95,
      "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.5, 12, 2.5, 16, 4],
    },
  });

  map.moveLayer(MAP_ROUTE_LAYERS.routeCasing);
  map.moveLayer(MAP_ROUTE_LAYERS.route);
};

const MapRoutePlanLayer = ({
  isReady,
  map,
  onClearClickedStops,
  plannedStopCount,
  stops,
}: MapRoutePlanLayerProps) => {
  const { error, isRouteLoading, route, routeMeta } = useRouteGeometry(stops);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    addRouteLayers(map, route);

    return () => {
      if (canUseMapStyle(map)) removeRouteLayers(map);
    };
  }, [isReady, map, route]);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    const source = map.getSource(MAP_ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(route);
  }, [isReady, map, route]);

  if (!isReady) return null;

  return (
    <div className="map-view__legend map-view__legend--events" aria-live="polite">
      <span>{stops.length} planned stops</span>
      {isRouteLoading && <span>Building route</span>}
      {routeMeta && (
        <span>
          {(routeMeta.distanceMeters / 1000).toFixed(1)} km · {Math.round(routeMeta.durationSeconds / 60)} min
        </span>
      )}
      {error && <span className="map-view__legend-error">{error}</span>}
      {plannedStopCount > 0 && (
        <button
          className="map-view__legend-action"
          onClick={onClearClickedStops}
          type="button"
        >
          Clear clicked stops
        </button>
      )}
    </div>
  );
};

export default MapRoutePlanLayer;
