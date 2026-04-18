import { useEffect, useRef } from "react";

import EventCard from "./event-card";
import type { EventItemWithDistance } from "../types";

interface EventsListProps {
  events: EventItemWithDistance[];
  hasNextPage: boolean;
  isLiked: (eventId: string) => boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onSelect: (event: EventItemWithDistance) => void;
  onToggleLike: (eventId: string) => void;
  selectedEventId?: string;
}

const EventsList = ({
  events,
  hasNextPage,
  isLiked,
  isLoadingMore,
  onLoadMore,
  onSelect,
  onToggleLike,
  selectedEventId,
}: EventsListProps) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) onLoadMore();
      },
      {
        root: element.closest("[data-events-scroll]"),
        rootMargin: "360px",
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isLoadingMore, onLoadMore]);

  return (
    <div data-events-scroll className="min-h-0 min-w-0 overflow-y-auto pb-24 pr-1">
      <div className="grid auto-rows-[18rem] grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
        {events.map((event) => (
          <EventCard
            active={event.id === selectedEventId}
            event={event}
            isLiked={isLiked(event.id)}
            key={event.id}
            onSelect={onSelect}
            onToggleLike={onToggleLike}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="py-6 text-center text-sm text-muted-foreground">
        {isLoadingMore && "Loading more events"}
        {!isLoadingMore && hasNextPage && "More events"}
      </div>
    </div>
  );
};

export default EventsList;
