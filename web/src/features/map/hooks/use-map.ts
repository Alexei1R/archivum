import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
} from "maplibre-gl";

import { useTheme } from "@/shared/components";

import {
  MAP_CAMERA_STORAGE_KEY,
  MAP_DEFAULT_VIEW,
  type MapStyleTheme,
} from "../constants";
import { mapService } from "../services";

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

const storeCamera = (map: MapLibreMap) => {
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

const useMap = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
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
        const nextMap = new maplibregl.Map({
          attributionControl: {
            compact: true,
          },
          bearing: storedCamera?.bearing || MAP_DEFAULT_VIEW.bearing,
          center: storedCamera?.center || MAP_DEFAULT_VIEW.center,
          container: containerRef.current,
          pitch: storedCamera?.pitch || MAP_DEFAULT_VIEW.pitch,
          style,
          zoom: storedCamera?.zoom || MAP_DEFAULT_VIEW.zoom,
        });

        nextMap.addControl(
          new NavigationControl({
            visualizePitch: true,
          }),
          "top-right",
        );
        nextMap.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

        nextMap.on("load", () => {
          setIsReady(true);
        });

        nextMap.on("moveend", () => {
          storeCamera(nextMap);
        });

        nextMap.on("error", (event) => {
          const message =
            event.error?.message || "The map style or tiles could not be loaded.";
          setError(message);
        });

        mapRef.current = nextMap;
        setMap(nextMap);
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

  return {
    containerRef,
    error,
    isReady,
    map,
  };
};

export default useMap;
