import type { RoutePlanStop } from "../types";

export const uniqueStops = (stops: RoutePlanStop[]) => {
  const stopsById = new Map<string, RoutePlanStop>();

  stops.forEach((stop) => stopsById.set(stop.id, stop));

  return Array.from(stopsById.values());
};
