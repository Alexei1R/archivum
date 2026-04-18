import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import { EVENTS_DEFAULT_CENTER } from "../constants";
import { eventsService } from "../services";
import type { EventItemWithDistance, EventsPage, EventsQuery } from "../types";

const EVENTS_PAGE_SIZE = 18;

type EventsPageParam = {
  page: number;
  scope: "global" | "nearby";
};

type EventsQueryKey = ["events", EventsQuery["center"]];

const useEvents = () => {
  const [query, setQuery] = useState<EventsQuery>({
    center: EVENTS_DEFAULT_CENTER,
    scope: "global",
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setQuery({
          center: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          scope: "global",
        });
      },
      () => undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 8000,
      },
    );
  }, []);

  const eventsQuery = useInfiniteQuery<
    EventsPage,
    Error,
    InfiniteData<EventsPage>,
    EventsQueryKey,
    EventsPageParam
  >({
    queryKey: ["events", query.center],
    initialPageParam: { page: 0, scope: "global" },
    queryFn: ({ pageParam }) =>
      eventsService.getEventsPage({
        ...query,
        page: pageParam.page,
        pageSize: EVENTS_PAGE_SIZE,
        scope: pageParam.scope,
      }),
    getNextPageParam: (lastPage) => {
      if (typeof lastPage.nextPage === "number") {
        return {
          page: lastPage.nextPage,
          scope: lastPage.scope,
        };
      }

      return undefined;
    },
  });

  const events = useMemo(
    () => {
      const uniqueEvents = new Map<string, EventItemWithDistance>();

      for (const page of eventsQuery.data?.pages || []) {
        for (const event of page.events) {
          uniqueEvents.set(event.id, event);
        }
      }

      return Array.from(uniqueEvents.values());
    },
    [eventsQuery.data],
  );

  return {
    error: eventsQuery.error instanceof Error
      ? eventsQuery.error.message
      : eventsQuery.error
        ? "Events could not be loaded."
        : null,
    events,
    fetchNextPage: eventsQuery.fetchNextPage,
    hasNextPage: eventsQuery.hasNextPage,
    isFetchingNextPage: eventsQuery.isFetchingNextPage,
    isLoading: eventsQuery.isLoading,
  };
};

export default useEvents;
