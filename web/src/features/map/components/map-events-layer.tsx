import { useEffect, useMemo, useState } from "react";
import type { GeoJSONSource, Map, MapLayerMouseEvent } from "maplibre-gl";
import { Popup } from "maplibre-gl";

import { eventsService } from "@/features/events/services";
import { useEventsStore } from "@/features/events/store";
import type { EventItemWithDistance } from "@/features/events/types";

import {
  MAP_EVENTS_ICON_ID,
  MAP_EVENTS_LAYERS,
  MAP_EVENTS_PAGE_SIZE,
  MAP_EVENTS_SOURCE_ID,
} from "../constants";
import type { RoutePlanStop } from "../types";

interface MapEventsLayerProps {
  isReady: boolean;
  map: Map | null;
  manualPlanIds: string[];
  onToggleStop: (stop: RoutePlanStop) => void;
  onVisibleLikedStopsChange: (stops: RoutePlanStop[]) => void;
}

type MapEventProperties = {
  address: string;
  category: string;
  eventId: string;
  priceLabel: string;
  selected: boolean;
  sourceLabel: string;
  startDate: string;
  title: string;
  url?: string;
  venue: string;
};

type MapEventsFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MapEventProperties
>;

const emptyEvents: MapEventsFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const canUseMapStyle = (map: Map) => {
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
};

const EVENT_MARKER_LAYER_IDS = [
  MAP_EVENTS_LAYERS.clusters,
  MAP_EVENTS_LAYERS.clusterCount,
  MAP_EVENTS_LAYERS.markerShadow,
  MAP_EVENTS_LAYERS.markers,
  MAP_EVENTS_LAYERS.selectedMarkerShadow,
  MAP_EVENTS_LAYERS.selectedMarkers,
  MAP_EVENTS_LAYERS.labels,
];

const getMapRoot = (map: Map) =>
  map.getContainer().closest(".map-view") || document.documentElement;

const getCssValue = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

const createStarImage = (color: string, strokeColor: string) => {
  const size = 64;
  const center = size / 2;
  const outerRadius = 29;
  const innerRadius = 12;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) return null;

  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 13;
  context.shadowOffsetY = 4;
  context.beginPath();

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;

    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.shadowColor = "transparent";
  context.lineWidth = 5;
  context.strokeStyle = strokeColor;
  context.stroke();

  return {
    data: context.getImageData(0, 0, size, size).data,
    height: size,
    width: size,
  };
};

const ensureStarImage = (map: Map) => {
  if (map.hasImage(MAP_EVENTS_ICON_ID)) return;

  const root = getMapRoot(map);
  const color = getCssValue(root, "--map-event-star") || "rgb(42, 196, 139)";
  const strokeColor = getCssValue(root, "--map-surface") || "white";
  const image = createStarImage(color, strokeColor);

  if (image) map.addImage(MAP_EVENTS_ICON_ID, image);
};

const removeEventLayers = (map: Map) => {
  if (!canUseMapStyle(map)) return;

  EVENT_MARKER_LAYER_IDS.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      // MapLibre may already be tearing down during route changes.
    }
  });

  try {
    if (map.getSource(MAP_EVENTS_SOURCE_ID)) map.removeSource(MAP_EVENTS_SOURCE_ID);
  } catch {
    // MapLibre may already be tearing down during route changes.
  }
};

const addEventLayers = (map: Map, events: MapEventsFeatureCollection) => {
  if (!canUseMapStyle(map)) return;

  removeEventLayers(map);
  ensureStarImage(map);

  const root = getMapRoot(map);
  const clusterColor = getCssValue(root, "--map-event-star") || "rgb(42, 196, 139)";
  const surfaceColor = getCssValue(root, "--map-surface") || "white";
  const textColor = getCssValue(root, "--map-text") || "black";
  const shadowColor = getCssValue(root, "--map-poi-shadow") || "rgb(0 0 0 / 36%)";
  map.addSource(MAP_EVENTS_SOURCE_ID, {
    type: "geojson",
    data: events,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 42,
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.clusters,
    type: "circle",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": clusterColor,
      "circle-opacity": 0.92,
      "circle-radius": ["step", ["get", "point_count"], 22, 10, 28, 30, 36],
      "circle-stroke-color": surfaceColor,
      "circle-stroke-width": 3,
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.clusterCount,
    type: "symbol",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
    },
    paint: {
      "text-color": surfaceColor,
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.markerShadow,
    type: "circle",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["all", ["!", ["has", "point_count"]], ["!", ["to-boolean", ["get", "selected"]]]],
    paint: {
      "circle-blur": 0.8,
      "circle-color": shadowColor,
      "circle-radius": 22,
      "circle-translate": [0, 6],
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.markers,
    type: "symbol",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["all", ["!", ["has", "point_count"]], ["!", ["to-boolean", ["get", "selected"]]]],
    layout: {
      "icon-allow-overlap": true,
      "icon-anchor": "center",
      "icon-image": MAP_EVENTS_ICON_ID,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 0.42, 12, 0.58, 16, 0.74],
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.selectedMarkerShadow,
    type: "circle",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["all", ["!", ["has", "point_count"]], ["to-boolean", ["get", "selected"]]],
    paint: {
      "circle-blur": 0.9,
      "circle-color": shadowColor,
      "circle-radius": 30,
      "circle-translate": [0, 7],
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.selectedMarkers,
    type: "symbol",
    source: MAP_EVENTS_SOURCE_ID,
    filter: ["all", ["!", ["has", "point_count"]], ["to-boolean", ["get", "selected"]]],
    layout: {
      "icon-allow-overlap": true,
      "icon-anchor": "center",
      "icon-image": MAP_EVENTS_ICON_ID,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 0.58, 12, 0.78, 16, 0.96],
    },
  });

  map.addLayer({
    id: MAP_EVENTS_LAYERS.labels,
    type: "symbol",
    source: MAP_EVENTS_SOURCE_ID,
    minzoom: 13,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-anchor": "top",
      "text-field": ["get", "title"],
      "text-font": ["Noto Sans Regular"],
      "text-max-width": 14,
      "text-offset": [0, 1.9],
      "text-size": 12,
    },
    paint: {
      "text-color": textColor,
      "text-halo-color": surfaceColor,
      "text-halo-width": 1.5,
    },
  });

  EVENT_MARKER_LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) map.moveLayer(layerId);
  });
};

const toEventsGeoJson = (
  events: EventItemWithDistance[],
  selectedIds: string[],
): MapEventsFeatureCollection => ({
  type: "FeatureCollection",
  features: events
    .filter((event) => event.location.latitude !== 0 || event.location.longitude !== 0)
    .map((event) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [event.location.longitude, event.location.latitude],
      },
      properties: {
        address: event.location.address,
        category: event.category,
        eventId: event.id,
        priceLabel: event.priceLabel,
        selected: selectedIds.includes(event.id),
        sourceLabel: event.sourceLabel,
        startDate: event.startDate,
        title: event.title,
        url: event.url,
        venue: event.location.name,
      },
    })),
});

const createPopupContent = (
  properties: MapEventProperties,
  isSelected: boolean,
) => {
  const root = document.createElement("div");
  root.className = "map-event-popup";

  const badge = document.createElement("p");
  badge.className = "map-event-popup__badge";
  badge.textContent = `${properties.category} · ${properties.sourceLabel}`;
  root.append(badge);

  const title = document.createElement("p");
  title.className = "map-event-popup__title";
  title.textContent = properties.title;
  root.append(title);

  const meta = document.createElement("p");
  meta.className = "map-event-popup__meta";
  meta.textContent = `${dateFormatter.format(new Date(properties.startDate))} · ${properties.venue}`;
  root.append(meta);

  const plan = document.createElement("p");
  plan.className = "map-event-popup__plan";
  plan.textContent = isSelected ? "Added to route plan" : "Click the star to add it to the route plan";
  root.append(plan);

  const address = document.createElement("p");
  address.className = "map-event-popup__meta";
  address.textContent = properties.address;
  root.append(address);

  if (properties.url) {
    const link = document.createElement("a");
    link.className = "map-event-popup__link";
    link.href = properties.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open event";
    root.append(link);
  }

  return root;
};

const toRouteStop = (event: EventItemWithDistance): RoutePlanStop => ({
  address: event.location.address,
  id: `event:${event.id}`,
  kind: "event",
  latitude: event.location.latitude,
  longitude: event.location.longitude,
  title: event.title,
});

const MapEventsLayer = ({
  isReady,
  manualPlanIds,
  map,
  onToggleStop,
  onVisibleLikedStopsChange,
}: MapEventsLayerProps) => {
  const likedEventIds = useEventsStore((state) => state.likedEventIds);
  const [events, setEvents] = useState<MapEventsFeatureCollection>(emptyEvents);
  const [eventItems, setEventItems] = useState<EventItemWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventCount = useMemo(() => events.features.length, [events]);
  const selectedIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];

    [...likedEventIds, ...manualPlanIds].forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    });

    return ids;
  }, [likedEventIds, manualPlanIds]);

  useEffect(() => {
    if (!isReady) return;

    const loadEvents = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const page = await eventsService.getEventsPage({
          page: 0,
          pageSize: MAP_EVENTS_PAGE_SIZE,
          scope: "global",
        });

        setEventItems(page.events);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Events could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, [isReady]);

  useEffect(() => {
    setEvents(toEventsGeoJson(eventItems, selectedIds));
  }, [eventItems, selectedIds]);

  useEffect(() => {
    const likedStops = eventItems
      .filter((event) => likedEventIds.includes(event.id))
      .filter((event) => event.location.latitude !== 0 || event.location.longitude !== 0)
      .map(toRouteStop);

    onVisibleLikedStopsChange(likedStops);
  }, [eventItems, likedEventIds, onVisibleLikedStopsChange]);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    addEventLayers(map, events);

    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const coordinates = feature?.geometry.type === "Point"
        ? feature.geometry.coordinates
        : null;

      if (!feature?.properties || !coordinates) return;

      const properties = feature.properties as MapEventProperties;
      onToggleStop({
        address: properties.address,
        id: `event:${properties.eventId}`,
        kind: "event",
        latitude: (coordinates as [number, number])[1],
        longitude: (coordinates as [number, number])[0],
        title: properties.title,
      });

      new Popup({
        closeButton: false,
        closeOnMove: true,
        offset: 18,
      })
        .setLngLat(coordinates as [number, number])
        .setDOMContent(createPopupContent(properties, !properties.selected))
        .addTo(map);
    };

    const handleClusterClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id as number | undefined;
      const source = map.getSource(MAP_EVENTS_SOURCE_ID) as GeoJSONSource | undefined;
      const coordinates = feature?.geometry.type === "Point"
        ? feature.geometry.coordinates
        : null;

      if (!source || clusterId === undefined || !coordinates) return;

      void source.getClusterExpansionZoom(clusterId).then((zoom) => {
        map.easeTo({
          center: coordinates as [number, number],
          zoom,
        });
      });
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", MAP_EVENTS_LAYERS.markers, handleMarkerClick);
    map.on("click", MAP_EVENTS_LAYERS.selectedMarkers, handleMarkerClick);
    map.on("click", MAP_EVENTS_LAYERS.labels, handleMarkerClick);
    map.on("click", MAP_EVENTS_LAYERS.clusters, handleClusterClick);
    map.on("mouseenter", MAP_EVENTS_LAYERS.markers, handleMouseEnter);
    map.on("mouseenter", MAP_EVENTS_LAYERS.selectedMarkers, handleMouseEnter);
    map.on("mouseenter", MAP_EVENTS_LAYERS.labels, handleMouseEnter);
    map.on("mouseenter", MAP_EVENTS_LAYERS.clusters, handleMouseEnter);
    map.on("mouseleave", MAP_EVENTS_LAYERS.markers, handleMouseLeave);
    map.on("mouseleave", MAP_EVENTS_LAYERS.selectedMarkers, handleMouseLeave);
    map.on("mouseleave", MAP_EVENTS_LAYERS.labels, handleMouseLeave);
    map.on("mouseleave", MAP_EVENTS_LAYERS.clusters, handleMouseLeave);

    return () => {
      try {
        map.off("click", MAP_EVENTS_LAYERS.markers, handleMarkerClick);
        map.off("click", MAP_EVENTS_LAYERS.selectedMarkers, handleMarkerClick);
        map.off("click", MAP_EVENTS_LAYERS.labels, handleMarkerClick);
        map.off("click", MAP_EVENTS_LAYERS.clusters, handleClusterClick);
        map.off("mouseenter", MAP_EVENTS_LAYERS.markers, handleMouseEnter);
        map.off("mouseenter", MAP_EVENTS_LAYERS.selectedMarkers, handleMouseEnter);
        map.off("mouseenter", MAP_EVENTS_LAYERS.labels, handleMouseEnter);
        map.off("mouseenter", MAP_EVENTS_LAYERS.clusters, handleMouseEnter);
        map.off("mouseleave", MAP_EVENTS_LAYERS.markers, handleMouseLeave);
        map.off("mouseleave", MAP_EVENTS_LAYERS.selectedMarkers, handleMouseLeave);
        map.off("mouseleave", MAP_EVENTS_LAYERS.labels, handleMouseLeave);
        map.off("mouseleave", MAP_EVENTS_LAYERS.clusters, handleMouseLeave);
      } catch {
        // MapLibre may already be tearing down during route changes.
      }

      if (canUseMapStyle(map)) removeEventLayers(map);
    };
  }, [events, isReady, map, onToggleStop]);

  useEffect(() => {
    if (!map || !isReady) return;
    if (!canUseMapStyle(map)) return;

    const source = map.getSource(MAP_EVENTS_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(events);
  }, [events, isReady, map]);

  if (!isReady || isLoading || error) return null;

  return (
    <div className="map-view__legend map-view__legend--event-count" aria-live="polite">
      <span>{eventCount} events</span>
    </div>
  );
};

export default MapEventsLayer;
