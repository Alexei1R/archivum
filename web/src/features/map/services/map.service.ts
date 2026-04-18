import type { StyleSpecification } from "maplibre-gl";

import { env } from "@/shared/constants";

import { MAP_STYLE_SOURCE_URLS, type MapStyleTheme } from "../constants";
import {
  MAP_POI_CACHE_MAX_ENTRIES,
  MAP_POI_CACHE_STORAGE_KEY,
  MAP_POI_CACHE_TTL_MS,
  MAP_POI_CATEGORIES,
  MAP_POI_OVERPASS_ENDPOINTS,
  MAP_POI_RATE_LIMIT_BACKOFF_MS,
  MAP_POI_SEARCH_RADIUS_METERS,
} from "../constants";
import type {
  MapPoiCategory,
  MapPoiCategoryId,
  MapPoiFeature,
  MapPoiFeatureCollection,
  OsmOverpassResponse,
  OsmPoiElement,
} from "../types";

interface PoiCacheEntry {
  key: string;
  center: [number, number];
  radius: number;
  storedAt: number;
  places: MapPoiFeatureCollection;
}

const styleCache = new Map<MapStyleTheme, StyleSpecification>();
const poiCache = new Map<string, PoiCacheEntry>();
const poiRequests = new Map<string, Promise<MapPoiFeatureCollection>>();
let overpassPausedUntil = 0;

const injectMapTilerKey = (styleText: string) => {
  const key = env.MAPTILER_KEY?.trim();

  if (!key) {
    throw new Error("Missing VITE_MAPTILER_KEY for OpenMapTiles vector tiles.");
  }

  return styleText.replaceAll("{key}", encodeURIComponent(key));
};

const getElementCategory = (
  element: OsmPoiElement,
  categories: MapPoiCategory[],
): MapPoiCategoryId | null => {
  const tags = element.tags || {};
  const category = categories.find((item) =>
    item.osmTags.some((tag) => tags[tag.key] === tag.value),
  );

  return category?.id || null;
};

const getElementCoordinate = (element: OsmPoiElement): [number, number] | null => {
  if (typeof element.lon === "number" && typeof element.lat === "number") {
    return [element.lon, element.lat];
  }

  if (
    typeof element.center?.lon === "number" &&
    typeof element.center?.lat === "number"
  ) {
    return [element.center.lon, element.center.lat];
  }

  return null;
};

const getElementAddress = (tags: Record<string, string>) => {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];

  if (street && houseNumber) return `${street} ${houseNumber}`;
  if (street) return street;

  return tags["addr:full"];
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

const createOverpassQuery = (
  categories: MapPoiCategory[],
  center: [number, number],
  radius: number,
) => {
  const [longitude, latitude] = center;
  const selectors = categories.flatMap((category) =>
    category.osmTags.flatMap((tag) => {
      const selector = `["${tag.key}"="${tag.value}"](around:${radius},${latitude},${longitude})`;

      return [`node${selector};`, `way${selector};`];
    }),
  );

  return `
    [out:json][timeout:12];
    (
      ${selectors.join("\n")}
    );
    out center tags;
  `;
};

const getPoiCacheKey = (center: [number, number], radius: number) => {
  const [longitude, latitude] = center;

  return `${latitude.toFixed(2)}:${longitude.toFixed(2)}:${radius}`;
};

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isFreshEntry = (entry: PoiCacheEntry) =>
  Date.now() - entry.storedAt < MAP_POI_CACHE_TTL_MS;

const readStoredPoiCache = () => {
  if (!canUseStorage() || poiCache.size > 0) return;

  try {
    const raw = window.localStorage.getItem(MAP_POI_CACHE_STORAGE_KEY);
    const entries = raw ? (JSON.parse(raw) as PoiCacheEntry[]) : [];

    entries.filter(isFreshEntry).forEach((entry) => {
      poiCache.set(entry.key, entry);
    });
  } catch {
    window.localStorage.removeItem(MAP_POI_CACHE_STORAGE_KEY);
  }
};

const writeStoredPoiCache = () => {
  if (!canUseStorage()) return;

  const entries = Array.from(poiCache.values())
    .filter(isFreshEntry)
    .sort((a, b) => b.storedAt - a.storedAt)
    .slice(0, MAP_POI_CACHE_MAX_ENTRIES);

  try {
    window.localStorage.setItem(MAP_POI_CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be full or unavailable; in-memory cache still works.
  }
};

const findCoveringPoiCache = (
  center: [number, number],
  radius: number,
): PoiCacheEntry | null => {
  readStoredPoiCache();

  let bestEntry: PoiCacheEntry | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  Array.from(poiCache.values()).forEach((entry) => {
    if (!isFreshEntry(entry)) {
      poiCache.delete(entry.key);
      return;
    }

    const distance = getDistanceMeters(entry.center, center);
    const coversRequestedArea = distance + radius <= entry.radius;

    if (coversRequestedArea && distance < bestDistance) {
      bestEntry = entry;
      bestDistance = distance;
    }
  });

  return bestEntry;
};

const fetchOverpass = async (body: URLSearchParams) => {
  if (Date.now() < overpassPausedUntil) {
    throw new Error("OpenStreetMap places are cooling down after rate limiting.");
  }

  const errors: string[] = [];

  for (const endpoint of MAP_POI_OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body,
      });

      if (response.ok) return response;

      if (response.status === 429) {
        overpassPausedUntil = Date.now() + MAP_POI_RATE_LIMIT_BACKOFF_MS;
      }

      errors.push(`${endpoint} returned ${response.status}`);
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `${endpoint} failed: ${error.message}`
          : `${endpoint} failed`,
      );
    }
  }

  throw new Error(
    errors.length
      ? `OpenStreetMap places are temporarily unavailable. ${errors.join("; ")}`
      : "OpenStreetMap places are temporarily unavailable.",
  );
};

const toPoiFeatureCollection = (
  data: OsmOverpassResponse,
  categories: MapPoiCategory[],
): MapPoiFeatureCollection => {
  const features = (data.elements || []).reduce<MapPoiFeature[]>((items, element) => {
    const coordinate = getElementCoordinate(element);
    const category = getElementCategory(element, categories);

    if (!coordinate || !category) return items;

    const tags = element.tags || {};
    const name = tags.name || tags["name:en"] || tags.operator || "Unnamed place";

    items.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinate,
      },
      properties: {
        id: `${element.type}-${element.id}`,
        category,
        name,
        kind: tags.tourism || tags.amenity || category,
        address: getElementAddress(tags),
      },
    });

    return items;
  }, []);

  return {
    type: "FeatureCollection",
    features,
  };
};

const mapService = {
  getCachedPointsOfInterest(
    center: [number, number],
    radius = MAP_POI_SEARCH_RADIUS_METERS,
  ): MapPoiFeatureCollection | null {
    const coveringEntry = findCoveringPoiCache(center, radius);

    return coveringEntry ? structuredClone(coveringEntry.places) : null;
  },

  async getStyle(theme: MapStyleTheme, signal?: AbortSignal): Promise<StyleSpecification> {
    const cachedStyle = styleCache.get(theme);

    if (cachedStyle) return structuredClone(cachedStyle);

    const response = await fetch(MAP_STYLE_SOURCE_URLS[theme], { signal });

    if (!response.ok) {
      throw new Error(`Failed to load ${theme} map style (${response.status}).`);
    }

    const styleText = await response.text();
    const style = JSON.parse(injectMapTilerKey(styleText)) as StyleSpecification;

    styleCache.set(theme, style);

    return structuredClone(style);
  },

  async getPointsOfInterest(
    center: [number, number],
    radius = MAP_POI_SEARCH_RADIUS_METERS,
  ): Promise<MapPoiFeatureCollection> {
    const coveringEntry = findCoveringPoiCache(center, radius);

    if (coveringEntry) return structuredClone(coveringEntry.places);

    const cacheKey = getPoiCacheKey(center, radius);
    const cachedEntry = poiCache.get(cacheKey);
    const activeRequest = poiRequests.get(cacheKey);

    if (cachedEntry && isFreshEntry(cachedEntry)) return structuredClone(cachedEntry.places);
    if (activeRequest) return structuredClone(await activeRequest);

    const query = createOverpassQuery(MAP_POI_CATEGORIES, center, radius);
    const body = new URLSearchParams({ data: query });
    const request = fetchOverpass(body)
      .then(async (response) => {
        const data = (await response.json()) as OsmOverpassResponse;
        const places = toPoiFeatureCollection(data, MAP_POI_CATEGORIES);

        poiCache.set(cacheKey, {
          key: cacheKey,
          center,
          radius,
          storedAt: Date.now(),
          places,
        });
        writeStoredPoiCache();

        return places;
      })
      .finally(() => {
        poiRequests.delete(cacheKey);
      });

    poiRequests.set(cacheKey, request);

    return structuredClone(await request);
  },
};

export default mapService;
