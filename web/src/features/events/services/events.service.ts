import { env } from "@/shared/constants";

import type { EventCategory, EventItemWithDistance, EventsPage, EventsQuery } from "../types";

type BackendEvent = {
  address?: string;
  category: EventCategory;
  city?: string;
  country: string;
  description: string;
  end_at?: string;
  id: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  price_label: string;
  source: string;
  source_url?: string;
  start_at: string;
  title: string;
  venue_name?: string;
};

type BackendEventsPage = {
  events?: BackendEvent[];
  limit: number;
  offset: number;
  total: number;
};

const toRadians = (value: number) => value * (Math.PI / 180);

const getDistanceMeters = (
  center: EventsQuery["center"],
  latitude?: number,
  longitude?: number,
) => {
  if (!center || latitude === undefined || longitude === undefined) return 0;

  const earthRadiusMeters = 6_371_000;
  const deltaLatitude = toRadians(latitude - center.latitude);
  const deltaLongitude = toRadians(longitude - center.longitude);
  const lat1 = toRadians(center.latitude);
  const lat2 = toRadians(latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
};

const buildApiUrl = (path: string, params?: URLSearchParams) => {
  const base = env.API_URL.replace(/\/$/, "");
  const query = params?.toString();

  return `${base}${path}${query ? `?${query}` : ""}`;
};

const toEventItem = (
  event: BackendEvent,
  center: EventsQuery["center"],
): EventItemWithDistance => ({
  category: event.category || "other",
  description: event.description || "Open the source for event details.",
  distanceMeters: getDistanceMeters(center, event.latitude, event.longitude),
  endDate: event.end_at,
  id: event.id,
  imageUrl: event.image_url,
  location: {
    address: event.address || event.city || event.country,
    latitude: event.latitude ?? 0,
    longitude: event.longitude ?? 0,
    name: event.venue_name || event.city || event.country,
  },
  priceLabel: event.price_label || "Check source",
  sourceLabel: event.source,
  startDate: event.start_at,
  title: event.title,
  url: event.source_url,
});

const eventsService = {
  async getEventsPage(query: EventsQuery = {}): Promise<EventsPage> {
    const page = query.page ?? 0;
    const pageSize = query.pageSize ?? 18;
    const scope = query.scope ?? "global";
    const params = new URLSearchParams({
      limit: String(pageSize),
      page: String(page),
    });

    const response = await fetch(buildApiUrl("/api/events", params), {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Events request failed (${response.status}).`);
    }

    const payload = (await response.json()) as BackendEventsPage;
    const events = (payload.events || []).map((event) => toEventItem(event, query.center));
    const nextOffset = payload.offset + payload.limit;

    return {
      events,
      nextPage: nextOffset < payload.total ? page + 1 : undefined,
      scope,
      total: payload.total,
    };
  },

  async refreshEvents() {
    const response = await fetch(buildApiUrl("/api/events/refresh"), {
      credentials: "include",
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Events refresh failed (${response.status}).`);
    }

    return response.json();
  },
};

export default eventsService;
