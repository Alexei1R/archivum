import { useEffect, useMemo, useState } from "react";

import { EventDetails, EventMobileSheet, EventsList } from "./components";
import { useEvents } from "./hooks";
import { useEventsStore } from "./store";
import { useIsMobile } from "@/shared/hooks";
import type { EventItemWithDistance } from "./types";

const Main = () => {
  const {
    error,
    events,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useEvents();
  const { isLiked, toggleLike } = useEventsStore();
  const isMobile = useIsMobile();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId],
  );

  useEffect(() => {
    if (!selectedEventId && events[0]) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const handleSelect = (event: EventItemWithDistance) => {
    setSelectedEventId(event.id);
    if (isMobile) setMobileDetailsOpen(true);
  };

  return (
    <main className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      <div className="grid h-full min-h-0 min-w-0 w-full grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {isLoading && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Loading events
            </div>
          )}
          {error && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              {error}
            </div>
          )}
          {!isLoading && !error && (
            <EventsList
              events={events}
              hasNextPage={Boolean(hasNextPage)}
              isLiked={isLiked}
              isLoadingMore={isFetchingNextPage}
              onLoadMore={() => {
                void fetchNextPage();
              }}
              onSelect={handleSelect}
              onToggleLike={toggleLike}
              selectedEventId={selectedEvent?.id}
            />
          )}
        </section>

        {!isLoading && !error && selectedEvent && (
          <aside className="hidden min-h-0 min-w-0 overflow-hidden lg:flex">
            <EventDetails
              event={selectedEvent}
              isLiked={isLiked(selectedEvent.id)}
              onToggleLike={toggleLike}
            />
          </aside>
        )}
      </div>

      <EventMobileSheet
        event={selectedEvent}
        isLiked={isLiked}
        onOpenChange={setMobileDetailsOpen}
        onToggleLike={toggleLike}
        open={mobileDetailsOpen}
      />
    </main>
  );
};

export default Main;
