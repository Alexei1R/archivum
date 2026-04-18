import { env } from "@/shared/constants";

import type { EventItemWithDistance, EventsPage, EventsQuery } from "../types";

type EventbriteCost = {
  display?: string;
  major_value?: string;
};

type EventbriteTicketClass = {
  cost?: EventbriteCost;
  free?: boolean;
};

type EventbriteVenueAddress = {
  address_1?: string;
  city?: string;
};

type EventbriteVenue = {
  address?: EventbriteVenueAddress;
  latitude?: string;
  longitude?: string;
  name?: string;
};

type EventbriteEvent = {
  description?: { text?: string };
  id: string;
  logo?: {
    original?: { url?: string };
    url?: string;
  };
  name?: { text?: string };
  start?: { local?: string; utc?: string };
  summary?: string;
  ticket_classes?: EventbriteTicketClass[];
  url?: string;
  venue?: EventbriteVenue;
};

type EventbriteOwnedEventsResponse = {
  events?: EventbriteEvent[];
  pagination?: {
    has_more_items?: boolean;
    object_count?: number;
    page_number?: number;
  };
};

type EventbriteOrganization = {
  id?: string;
};

type EventbriteOrganizationsResponse = {
  organizations?: EventbriteOrganization[];
};

type EventbriteApiErrorResponse = {
  error?: string;
  error_description?: string;
  status_code?: number;
};

type EventbriteApiResult<T> = {
  data?: T;
  errorDescription?: string;
  ok: boolean;
  status: number;
};

const EVENTBRITE_API_BASE_URL = "https://www.eventbriteapi.com/v3";
let cachedOrganizationId: string | null | undefined;
let cachedNoAccessibleEvents = false;

type PublicSnapshotEvent = {
  address: string;
  id: string;
  locationName: string;
  priceLabel: string;
  startDate: string;
  title: string;
  url?: string;
};

const PUBLIC_SNAPSHOT_EVENTS: PublicSnapshotEvent[] = [
  {
    id: "public-calm-chaos-cancer",
    title: "CALM the Chaos of Cancer™",
    startDate: "2026-04-18T20:00:00+03:00",
    locationName: "Online",
    address: "Online",
    priceLabel: "Free",
  },
  {
    id: "public-victor-patrascan-chisinau",
    title: "Stand up Comedy in broken English • Victor Patrascan in Chisinau",
    startDate: "2026-05-01T20:00:00+03:00",
    locationName: "Chișinău",
    address: "Mihai Eminescu National Theatre",
    priceLabel: "From €10.00",
  },
  {
    id: "public-istqb-foundation-chisinau",
    title: "ISTQB® Foundation Exam and Training Course (in English) - Chisinau",
    startDate: "2026-04-27T09:00:00+03:00",
    locationName: "Chisinau",
    address: "Chisinau",
    priceLabel: "From €373.27",
  },
  {
    id: "public-title-tiraspol",
    title: "Title",
    startDate: "2026-04-25T10:00:00+03:00",
    locationName: "Тирасполь",
    address: "Тирасполь",
    priceLabel: "From $12.57",
  },
  {
    id: "public-love-hurts-iasi",
    title: "LOVE HURTS (2025, 1h 34m) + Q&A",
    startDate: "2026-05-07T19:00:00+03:00",
    locationName: "Iași",
    address: "Luceafărul Theatre",
    priceLabel: "Free",
  },
  {
    id: "public-green-light-iasi",
    title: "GREEN LIGHT (2025, 1h 40m) + Q&A",
    startDate: "2026-05-08T19:00:00+03:00",
    locationName: "Iași",
    address: "Luceafărul Theatre",
    priceLabel: "Free",
  },
  {
    id: "public-hold-onto-me-iasi",
    title: "HOLD ONTO ME (2025, 1h 42m)",
    startDate: "2026-05-09T19:00:00+03:00",
    locationName: "Iași",
    address: "Luceafărul Theatre",
    priceLabel: "Free",
  },
  {
    id: "public-love-remains-iasi",
    title: "THE LOVE THAT REMAINS (2025, 1h 49m)",
    startDate: "2026-05-10T19:00:00+03:00",
    locationName: "Iași",
    address: "Luceafărul Theatre",
    priceLabel: "Free",
  },
  {
    id: "public-family-rmhffest-teatrul",
    title: "FAMILY RMHFFest / Teatrul de Joacă",
    startDate: "2026-05-10T16:00:00+03:00",
    locationName: "Iași",
    address: "Palas Mall",
    priceLabel: "Free",
  },
  {
    id: "public-class-emotii-fotografie",
    title: "CLASS: EMOȚII ȘI FOTOGRAFIE / Raluca Munteanu & Andrei Postolache",
    startDate: "2026-05-09T15:00:00+03:00",
    locationName: "Iași",
    address: "Zbor Hub Iași",
    priceLabel: "Free",
  },
  {
    id: "public-class-biografia-cuplurilor",
    title: "CLASS: BIOGRAFIA CUPLURILOR: ARTIȘTI / Ioana Marinescu",
    startDate: "2026-05-10T12:00:00+03:00",
    locationName: "Iași",
    address: "FAR coworking",
    priceLabel: "Free",
  },
  {
    id: "public-odoo-business-show-iasi",
    title: "Odoo Business Show Iasi",
    startDate: "2026-05-28T18:00:00+03:00",
    locationName: "Iași",
    address: "Hotel International",
    priceLabel: "Free",
  },
  {
    id: "public-family-rmhffest-bunastarea",
    title: "FAMILY RMHFFest / Bunăstarea Mamelor",
    startDate: "2026-05-10T11:30:00+03:00",
    locationName: "Iași",
    address: "Palas Campus",
    priceLabel: "Free",
  },
  {
    id: "public-cum-prinzi-radacini",
    title: "Cum prinzi rădăcini? - cu Carmen Manea",
    startDate: "2026-04-29T18:00:00+03:00",
    locationName: "Iași",
    address: "Bistro La noi",
    priceLabel: "Free",
  },
  {
    id: "public-class-ce-as-fi-vrut",
    title: "CLASS: CE AȘ FI VRUT SĂ ȘTIU MAI DEVREME / Gianina Cărbunariu",
    startDate: "2026-05-09T12:00:00+03:00",
    locationName: "Iași",
    address: "Institutul Francez din România",
    priceLabel: "Free",
  },
  {
    id: "public-shorts-session-2",
    title: "SHORTS RMHFFest / Session 2 (1h 23m)",
    startDate: "2026-05-10T14:00:00+03:00",
    locationName: "Iași",
    address: "Strada Costache Negruzzi 7-9",
    priceLabel: "Free",
  },
  {
    id: "public-shorts-session-1",
    title: "SHORTS RMHFFest / Session 1 (1h 33m)",
    startDate: "2026-05-10T12:00:00+03:00",
    locationName: "Iași",
    address: "Strada Costache Negruzzi 7-9",
    priceLabel: "Free",
  },
  {
    id: "public-class-despre-adoptie",
    title: "CLASS: DESPRE ADOPȚIE. POVESTE ȘI PAȘI / Anca Gheorghică",
    startDate: "2026-05-08T12:00:00+03:00",
    locationName: "Iași",
    address: "Cuib",
    priceLabel: "Free",
  },
  {
    id: "public-dialog-migratie",
    title: "DIALOG/ Între două lumi: Despre costul emoțional al migrației",
    startDate: "2026-05-08T16:30:00+03:00",
    locationName: "Iași",
    address: "Muzeul Vasile Pogor",
    priceLabel: "Free",
  },
  {
    id: "public-dialog-arta",
    title: "DIALOG/ Arta: Între libertate și disconfort",
    startDate: "2026-05-09T16:30:00+03:00",
    locationName: "Iași",
    address: "Muzeul Vasile Pogor",
    priceLabel: "Free",
  },
  {
    id: "public-dialog-bunastarea",
    title: "DIALOG / Bunăstarea noastră: Între individualism și solidaritate",
    startDate: "2026-05-10T16:30:00+03:00",
    locationName: "Iași",
    address: "Muzeul Vasile Pogor",
    priceLabel: "Free",
  },
];

const buildEventbriteUrl = (path: string, params?: URLSearchParams) => {
  const base = `${EVENTBRITE_API_BASE_URL}${path}`;
  return params ? `${base}?${params.toString()}` : base;
};

const requestEventbrite = async <T>(
  token: string,
  path: string,
  params?: URLSearchParams,
): Promise<EventbriteApiResult<T>> => {
  const response = await fetch(buildEventbriteUrl(path, params), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & EventbriteApiErrorResponse;

  return {
    data: response.ok ? (payload as T) : undefined,
    errorDescription: payload.error_description,
    ok: response.ok,
    status: response.status,
  };
};

const parseNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
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

const getPriceLabel = (ticketClasses?: EventbriteTicketClass[]) => {
  if (!ticketClasses || ticketClasses.length === 0) return "Check Eventbrite";

  const freeTicket = ticketClasses.find((ticketClass) => ticketClass.free);
  if (freeTicket) return "Free";

  for (const ticketClass of ticketClasses) {
    if (ticketClass.cost?.display) return ticketClass.cost.display;
    if (ticketClass.cost?.major_value) return `${ticketClass.cost.major_value}`;
  }

  return "Paid";
};

const PUBLIC_LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  "Chișinău": { latitude: 47.0105, longitude: 28.8323 },
  "Chisinau": { latitude: 47.0105, longitude: 28.8323 },
  "Тирасполь": { latitude: 46.8482, longitude: 29.5968 },
  "Iași": { latitude: 47.1585, longitude: 27.6014 },
  "Online": { latitude: 47.0105, longitude: 28.8323 },
};

const getPublicSnapshotEventsPage = (
  query: EventsQuery,
  page: number,
  pageSize: number,
  scope: "global" | "nearby",
): EventsPage => {
  const mapped: EventItemWithDistance[] = PUBLIC_SNAPSHOT_EVENTS.map((item) => {
    const coordinates = PUBLIC_LOCATION_COORDINATES[item.locationName] || {
      latitude: 47.0105,
      longitude: 28.8323,
    };

    return {
      id: item.id,
      category: "other",
      description: "Imported from Eventbrite public website listing snapshot.",
      distanceMeters: getDistanceMeters(query.center, coordinates.latitude, coordinates.longitude),
      location: {
        address: item.address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: item.locationName,
      },
      priceLabel: item.priceLabel,
      sourceLabel: "Eventbrite Public Snapshot",
      startDate: item.startDate,
      title: item.title,
      url: item.url,
    };
  });

  const start = page * pageSize;
  const end = start + pageSize;

  return {
    events: mapped.slice(start, end),
    nextPage: end < mapped.length ? page + 1 : undefined,
    scope,
    total: mapped.length,
  };
};

const toEventItem = (event: EventbriteEvent, center: EventsQuery["center"]) => {
  const latitude = parseNumber(event.venue?.latitude);
  const longitude = parseNumber(event.venue?.longitude);
  const startDate = event.start?.local || event.start?.utc;

  if (!startDate) return null;

  const title = event.name?.text || "Untitled event";
  const description = event.description?.text || event.summary || "No description provided.";

  return {
    id: event.id,
    category: "other" as const,
    description,
    distanceMeters: getDistanceMeters(center, latitude, longitude),
    imageUrl: event.logo?.original?.url || event.logo?.url,
    location: {
      address: event.venue?.address?.address_1 || event.venue?.address?.city || "Address unavailable",
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      name: event.venue?.name || event.venue?.address?.city || "Venue unavailable",
    },
    priceLabel: getPriceLabel(event.ticket_classes),
    sourceLabel: "Eventbrite",
    startDate,
    title,
    url: event.url,
  };
};

const eventsService = {
  async getEventsPage(query: EventsQuery = {}): Promise<EventsPage> {
    const token = env.EVENTBRITE_TOKEN?.trim();

    if (!token) {
      throw new Error("Set VITE_EVENTBRITE_TOKEN to load Eventbrite events.");
    }

    const page = query.page ?? 0;
    const pageSize = query.pageSize ?? 18;
    const scope = query.scope ?? "nearby";
    const requestPage = page + 1;

    if (cachedNoAccessibleEvents) {
      return getPublicSnapshotEventsPage(query, page, pageSize, scope);
    }

    const listParams = new URLSearchParams({
      page: String(requestPage),
      page_size: String(pageSize),
      expand: "venue,ticket_classes",
    });

    let organizationIds: string[] = [];
    if (cachedOrganizationId) {
      organizationIds = [cachedOrganizationId];
    } else {
      const orgsResult = await requestEventbrite<EventbriteOrganizationsResponse>(token, "/users/me/organizations/");

      if (!orgsResult.ok) {
        if (orgsResult.status === 401 || orgsResult.status === 403) {
          throw new Error("Eventbrite token is invalid or expired.");
        }

        if (orgsResult.status === 429) {
          throw new Error("Eventbrite rate limit reached. Please try again shortly.");
        }

        throw new Error(orgsResult.errorDescription || "Eventbrite organizations request failed.");
      }

      organizationIds = (orgsResult.data?.organizations || [])
        .map((organization) => organization.id)
        .filter((id): id is string => Boolean(id));

      if (organizationIds.length === 0) {
        cachedNoAccessibleEvents = true;
        cachedOrganizationId = null;
        return getPublicSnapshotEventsPage(query, page, pageSize, scope);
      }
    }

    let payload: EventbriteOwnedEventsResponse | null = null;
    let lastError: string | null = null;

    for (const organizationId of organizationIds) {
      const result = await requestEventbrite<EventbriteOwnedEventsResponse>(
        token,
        `/organizations/${organizationId}/events/`,
        listParams,
      );

      if (result.ok) {
        payload = result.data || { events: [], pagination: { object_count: 0 } };
        cachedOrganizationId = organizationId;
        break;
      }

      if (result.status === 401 || result.status === 403) {
        throw new Error("Eventbrite token is invalid or does not grant organization event access.");
      }

      if (result.status === 429) {
        throw new Error("Eventbrite rate limit reached. Please try again shortly.");
      }

      lastError = result.errorDescription || "Eventbrite events request failed.";
    }

    if (!payload) {
      cachedNoAccessibleEvents = true;
      cachedOrganizationId = null;

      if (lastError) {
        return getPublicSnapshotEventsPage(query, page, pageSize, scope);
      }

      return getPublicSnapshotEventsPage(query, page, pageSize, scope);
    }

    const mappedEvents = (payload.events || [])
      .map((event) => toEventItem(event, query.center))
      .filter((event): event is NonNullable<ReturnType<typeof toEventItem>> => Boolean(event))
      .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());

    const hasMore = payload.pagination?.has_more_items === true;

    return {
      events: mappedEvents,
      nextPage: hasMore ? page + 1 : undefined,
      scope,
      total: payload.pagination?.object_count ?? mappedEvents.length,
    };
  },
};

export default eventsService;
