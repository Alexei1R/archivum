import { useEffect, useState } from "react";

import type { RoutePlanStop } from "../types";

export type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

interface RouteMeta {
  distanceMeters: number;
  durationSeconds: number;
}

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

const useRouteGeometry = (stops: RoutePlanStop[]) => {
  const [route, setRoute] = useState<RouteFeatureCollection>(emptyRoute);
  const [routeMeta, setRouteMeta] = useState<RouteMeta | null>(null);
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

  return {
    error,
    isRouteLoading,
    route,
    routeMeta,
  };
};

export default useRouteGeometry;
