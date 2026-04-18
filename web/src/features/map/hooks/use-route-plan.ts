import { useMemo } from "react";

import { useMapStore } from "../store";
import { uniqueStops } from "../utils";

const useRoutePlan = () => {
  const manualRouteStops = useMapStore((state) => state.manualRouteStops);
  const clearManualRouteStops = useMapStore((state) => state.clearManualRouteStops);
  const toggleManualRouteStop = useMapStore((state) => state.toggleManualRouteStop);

  const plannedStops = useMemo(
    () => uniqueStops(manualRouteStops),
    [manualRouteStops],
  );

  const plannedStopIds = useMemo(
    () => plannedStops.map((stop) => stop.id),
    [plannedStops],
  );

  return {
    clearManualRouteStops,
    manualRouteStopCount: manualRouteStops.length,
    plannedStopIds,
    plannedStops,
    toggleManualRouteStop,
  };
};

export default useRoutePlan;
