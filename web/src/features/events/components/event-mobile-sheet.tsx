import { Drawer } from "@/shared/components";

import EventDetails from "./event-details";
import type { EventItemWithDistance } from "../types";

interface EventMobileSheetProps {
  event: EventItemWithDistance | null;
  isLiked: (eventId: string) => boolean;
  onOpenChange: (open: boolean) => void;
  onToggleLike: (eventId: string) => void;
  open: boolean;
}

const EventMobileSheet = ({
  event,
  isLiked,
  onOpenChange,
  onToggleLike,
  open,
}: EventMobileSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="h-[75vh]">
        {event && (
          <>
            <Drawer.Title className="sr-only">{event.title}</Drawer.Title>
            <Drawer.Description className="sr-only">
              Event details
            </Drawer.Description>
            <EventDetails
              event={event}
              isLiked={isLiked(event.id)}
              onToggleLike={onToggleLike}
            />
          </>
        )}
      </Drawer.Content>
    </Drawer>
  );
};

export default EventMobileSheet;
