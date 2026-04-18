import type { Feature, FeatureCollection, Point } from "geojson";

export type MapPoiCategoryId =
  | "museum"
  | "gallery"
  | "artwork"
  | "arts"
  | "cathedral"
  | "church"
  | "placeOfWorship";

export interface MapPoiCategory {
  id: MapPoiCategoryId;
  label: string;
  colorVariable: string;
  osmTags: Array<{
    key: string;
    value: string;
  }>;
}

export interface MapPoiProperties {
  id: string;
  category: MapPoiCategoryId;
  name: string;
  kind: string;
  address?: string;
}

export type MapPoiFeature = Feature<Point, MapPoiProperties>;

export type MapPoiFeatureCollection = FeatureCollection<Point, MapPoiProperties>;

export interface OsmPoiElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

export interface OsmOverpassResponse {
  elements?: OsmPoiElement[];
}
