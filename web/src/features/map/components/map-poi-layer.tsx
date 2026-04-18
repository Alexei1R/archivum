import { useEffect, useMemo, useState } from "react";
import type { GeoJSONSource, Map, MapLayerMouseEvent } from "maplibre-gl";
import { Popup } from "maplibre-gl";

import {
  MAP_POI_CATEGORIES,
  MAP_POI_FETCH_DEBOUNCE_MS,
  MAP_POI_LAYERS,
  MAP_POI_MIN_ZOOM,
  MAP_POI_REQUEST_COOLDOWN_MS,
  MAP_POI_REFETCH_DISTANCE_METERS,
  MAP_POI_SEARCH_RADIUS_METERS,
  MAP_POI_SOURCE_ID,
} from "../constants";
import { mapService } from "../services";
import type { MapPoiFeatureCollection, MapPoiProperties } from "../types";

interface MapPoiLayerProps {
  isReady: boolean;
  map: Map | null;
}

const emptyPlaces: MapPoiFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const toCenterTuple = (map: Map): [number, number] => {
  const center = map.getCenter();

  return [center.lng, center.lat];
};

const getDistanceMeters = (from: [number, number], to: [number, number]) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const isCoveredByFetchedArea = (
  fetchedCenter: [number, number],
  nextCenter: [number, number],
) => getDistanceMeters(fetchedCenter, nextCenter) < MAP_POI_REFETCH_DISTANCE_METERS;

const getMapRoot = (map: Map) =>
  map.getContainer().closest(".map-view") || document.documentElement;

const getCssValue = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

const getCategoryColorExpression = (element: Element) => {
  const fallback = getCssValue(element, "--map-cluster");
  const expression: Array<string | string[]> = ["match", ["get", "category"]];

  MAP_POI_CATEGORIES.forEach((category) => {
    expression.push(category.id, getCssValue(element, category.colorVariable) || fallback);
  });

  expression.push(fallback);

  return expression;
};

const createPopupContent = (properties: MapPoiProperties) => {
  const root = document.createElement("div");
  root.className = "map-poi-popup";

  const title = document.createElement("p");
  title.className = "map-poi-popup__title";
  title.textContent = properties.name;
  root.append(title);

  const meta = document.createElement("p");
  meta.className = "map-poi-popup__meta";
  meta.textContent = properties.address || properties.kind;
  root.append(meta);

  return root;
};

const canUseMapStyle = (map: Map) => {
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
};

const removePoiLayers = (map: Map) => {
  if (!canUseMapStyle(map)) return;

  Object.values(MAP_POI_LAYERS).forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      // MapLibre may already be tearing down during route changes.
    }
  });

  try {
    if (map.getSource(MAP_POI_SOURCE_ID)) map.removeSource(MAP_POI_SOURCE_ID);
  } catch {
    // MapLibre may already be tearing down during route changes.
  }
};

const addPoiLayers = (map: Map, places: MapPoiFeatureCollection) => {
  if (!canUseMapStyle(map)) return;

  removePoiLayers(map);

  const mapRoot = getMapRoot(map);
  const markerColor = getCategoryColorExpression(mapRoot);
  const surfaceColor = getCssValue(mapRoot, "--map-surface");
  const textColor = getCssValue(mapRoot, "--map-text");
  const shadowColor = getCssValue(mapRoot, "--map-poi-shadow");
  const clusterColor = getCssValue(mapRoot, "--map-cluster");

  map.addSource(MAP_POI_SOURCE_ID, {
    type: "geojson",
    data: places,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 44,
  });

  map.addLayer({
    id: MAP_POI_LAYERS.clusters,
    type: "circle",
    source: MAP_POI_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": clusterColor,
      "circle-opacity": 0.9,
      "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
      "circle-stroke-color": surfaceColor,
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: MAP_POI_LAYERS.clusterCount,
    type: "symbol",
    source: MAP_POI_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12,
      "text-font": ["Noto Sans Regular"],
    },
    paint: {
      "text-color": surfaceColor,
    },
  });

  map.addLayer({
    id: MAP_POI_LAYERS.markerShadow,
    type: "circle",
    source: MAP_POI_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": shadowColor,
      "circle-radius": 14,
      "circle-blur": 0.8,
      "circle-translate": [0, 2],
    },
  });

  map.addLayer({
    id: MAP_POI_LAYERS.markers,
    type: "circle",
    source: MAP_POI_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": markerColor as never,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 14, 8, 17, 11],
      "circle-stroke-color": surfaceColor,
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: MAP_POI_LAYERS.labels,
    type: "symbol",
    source: MAP_POI_SOURCE_ID,
    minzoom: 14,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-offset": [0, 1.2],
      "text-size": 11,
      "text-anchor": "top",
      "text-max-width": 12,
    },
    paint: {
      "text-color": textColor,
      "text-halo-color": surfaceColor,
      "text-halo-width": 1.5,
    },
  });
};

const MapPoiLayer = ({ isReady, map }: MapPoiLayerProps) => {
  const [places, setPlaces] = useState<MapPoiFeatureCollection>(emptyPlaces);
  const [requestedCenter, setRequestedCenter] = useState<[number, number] | null>(null);
  const [lastFetchedCenter, setLastFetchedCenter] = useState<[number, number] | null>(null);
  const [lastRequestAt, setLastRequestAt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const placeCount = useMemo(() => places.features.length, [places]);
  const hasPlaces = placeCount > 0;

  useEffect(() => {
    if (!map || !isReady) return;
    if (map.getZoom() < MAP_POI_MIN_ZOOM) {
      setIsLoading(false);
      return;
    }

    setRequestedCenter((previousCenter) => previousCenter || toCenterTuple(map));
  }, [isReady, map]);

  useEffect(() => {
    if (!map || !isReady) return;

    const handleMoveEnd = () => {
      if (map.getZoom() < MAP_POI_MIN_ZOOM) {
        setIsLoading(false);
        return;
      }

      const now = Date.now();

      if (now - lastRequestAt < MAP_POI_REQUEST_COOLDOWN_MS) return;

      const nextCenter = toCenterTuple(map);

      if (lastFetchedCenter && isCoveredByFetchedArea(lastFetchedCenter, nextCenter)) {
        return;
      }

      setRequestedCenter((previousCenter) => {
        if (!previousCenter) return nextCenter;

        const distance = getDistanceMeters(previousCenter, nextCenter);

        return distance >= MAP_POI_REFETCH_DISTANCE_METERS
          ? nextCenter
          : previousCenter;
      });
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [isReady, lastFetchedCenter, lastRequestAt, map]);

  useEffect(() => {
    if (!requestedCenter) return;
    if (map && map.getZoom() < MAP_POI_MIN_ZOOM) return;

    const abortController = new AbortController();
    const cachedPlaces = mapService.getCachedPointsOfInterest(
      requestedCenter,
      MAP_POI_SEARCH_RADIUS_METERS,
    );

    if (cachedPlaces) {
      setPlaces(cachedPlaces);
      setLastFetchedCenter(requestedCenter);
      setIsLoading(false);
      setError(null);
      return;
    }

    const loadPlaces = async () => {
      try {
        setError(null);
        setIsLoading(!hasPlaces);
        setLastRequestAt(Date.now());
        const nextPlaces = await mapService.getPointsOfInterest(
          requestedCenter,
          MAP_POI_SEARCH_RADIUS_METERS,
        );

        if (!abortController.signal.aborted) {
          setPlaces(nextPlaces);
          setLastFetchedCenter(requestedCenter);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;

        if (!hasPlaces) {
          setError(
            error instanceof Error
              ? error.message
              : "OpenStreetMap places could not be loaded.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadPlaces();
    }, MAP_POI_FETCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [hasPlaces, map, requestedCenter]);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    addPoiLayers(map, places);

    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const coordinates = feature?.geometry.type === "Point"
        ? feature.geometry.coordinates
        : null;

      if (!feature?.properties || !coordinates) return;

      new Popup({
        closeButton: false,
        closeOnMove: true,
        offset: 14,
      })
        .setLngLat(coordinates as [number, number])
        .setDOMContent(createPopupContent(feature.properties as MapPoiProperties))
        .addTo(map);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", MAP_POI_LAYERS.markers, handleMarkerClick);
    map.on("mouseenter", MAP_POI_LAYERS.markers, handleMouseEnter);
    map.on("mouseleave", MAP_POI_LAYERS.markers, handleMouseLeave);

    return () => {
      try {
        map.off("click", MAP_POI_LAYERS.markers, handleMarkerClick);
        map.off("mouseenter", MAP_POI_LAYERS.markers, handleMouseEnter);
        map.off("mouseleave", MAP_POI_LAYERS.markers, handleMouseLeave);
      } catch {
        // MapLibre may already be tearing down during route changes.
      }

      if (canUseMapStyle(map)) removePoiLayers(map);
    };
  }, [isReady, map, places]);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    const source = map.getSource(MAP_POI_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(places);
  }, [isReady, map, places]);

  if (!isReady) return null;

  if (map && map.getZoom() < MAP_POI_MIN_ZOOM) {
    return (
      <div className="map-view__legend" aria-live="polite">
        Zoom in to load places
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-view__status map-view__status--error" role="alert">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="map-view__status map-view__status--secondary" role="status">
        Loading places
      </div>
    );
  }

  return (
    <div className="map-view__legend" aria-live="polite">
      {placeCount} places from OpenStreetMap
    </div>
  );
};

export default MapPoiLayer;
