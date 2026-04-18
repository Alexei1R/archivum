import { useEffect, useState } from "react";
import type { GeoJSONSource, Map } from "maplibre-gl";

import {
  MAP_EVENTS_LAYERS,
  MAP_EVENTS_ROUTE_SOURCE_ID,
} from "../constants";
import type { RoutePlanStop } from "../types";

interface MapRoutePlanLayerProps {
  isReady: boolean;
  map: Map | null;
  onClearClickedStops: () => void;
  plannedStopCount: number;
  stops: RoutePlanStop[];
}

type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

type OsrmRouteResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: GeoJSON.LineString;
  }>;
};

const emptyRoute: RouteFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

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

const toRouteGeoJson = (geometry?: GeoJSON.LineString): RouteFeatureCollection => ({
  type: "FeatureCollection",
  features: geometry
    ? [
      {
        type: "Feature",
        geometry,
        properties: {},
      },
    ]
    : [],
});

const buildOsrmRouteUrl = (stops: RoutePlanStop[]) => {
  const coordinates = stops
    .map((stop) => `${stop.longitude},${stop.latitude}`)
    .join(";");
  const params = new URLSearchParams({
    alternatives: "false",
    geometries: "geojson",
    overview: "full",
    steps: "false",
  });

  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`;
};

const removeRouteLayers = (map: Map) => {
  if (!canUseMapStyle(map)) return;

  [MAP_EVENTS_LAYERS.route, MAP_EVENTS_LAYERS.routeCasing].forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      // MapLibre may already be tearing down during route changes.
    }
  });

  try {
    if (map.getSource(MAP_EVENTS_ROUTE_SOURCE_ID)) {
      map.removeSource(MAP_EVENTS_ROUTE_SOURCE_ID);
    }
  } catch {
    // MapLibre may already be tearing down during route changes.
  }
};

const addRouteLayers = (map: Map, route: RouteFeatureCollection) => {
  if (!canUseMapStyle(map)) return;

  removeRouteLayers(map);

  const root = getMapRoot(map);
  const routeColor = getCssValue(root, "--map-route-line") || "rgb(205, 132, 72)";
  const routeCasingColor = getCssValue(root, "--map-surface") || "white";

  map.addSource(MAP_EVENTS_ROUTE_SOURCE_ID, {
    type: "geojson",
    data: route,
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.routeCasing,
    type: "line",
    source: MAP_EVENTS_ROUTE_SOURCE_ID,
    paint: {
      "line-color": routeCasingColor,
      "line-opacity": 0.95,
      "line-width": ["interpolate", ["linear"], ["zoom"], 7, 3, 12, 5, 16, 7],
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.route,
    type: "line",
    source: MAP_EVENTS_ROUTE_SOURCE_ID,
    paint: {
      "line-color": routeColor,
      "line-opacity": 0.95,
      "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.5, 12, 2.5, 16, 4],
    },
  });

  map.moveLayer(MAP_EVENTS_LAYERS.routeCasing);
  map.moveLayer(MAP_EVENTS_LAYERS.route);
};

const MapRoutePlanLayer = ({
  isReady,
  map,
  onClearClickedStops,
  plannedStopCount,
  stops,
}: MapRoutePlanLayerProps) => {
  const [route, setRoute] = useState<RouteFeatureCollection>(emptyRoute);
  const [routeMeta, setRouteMeta] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stops.length < 2) {
      setRoute(emptyRoute);
      setRouteMeta(null);
      setIsRouteLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    const loadRoute = async () => {
      try {
        setError(null);
        setIsRouteLoading(true);
        const response = await fetch(buildOsrmRouteUrl(stops), {
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`Route request failed (${response.status}).`);

        const payload = (await response.json()) as OsrmRouteResponse;
        const firstRoute = payload.routes?.[0];

        if (payload.code && payload.code !== "Ok") {
          throw new Error(payload.message || `Route request failed (${payload.code}).`);
        }
        if (!firstRoute?.geometry) {
          throw new Error("No road route found for the selected locations.");
        }

        if (!abortController.signal.aborted) {
          setRoute(toRouteGeoJson(firstRoute.geometry));
          setRouteMeta({
            distanceMeters: firstRoute.distance,
            durationSeconds: firstRoute.duration,
          });
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        setRoute(emptyRoute);
        setRouteMeta(null);
        setError(error instanceof Error ? error.message : "Route could not be loaded.");
      } finally {
        if (!abortController.signal.aborted) setIsRouteLoading(false);
      }
    };

    void loadRoute();

    return () => {
      abortController.abort();
    };
  }, [stops]);

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

    const source = map.getSource(MAP_EVENTS_ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
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
