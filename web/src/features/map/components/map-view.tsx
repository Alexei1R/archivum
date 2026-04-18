import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, NavigationControl, ScaleControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/shared/components";

import {
  MAP_CAMERA_STORAGE_KEY,
  MAP_DEFAULT_VIEW,
  type MapStyleTheme,
} from "../constants";
import { mapService } from "../services";
import MapPoiLayer from "./map-poi-layer";

const getSystemMapTheme = (): MapStyleTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredCamera = () => {
  try {
    const raw = window.localStorage.getItem(MAP_CAMERA_STORAGE_KEY);

    if (!raw) return null;

    const camera = JSON.parse(raw) as {
      bearing?: number;
      center?: [number, number];
      pitch?: number;
      zoom?: number;
    };

    if (
      !Array.isArray(camera.center) ||
      typeof camera.center[0] !== "number" ||
      typeof camera.center[1] !== "number" ||
      typeof camera.zoom !== "number"
    ) {
      return null;
    }

    return camera;
  } catch {
    window.localStorage.removeItem(MAP_CAMERA_STORAGE_KEY);
    return null;
  }
};

const storeCamera = (map: Map) => {
  const center = map.getCenter();

  try {
    window.localStorage.setItem(
      MAP_CAMERA_STORAGE_KEY,
      JSON.stringify({
        bearing: map.getBearing(),
        center: [center.lng, center.lat],
        pitch: map.getPitch(),
        zoom: map.getZoom(),
      }),
    );
  } catch {
    // Camera restore is a convenience; ignore storage failures.
  }
};

const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [systemMapTheme, setSystemMapTheme] = useState<MapStyleTheme>(() =>
    typeof window === "undefined" ? "light" : getSystemMapTheme(),
  );
  const mapTheme: MapStyleTheme = theme === "system" ? systemMapTheme : theme;

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemMapTheme(getSystemMapTheme());

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const abortController = new AbortController();

    const loadMapStyle = async () => {
      try {
        setError(null);
        const style = await mapService.getStyle(mapTheme, abortController.signal);

        if (!containerRef.current || abortController.signal.aborted) return;

        const existingMap = mapRef.current;

        if (existingMap) {
          setIsReady(false);
          existingMap.setStyle(style);
          existingMap.once("style.load", () => setIsReady(true));
          return;
        }

        setIsReady(false);
        const storedCamera = getStoredCamera();

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: storedCamera?.center || MAP_DEFAULT_VIEW.center,
          zoom: storedCamera?.zoom || MAP_DEFAULT_VIEW.zoom,
          pitch: storedCamera?.pitch || MAP_DEFAULT_VIEW.pitch,
          bearing: storedCamera?.bearing || MAP_DEFAULT_VIEW.bearing,
          attributionControl: {
            compact: true,
          },
        });

        map.addControl(
          new NavigationControl({
            visualizePitch: true,
          }),
          "top-right",
        );
        map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

        map.on("load", () => {
          setIsReady(true);
        });

        map.on("moveend", () => {
          storeCamera(map);
        });

        map.on("error", (event) => {
          const message =
            event.error?.message || "The map style or tiles could not be loaded.";
          setError(message);
        });

        mapRef.current = map;
        setMapInstance(map);
      } catch (error) {
        if (abortController.signal.aborted) return;

        setError(error instanceof Error ? error.message : "The map could not be loaded.");
      }
    };

    void loadMapStyle();

    return () => {
      abortController.abort();
    };
  }, [mapTheme]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="map-view" aria-label="City map">
      <div ref={containerRef} className="map-view__canvas" />

      <MapPoiLayer isReady={isReady} map={mapInstance} />

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
