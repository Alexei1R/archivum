import { env } from "@/shared/constants";

import type { EventsPage, EventsQuery } from "../types";

const EVENTBRITE_SEARCH_UNAVAILABLE =
  "Eventbrite credentials are valid, but Eventbrite no longer exposes public city event search through /v3/events/search/.";

const eventsService = {
  async getEventsPage(query: EventsQuery = {}): Promise<EventsPage> {
    void query;
    const token = env.EVENTBRITE_TOKEN?.trim();

    if (!token) {
      throw new Error("Set VITE_EVENTBRITE_TOKEN to load Eventbrite events.");
    }

    return Promise.reject(new Error(EVENTBRITE_SEARCH_UNAVAILABLE));
  },
};

export default eventsService;
