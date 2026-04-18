import { create } from "zustand";

import type { RoutePlanStop } from "../types";

interface MapStore {
  manualRouteStops: RoutePlanStop[];
  clearManualRouteStops: () => void;
  toggleManualRouteStop: (stop: RoutePlanStop) => void;
}

const useMapStore = create<MapStore>((set) => ({
  manualRouteStops: [],

  clearManualRouteStops: () => set({ manualRouteStops: [] }),

  toggleManualRouteStop: (stop) => {
    set((state) => ({
      manualRouteStops: state.manualRouteStops.some((item) => item.id === stop.id)
        ? state.manualRouteStops.filter((item) => item.id !== stop.id)
        : [...state.manualRouteStops, stop],
    }));
  },
}));

export default useMapStore;
