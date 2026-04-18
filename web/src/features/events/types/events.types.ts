export interface EventLocation {
  address: string;
  latitude: number;
  longitude: number;
  name: string;
}

export type EventCategory =
  | "art"
  | "business"
  | "community"
  | "culture"
  | "education"
  | "food"
  | "history"
  | "music"
  | "nightlife"
  | "sports"
  | "technology"
  | "wellness"
  | "other";

export interface EventItem {
  id: string;
  category: EventCategory;
  description: string;
  endDate?: string;
  imageUrl?: string;
  location: EventLocation;
  priceLabel: string;
  sourceLabel: string;
  startDate: string;
  title: string;
  url?: string;
}

export interface EventItemWithDistance extends EventItem {
  distanceMeters: number;
}

export interface EventsQuery {
  center?: {
    latitude: number;
    longitude: number;
  };
  page?: number;
  pageSize?: number;
  scope?: "global" | "nearby";
}

export interface EventsPage {
  events: EventItemWithDistance[];
  nextPage?: number;
  scope: "global" | "nearby";
  total: number;
}
