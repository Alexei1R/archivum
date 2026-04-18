export type RoutePlanStopKind = "place";

export interface RoutePlanStop {
  address: string;
  id: string;
  kind: RoutePlanStopKind;
  latitude: number;
  longitude: number;
  title: string;
}
