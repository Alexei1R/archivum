import { env } from "@/shared/constants";

import { EVENT_SEARCH_CITIES } from "../constants";
import type { EventCategory, EventItemWithDistance, EventsPage, EventsQuery } from "../types";

type SourcePage = {
  events: EventItemWithDistance[];
  hasMore: boolean;
  total?: number;
};

type TicketmasterImage = {
  ratio?: string;
  url?: string;
  width?: number;
};

type TicketmasterVenue = {
  address?: { line1?: string };
  city?: { name?: string };
  country?: { countryCode?: string; name?: string };
  location?: { latitude?: string; longitude?: string };
  name?: string;
};

type TicketmasterEvent = {
  _embedded?: { venues?: TicketmasterVenue[] };
  classifications?: Array<{
    genre?: { name?: string };
    segment?: { name?: string };
    subGenre?: { name?: string };
  }>;
  dates?: {
    end?: { dateTime?: string; localDate?: string; localTime?: string };
    start?: { dateTime?: string; localDate?: string; localTime?: string };
  };
  id: string;
  images?: TicketmasterImage[];
  info?: string;
  name?: string;
  pleaseNote?: string;
  priceRanges?: Array<{ currency?: string; max?: number; min?: number }>;
  url?: string;
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
  page?: { number?: number; size?: number; totalElements?: number; totalPages?: number };
};

type SerpApiDate = string | {
  start_date?: string;
  when?: string;
};

type SerpApiEvent = {
  address?: string[];
  date?: SerpApiDate;
  description?: string;
  link?: string;
  price?: string;
  thumbnail?: string;
  ticket_info?: Array<{ link?: string; link_type?: string; source?: string }>;
  time?: string;
  title?: string;
  type?: string;
  venue?: string;
};

type SerpApiResponse = {
  error?: string;
  events_results?: SerpApiEvent[];
  search_metadata?: { status?: string };
};

type WikidataBindingValue = {
  value?: string;
};

type WikidataEventBinding = {
  coord?: WikidataBindingValue;
  countryLabel?: WikidataBindingValue;
  date?: WikidataBindingValue;
  end?: WikidataBindingValue;
  event?: WikidataBindingValue;
  eventDescription?: WikidataBindingValue;
  eventLabel?: WikidataBindingValue;
  image?: WikidataBindingValue;
  locationLabel?: WikidataBindingValue;
  officialWebsite?: WikidataBindingValue;
};

type WikidataResponse = {
  results?: {
    bindings?: WikidataEventBinding[];
  };
};

const TICKETMASTER_API_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const SERPAPI_EVENTS_URL = "https://serpapi.com/search.json";
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";
const ITICKET_URLS = [
  { key: "iticket-home", url: "https://iticket.md/en" },
  { key: "iticket-events", url: "https://iticket.md/en/events/iticket" },
];
const IABILET_URL = "https://www.iabilet.ro/bilete-in-romania/";
const IABILET_SOURCE = { key: "iabilet-romania", url: IABILET_URL };

const SEARCH_COUNTRIES = [
  {
    code: "MD",
    gl: "md",
    latitude: 47.0105,
    location: "Moldova",
    longitude: 28.8323,
    name: "Moldova",
    wikidataId: "wd:Q217",
  },
  {
    code: "RO",
    gl: "ro",
    latitude: 44.4268,
    location: "Romania",
    longitude: 26.1025,
    name: "Romania",
    wikidataId: "wd:Q218",
  },
] as const;

const CATEGORY_KEYWORDS: Array<[EventCategory, string[]]> = [
  ["music", ["concert", "music", "festival", "opera", "jazz", "rock", "symphony"]],
  ["sports", ["sport", "football", "tennis", "marathon", "race", "basketball"]],
  ["business", ["business", "conference", "summit", "networking", "startup"]],
  ["technology", ["technology", "tech", "it", "software", "ai", "hackathon"]],
  ["education", ["education", "training", "workshop", "course", "lecture"]],
  ["food", ["food", "wine", "beer", "culinary", "restaurant"]],
  ["art", ["art", "gallery", "exhibition", "museum", "ballet"]],
  ["culture", ["culture", "theater", "theatre", "film", "cinema", "performance"]],
  ["nightlife", ["club", "party", "nightlife", "dj"]],
  ["wellness", ["wellness", "yoga", "fitness", "health"]],
  ["community", ["community", "charity", "volunteer", "meetup"]],
  ["history", ["history", "heritage"]],
];

const MONTHS: Record<string, number> = {
  apr: 3,
  april: 3,
  aprilie: 3,
  aug: 7,
  august: 7,
  dec: 11,
  december: 11,
  decembrie: 11,
  feb: 1,
  february: 1,
  februarie: 1,
  ian: 0,
  ianuarie: 0,
  jan: 0,
  january: 0,
  jul: 6,
  july: 6,
  iul: 6,
  iulie: 6,
  jun: 5,
  june: 5,
  iun: 5,
  iunie: 5,
  mar: 2,
  march: 2,
  martie: 2,
  may: 4,
  mai: 4,
  nov: 10,
  november: 10,
  noiembrie: 10,
  oct: 9,
  october: 9,
  octombrie: 9,
  sep: 8,
  sept: 8,
  september: 8,
  septembrie: 8,
};

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const parseNumber = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return undefined;
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

const getCategory = (...parts: Array<string | undefined>): EventCategory => {
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }

  return "other";
};

const compact = (...parts: Array<string | undefined>) =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(", ");

const simpleHash = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

const fetchHtml = async (sourceKey: string) => {
  const response = await fetch(`/__event-source/${sourceKey}`);

  if (!response.ok) throw new Error(`Failed to fetch ${sourceKey} (${response.status}).`);

  return response.text();
};

const parseEventDate = (dateText: string, timezoneOffset = "+03:00") => {
  const normalized = normalizeText(dateText).toLowerCase();
  const match = normalized.match(/(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+([a-zăâîșț]+)/i);

  if (!match) return new Date().toISOString();

  const day = Number(match[1]);
  const month = MONTHS[match[2].replace(".", "")];
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const now = new Date();
  let year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();

  if (month === undefined || !Number.isFinite(day)) return now.toISOString();

  const parsed = new Date(Date.UTC(year, month, day, 9));
  if (!yearMatch && parsed.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000) {
    year += 1;
  }

  const monthLabel = String(month + 1).padStart(2, "0");
  const dayLabel = String(day).padStart(2, "0");

  return `${year}-${monthLabel}-${dayLabel}T12:00:00${timezoneOffset}`;
};

const resolveUrl = (baseUrl: string, href?: string | null) => {
  if (!href) return undefined;

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return undefined;
  }
};

const getBestTicketmasterImage = (images?: TicketmasterImage[]) => {
  if (!images || images.length === 0) return undefined;

  return [...images].sort((left, right) => (right.width || 0) - (left.width || 0))[0]?.url;
};

const getTicketmasterPriceLabel = (ranges?: TicketmasterEvent["priceRanges"]) => {
  const range = ranges?.[0];

  if (!range) return "Check Ticketmaster";
  if (range.min === 0 && range.max === 0) return "Free";
  if (range.min !== undefined && range.max !== undefined && range.min !== range.max) {
    return `${range.min}-${range.max} ${range.currency || ""}`.trim();
  }
  if (range.min !== undefined) return `${range.min} ${range.currency || ""}`.trim();

  return "Check Ticketmaster";
};

const getIsoFromTicketmasterDate = (date?: { dateTime?: string; localDate?: string; localTime?: string }) => {
  if (date?.dateTime) return date.dateTime;
  if (date?.localDate && date.localTime) return `${date.localDate}T${date.localTime}`;
  if (date?.localDate) return `${date.localDate}T00:00:00`;

  return undefined;
};

const mapTicketmasterEvent = (
  event: TicketmasterEvent,
  center: EventsQuery["center"],
): EventItemWithDistance | null => {
  const startDate = getIsoFromTicketmasterDate(event.dates?.start);

  if (!startDate) return null;

  const venue = event._embedded?.venues?.[0];
  const latitude = parseNumber(venue?.location?.latitude);
  const longitude = parseNumber(venue?.location?.longitude);
  const segment = event.classifications?.[0]?.segment?.name;
  const genre = event.classifications?.[0]?.genre?.name;
  const subGenre = event.classifications?.[0]?.subGenre?.name;
  const city = venue?.city?.name;
  const country = venue?.country?.name || venue?.country?.countryCode;

  return {
    category: getCategory(segment, genre, subGenre, event.name),
    description: event.info || event.pleaseNote || "Open the source for event details.",
    distanceMeters: getDistanceMeters(center, latitude, longitude),
    endDate: getIsoFromTicketmasterDate(event.dates?.end),
    id: `ticketmaster:${event.id}`,
    imageUrl: getBestTicketmasterImage(event.images),
    location: {
      address: compact(venue?.address?.line1, city, country) || "Address unavailable",
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      name: venue?.name || city || country || "Venue unavailable",
    },
    priceLabel: getTicketmasterPriceLabel(event.priceRanges),
    sourceLabel: "Ticketmaster",
    startDate,
    title: event.name || "Untitled event",
    url: event.url,
  };
};

const fetchTicketmasterEvents = async (
  center: EventsQuery["center"],
  page: number,
  pageSize: number,
): Promise<SourcePage> => {
  const apiKey = env.TICKETMASTER_API_KEY?.trim();

  if (!apiKey) return { events: [], hasMore: false, total: 0 };

  const startDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const pages = await Promise.all(
    SEARCH_COUNTRIES.map(async (country) => {
      const params = new URLSearchParams({
        apikey: apiKey,
        countryCode: country.code,
        locale: "*",
        page: String(page),
        size: String(Math.min(Math.max(pageSize, 20), 100)),
        sort: "date,asc",
        startDateTime,
      });

      const response = await fetch(`${TICKETMASTER_API_BASE_URL}?${params.toString()}`);

      if (response.status === 404) return { events: [], hasMore: false, total: 0 };
      if (response.status === 401 || response.status === 403) {
        throw new Error("Ticketmaster API key is invalid or not authorized.");
      }
      if (!response.ok) throw new Error(`Ticketmaster request failed (${response.status}).`);

      const payload = (await response.json()) as TicketmasterResponse;
      const events = (payload._embedded?.events || [])
        .map((event) => mapTicketmasterEvent(event, center))
        .filter((event): event is EventItemWithDistance => Boolean(event));
      const pageNumber = payload.page?.number ?? page;
      const totalPages = payload.page?.totalPages ?? 0;

      return {
        events,
        hasMore: pageNumber + 1 < totalPages,
        total: payload.page?.totalElements ?? events.length,
      };
    }),
  );

  return {
    events: pages.flatMap((sourcePage) => sourcePage.events),
    hasMore: pages.some((sourcePage) => sourcePage.hasMore),
    total: pages.reduce((sum, sourcePage) => sum + (sourcePage.total || 0), 0),
  };
};

const getSerpApiDateText = (eventDate?: SerpApiDate) => {
  if (typeof eventDate === "string") return eventDate;

  return eventDate?.start_date || eventDate?.when;
};

const parseSerpApiDate = (eventDate?: SerpApiDate, time?: string) => {
  const dateText = getSerpApiDateText(eventDate);

  if (!dateText) return new Date().toISOString();

  const now = new Date();
  const firstDateText = dateText.split(/[–-]/)[0]?.replace(/^[A-Za-z]+,\s*/, "").trim() || dateText;
  const withYear = /\b\d{4}\b/.test(firstDateText)
    ? compact(firstDateText, time)
    : compact(firstDateText, String(now.getFullYear()), time);
  const parsed = new Date(withYear);

  if (Number.isNaN(parsed.getTime())) return now.toISOString();
  if (parsed.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    parsed.setFullYear(parsed.getFullYear() + 1);
  }

  return parsed.toISOString();
};

const getCountryFallbackLocation = (countryName: string) =>
  SEARCH_COUNTRIES.find((country) => country.name === countryName) || SEARCH_COUNTRIES[0];

const getBestCityLocation = (addressParts: string[] | undefined, countryName: string) => {
  const address = (addressParts || []).join(" ").toLowerCase();
  const city = EVENT_SEARCH_CITIES.find((searchCity) => address.includes(searchCity.name.split(",")[0].toLowerCase()));

  if (city) return city;

  return getCountryFallbackLocation(countryName);
};

const mapScrapedEvent = ({
  address,
  center,
  countryName,
  dateText,
  description,
  imageUrl,
  priceLabel,
  sourceLabel,
  text,
  title,
  url,
}: {
  address?: string;
  center: EventsQuery["center"];
  countryName: string;
  dateText: string;
  description?: string;
  imageUrl?: string;
  priceLabel?: string;
  sourceLabel: string;
  text: string;
  title: string;
  url?: string;
}): EventItemWithDistance | null => {
  const normalizedTitle = normalizeText(title);

  if (normalizedTitle.length < 4) return null;

  const location = getBestCityLocation([address || text], countryName);
  const locationName = address || location.name;
  const startDate = parseEventDate(dateText);
  const idSeed = url || `${sourceLabel}:${normalizedTitle}:${startDate}:${locationName}`;

  return {
    category: getCategory(text, normalizedTitle),
    description: description || "Open the source for event details.",
    distanceMeters: getDistanceMeters(center, location.latitude, location.longitude),
    id: `${sourceLabel.toLowerCase()}:${simpleHash(idSeed)}`,
    imageUrl,
    location: {
      address: locationName,
      latitude: location.latitude,
      longitude: location.longitude,
      name: locationName,
    },
    priceLabel: priceLabel || "Check source",
    sourceLabel,
    startDate,
    title: normalizedTitle,
    url,
  };
};

const parseIticketEvents = (
  html: string,
  center: EventsQuery["center"],
  baseUrl: string,
) => {
  const document = new DOMParser().parseFromString(html, "text/html");
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/en/event"], a[href*="/event/"]'));

  return anchors
    .map((anchor) => {
      const text = normalizeText(anchor.textContent || "");
      const dateMatch = text.match(/^(\d{1,2}(?:\s*[–-]\s*\d{1,2})?\s+[A-Za-zăâîșțĂÂÎȘȚ]+(?:\s*[–-]\s*[A-Za-zăâîșțĂÂÎȘȚ]+)?)/);
      const priceMatch = text.match(/\b(?:from|de la|от)\s+(.+)$/i);

      if (!dateMatch || text.length < 12) return null;

      const title = normalizeText(
        text
          .replace(dateMatch[0], "")
          .replace(/\b(?:from|de la|от)\s+.+$/i, ""),
      );
      const image = anchor.querySelector<HTMLImageElement>("img")?.src;

      return mapScrapedEvent({
        center,
        countryName: "Moldova",
        dateText: dateMatch[0],
        imageUrl: image ? resolveUrl(baseUrl, image) : undefined,
        priceLabel: priceMatch?.[1],
        sourceLabel: "iTicket",
        text,
        title,
        url: resolveUrl(baseUrl, anchor.getAttribute("href")),
      });
    })
    .filter((event): event is EventItemWithDistance => Boolean(event));
};

const parseIabiletEvents = (
  html: string,
  center: EventsQuery["center"],
) => {
  const document = new DOMParser().parseFromString(html, "text/html");
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/bilete-"]'));

  return anchors
    .map((anchor) => {
      const title = normalizeText(anchor.textContent || "");
      const container = anchor.closest("article, li, .event, .event-item, .eventBox, .card") || anchor.parentElement;
      const text = normalizeText(container?.textContent || anchor.textContent || "");
      const dateMatch = text.match(/(\d{1,2}\s+[A-Za-zăâîșțĂÂÎȘȚ]{3,}|\d{1,2}\s+[A-Za-zăâîșțĂÂÎȘȚ]{3,}\s+'?\d{2})/);
      const priceMatch = text.match(/\b(?:de la|începând cu|incepand cu)\s+([0-9^{}\s,.]+lei)/i);
      const image = container?.querySelector<HTMLImageElement>("img")?.src;

      if (!dateMatch || title.length < 4 || title.toLowerCase() === "ia bilet") return null;

      return mapScrapedEvent({
        center,
        countryName: "Romania",
        dateText: dateMatch[0],
        description: text,
        imageUrl: image ? resolveUrl(IABILET_URL, image) : undefined,
        priceLabel: priceMatch?.[1]?.replace(/[{}^]/g, "").trim(),
        sourceLabel: "iaBilet",
        text,
        title,
        url: resolveUrl(IABILET_URL, anchor.getAttribute("href")),
      });
    })
    .filter((event): event is EventItemWithDistance => Boolean(event));
};

const fetchScrapedPlatformEvents = async (
  center: EventsQuery["center"],
  page: number,
  pageSize: number,
): Promise<SourcePage> => {
  const pages = await Promise.allSettled([
    ...ITICKET_URLS.map(async (source) => parseIticketEvents(await fetchHtml(source.key), center, source.url)),
    (async () => parseIabiletEvents(await fetchHtml(IABILET_SOURCE.key), center))(),
  ]);
  const events = dedupeEvents(
    pages
      .filter((result): result is PromiseFulfilledResult<EventItemWithDistance[]> => result.status === "fulfilled")
      .flatMap((result) => result.value),
  );
  const start = page * pageSize;
  const end = start + pageSize;

  if (events.length === 0 && pages.every((result) => result.status === "rejected")) {
    const firstFailure = pages[0] as PromiseRejectedResult;
    throw new Error(firstFailure.reason instanceof Error ? firstFailure.reason.message : "Event platform pages could not be loaded.");
  }

  return {
    events: events.slice(start, end),
    hasMore: end < events.length,
    total: events.length,
  };
};

const mapSerpApiEvent = (
  event: SerpApiEvent,
  center: EventsQuery["center"],
  countryName: string,
): EventItemWithDistance | null => {
  if (!event.title) return null;

  const location = getBestCityLocation(event.address, countryName);
  const ticketLink = event.ticket_info?.find((ticket) => ticket.link_type === "tickets")?.link;
  const sourceName = event.ticket_info?.[0]?.source?.replace(/\s*from\s+.*/i, "");
  const startDate = parseSerpApiDate(event.date, event.time);
  const locationName = event.venue || event.address?.[0] || location.name;
  const address = event.address?.join(", ") || location.name;
  const idSeed = event.link || `${event.title}:${startDate}:${address}`;

  return {
    category: getCategory(event.type, event.title, event.description),
    description: event.description || event.type || "Open the source for event details.",
    distanceMeters: getDistanceMeters(center, location.latitude, location.longitude),
    id: `google-events:${simpleHash(idSeed)}`,
    imageUrl: event.thumbnail,
    location: {
      address,
      latitude: location.latitude,
      longitude: location.longitude,
      name: locationName,
    },
    priceLabel: event.price || event.ticket_info?.[0]?.source || "Check source",
    sourceLabel: sourceName || "Google Events",
    startDate,
    title: event.title,
    url: ticketLink || event.link,
  };
};

const fetchSerpApiEvents = async (
  center: EventsQuery["center"],
  page: number,
): Promise<SourcePage> => {
  const apiKey = env.SERPAPI_KEY?.trim();

  if (!apiKey) return { events: [], hasMore: false, total: 0 };

  const pages = await Promise.all(
    SEARCH_COUNTRIES.map(async (country) => {
      const params = new URLSearchParams({
        api_key: apiKey,
        engine: "google_events",
        gl: country.gl,
        hl: "en",
        location: country.location,
        q: `Events in ${country.name}`,
        start: String(page * 10),
      });

      const response = await fetch(`${SERPAPI_EVENTS_URL}?${params.toString()}`);

      if (!response.ok) throw new Error(`SerpApi request failed (${response.status}).`);

      const payload = (await response.json()) as SerpApiResponse;

      if (payload.error) throw new Error(payload.error);

      const events = (payload.events_results || [])
        .map((event) => mapSerpApiEvent(event, center, country.name))
        .filter((event): event is EventItemWithDistance => Boolean(event));

      return {
        events,
        hasMore: events.length >= 10,
        total: events.length,
      };
    }),
  );

  return {
    events: pages.flatMap((sourcePage) => sourcePage.events),
    hasMore: pages.some((sourcePage) => sourcePage.hasMore),
    total: pages.reduce((sum, sourcePage) => sum + (sourcePage.total || 0), 0),
  };
};

const parseWikidataPoint = (value?: string) => {
  const match = value?.match(/^Point\(([-\d.]+) ([-\d.]+)\)$/);

  if (!match) return {};

  return {
    latitude: parseNumber(match[2]),
    longitude: parseNumber(match[1]),
  };
};

const buildWikidataQuery = (page: number, pageSize: number) => {
  const offset = page * pageSize;
  const now = new Date().toISOString();

  return `
    SELECT ?event ?eventLabel ?eventDescription ?date ?end ?coord ?image ?officialWebsite ?locationLabel ?countryLabel WHERE {
      VALUES ?country { ${SEARCH_COUNTRIES.map((country) => country.wikidataId).join(" ")} }
      VALUES ?eventType { wd:Q1656682 wd:Q132241 wd:Q868557 wd:Q182832 wd:Q1190554 }
      ?event wdt:P17 ?country;
             wdt:P31/wdt:P279* ?eventType.
      OPTIONAL { ?event wdt:P585 ?pointInTime. }
      OPTIONAL { ?event wdt:P580 ?startTime. }
      BIND(COALESCE(?startTime, ?pointInTime) AS ?date)
      FILTER(BOUND(?date))
      FILTER(?date >= "${now}"^^xsd:dateTime)
      OPTIONAL { ?event wdt:P582 ?end. }
      OPTIONAL { ?event wdt:P625 ?eventCoord. }
      OPTIONAL { ?event wdt:P276 ?location. }
      OPTIONAL { ?location wdt:P625 ?locationCoord. }
      BIND(COALESCE(?eventCoord, ?locationCoord) AS ?coord)
      OPTIONAL { ?event wdt:P18 ?image. }
      OPTIONAL { ?event wdt:P856 ?officialWebsite. }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en,ro,ru,md".
        ?event rdfs:label ?eventLabel.
        ?event schema:description ?eventDescription.
        ?location rdfs:label ?locationLabel.
        ?country rdfs:label ?countryLabel.
      }
    }
    ORDER BY ?date
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;
};

const mapWikidataEvent = (
  event: WikidataEventBinding,
  center: EventsQuery["center"],
): EventItemWithDistance | null => {
  const startDate = event.date?.value;
  const eventUrl = event.event?.value;
  const title = event.eventLabel?.value;

  if (!startDate || !eventUrl || !title) return null;

  const coordinates = parseWikidataPoint(event.coord?.value);
  const countryLocation = getCountryFallbackLocation(event.countryLabel?.value || "Moldova");
  const latitude = coordinates.latitude ?? countryLocation.latitude;
  const longitude = coordinates.longitude ?? countryLocation.longitude;
  const locationName = event.locationLabel?.value || event.countryLabel?.value || countryLocation.name;

  return {
    category: getCategory(title, event.eventDescription?.value),
    description: event.eventDescription?.value || "Open the source for event details.",
    distanceMeters: getDistanceMeters(center, latitude, longitude),
    endDate: event.end?.value,
    id: `wikidata:${eventUrl.split("/").pop() || simpleHash(eventUrl)}`,
    imageUrl: event.image?.value,
    location: {
      address: locationName,
      latitude,
      longitude,
      name: locationName,
    },
    priceLabel: "Check source",
    sourceLabel: "Wikidata",
    startDate,
    title,
    url: event.officialWebsite?.value || eventUrl,
  };
};

const fetchWikidataEvents = async (
  center: EventsQuery["center"],
  page: number,
  pageSize: number,
): Promise<SourcePage> => {
  const params = new URLSearchParams({
    format: "json",
    query: buildWikidataQuery(page, pageSize),
  });

  const response = await fetch(`${WIKIDATA_SPARQL_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) throw new Error(`Wikidata request failed (${response.status}).`);

  const payload = (await response.json()) as WikidataResponse;
  const events = (payload.results?.bindings || [])
    .map((event) => mapWikidataEvent(event, center))
    .filter((event): event is EventItemWithDistance => Boolean(event));

  return {
    events,
    hasMore: events.length >= pageSize,
    total: events.length,
  };
};

const dedupeEvents = (events: EventItemWithDistance[]) => {
  const uniqueEvents = new Map<string, EventItemWithDistance>();

  for (const event of events) {
    const dedupeKey = `${event.title.toLowerCase()}:${event.startDate.slice(0, 10)}:${event.location.name.toLowerCase()}`;
    const existing = uniqueEvents.get(dedupeKey);

    if (!existing || (event.imageUrl && !existing.imageUrl)) {
      uniqueEvents.set(dedupeKey, event);
    }
  }

  return Array.from(uniqueEvents.values()).sort((left, right) => {
    const dateDelta = new Date(left.startDate).getTime() - new Date(right.startDate).getTime();

    return dateDelta || left.distanceMeters - right.distanceMeters;
  });
};

const eventsService = {
  async getEventsPage(query: EventsQuery = {}): Promise<EventsPage> {
    const page = query.page ?? 0;
    const pageSize = query.pageSize ?? 18;
    const scope = query.scope ?? "global";
    const sourceResults = await Promise.allSettled([
      fetchScrapedPlatformEvents(query.center, page, pageSize),
      fetchSerpApiEvents(query.center, page),
      fetchTicketmasterEvents(query.center, page, pageSize),
      fetchWikidataEvents(query.center, page, pageSize),
    ]);
    const fulfilledPages = sourceResults
      .filter((result): result is PromiseFulfilledResult<SourcePage> => result.status === "fulfilled")
      .map((result) => result.value);
    const sourceFailures = sourceResults.filter((result) => result.status === "rejected");

    if (fulfilledPages.length === 0 && sourceFailures.length > 0) {
      const firstFailure = sourceFailures[0] as PromiseRejectedResult;
      throw new Error(firstFailure.reason instanceof Error ? firstFailure.reason.message : "Events could not be loaded.");
    }

    const events = dedupeEvents(fulfilledPages.flatMap((sourcePage) => sourcePage.events));
    const hasMore = fulfilledPages.some((sourcePage) => sourcePage.hasMore);

    return {
      events,
      nextPage: hasMore ? page + 1 : undefined,
      scope,
      total: fulfilledPages.reduce((sum, sourcePage) => sum + (sourcePage.total || 0), events.length),
    };
  },
};

export default eventsService;
