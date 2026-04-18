import type { MapPoiCategory } from "../types";

export type MapStyleTheme = "light" | "dark";

export const MAP_STYLE_SOURCE_URLS: Record<MapStyleTheme, string> = {
  light:
    "https://raw.githubusercontent.com/openmaptiles/positron-gl-style/master/style.json",
  dark:
    "https://raw.githubusercontent.com/openmaptiles/dark-matter-gl-style/master/style.json",
};

export const MAP_DEFAULT_VIEW = {
  center: [28.8323, 47.0105] as [number, number],
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

export const MAP_CAMERA_STORAGE_KEY = "fuse:map:camera:v1";

export const MAP_POI_SEARCH_RADIUS_METERS = 8000;

export const MAP_POI_REFETCH_DISTANCE_METERS = 4000;

export const MAP_POI_MIN_ZOOM = 12;

export const MAP_POI_REQUEST_COOLDOWN_MS = 20000;

export const MAP_POI_FETCH_DEBOUNCE_MS = 900;

export const MAP_POI_RATE_LIMIT_BACKOFF_MS = 120000;

export const MAP_POI_CACHE_STORAGE_KEY = "fuse:map:poi-cache:v1";

export const MAP_POI_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const MAP_POI_CACHE_MAX_ENTRIES = 24;

export const MAP_POI_OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

export const MAP_POI_SOURCE_ID = "map-pois";

export const MAP_POI_LAYERS = {
  clusters: "map-pois-clusters",
  clusterCount: "map-pois-cluster-count",
  markerShadow: "map-pois-marker-shadow",
  markers: "map-pois-markers",
  labels: "map-pois-labels",
};

export const MAP_POI_CATEGORIES: MapPoiCategory[] = [
  {
    id: "museum",
    label: "Museums",
    colorVariable: "--map-poi-museum",
    osmTags: [{ key: "tourism", value: "museum" }],
  },
  {
    id: "gallery",
    label: "Galleries",
    colorVariable: "--map-poi-gallery",
    osmTags: [{ key: "tourism", value: "gallery" }],
  },
  {
    id: "artwork",
    label: "Artworks",
    colorVariable: "--map-poi-artwork",
    osmTags: [{ key: "tourism", value: "artwork" }],
  },
  {
    id: "arts",
    label: "Art spaces",
    colorVariable: "--map-poi-arts",
    osmTags: [{ key: "amenity", value: "arts_centre" }],
  },
  {
    id: "cathedral",
    label: "Cathedrals",
    colorVariable: "--map-poi-cathedral",
    osmTags: [{ key: "building", value: "cathedral" }],
  },
  {
    id: "church",
    label: "Churches",
    colorVariable: "--map-poi-church",
    osmTags: [{ key: "building", value: "church" }],
  },
  {
    id: "placeOfWorship",
    label: "Religious places",
    colorVariable: "--map-poi-worship",
    osmTags: [{ key: "amenity", value: "place_of_worship" }],
  },
];
