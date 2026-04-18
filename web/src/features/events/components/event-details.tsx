import { CalendarDays, Heart, MapPin, Ticket } from "lucide-react";

import { Badge, Button } from "@/shared/components";
import { cn } from "@/shared/utils";

import type { EventItemWithDistance } from "../types";

interface EventDetailsProps {
  event: EventItemWithDistance;
  isLiked: boolean;
  onToggleLike: (eventId: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const getDistanceLabel = (distanceMeters: number) => {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m away`;

  return `${(distanceMeters / 1000).toFixed(1)} km away`;
};

const EventDetails = ({ event, isLiked, onToggleLike }: EventDetailsProps) => {
  return (
    <article className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
      <div className="relative min-h-52 flex-[0_0_min(34vh,20rem)] overflow-hidden bg-muted">
        {event.imageUrl && (
          <img src={event.imageUrl} alt="" className="block h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          <Badge className="rounded-lg border-white/20 bg-white/15 text-white backdrop-blur" variant="outline">
            {event.category}
          </Badge>
          <Badge className="rounded-lg border-white/20 bg-white/15 text-white backdrop-blur" variant="outline">
            {event.sourceLabel}
          </Badge>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              {dateFormatter.format(new Date(event.startDate))}
            </p>
            <h2 className="break-words text-2xl font-semibold leading-8 text-foreground">
              {event.title}
            </h2>
          </div>

          <Button
            aria-pressed={isLiked}
            aria-label={isLiked ? "Remove from liked events" : "Like event"}
            className={cn(
              "shrink-0 rounded-lg border",
              isLiked && "border-brand text-brand"
            )}
            onClick={() => onToggleLike(event.id)}
            size="icon"
            variant="ghost"
          >
            <Heart className={cn("size-4", isLiked && "fill-current")} />
          </Button>
        </div>

        <p className="break-words text-sm leading-6 text-muted-foreground">{event.description}</p>

        <div className="grid gap-2">
          <div className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-6 text-muted-foreground">
            <CalendarDays className="mt-1 size-4 shrink-0 text-foreground" />
            <span>{dateFormatter.format(new Date(event.startDate))}</span>
          </div>
          <div className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-6 text-muted-foreground">
            <MapPin className="mt-1 size-4 shrink-0 text-foreground" />
            <span className="min-w-0 break-words">{event.location.name}, {event.location.address}</span>
          </div>
          <div className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-6 text-muted-foreground">
            <Ticket className="mt-1 size-4 shrink-0 text-foreground" />
            <span>{event.priceLabel}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
          <span>{getDistanceLabel(event.distanceMeters)}</span>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              Open event
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default EventDetails;
