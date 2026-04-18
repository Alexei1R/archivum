import { Heart, MapPin } from "lucide-react";

import { Badge, Button } from "@/shared/components";
import { cn } from "@/shared/utils";

import type { EventItemWithDistance } from "../types";

interface EventCardProps {
  active?: boolean;
  event: EventItemWithDistance;
  isLiked: boolean;
  onSelect: (event: EventItemWithDistance) => void;
  onToggleLike: (event: EventItemWithDistance) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

const getDistanceLabel = (distanceMeters: number) => {
  if (!Number.isFinite(distanceMeters)) return "Distance unavailable";
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;

  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const EventCard = ({
  active = false,
  event,
  isLiked,
  onSelect,
  onToggleLike,
}: EventCardProps) => {
  return (
    <article
      className={cn(
        "group relative h-72 min-h-72 w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-muted transition-all hover:border-foreground/25 hover:shadow-lg active:translate-y-px",
        active && "border-foreground/25 shadow-lg"
      )}
      onClick={() => onSelect(event)}
    >
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

      <div className="absolute inset-0 flex min-w-0 flex-col justify-between p-3 text-white">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Badge className="rounded-lg border-white/20 bg-white/15 text-white backdrop-blur" variant="outline">
            {event.category}
          </Badge>

          <Button
            aria-pressed={isLiked}
            aria-label={isLiked ? "Remove from liked events" : "Like event"}
            className={cn(
              "shrink-0 rounded-lg border border-white/25 bg-black/20 text-white hover:bg-white/15 hover:text-white",
              isLiked && "border-white text-white"
            )}
            onClick={(eventClick) => {
              eventClick.stopPropagation();
              onToggleLike(event);
            }}
            size="icon"
            variant="ghost"
          >
            <Heart className={cn("size-4", isLiked && "fill-current")} />
          </Button>
        </div>

        <div className="min-w-0 space-y-2">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-white/75">
              {dateFormatter.format(new Date(event.startDate))}
            </p>
            <h2 className="line-clamp-2 text-lg font-semibold leading-6 text-white">
              {event.title}
            </h2>
          </div>

          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-white/75">
            <span className="inline-flex max-w-full min-w-0 items-center gap-1 text-white">
            <MapPin size={14} />
              <span className="truncate">{event.location.name}</span>
            </span>
            <span>{getDistanceLabel(event.distanceMeters)}</span>
            <span>{event.priceLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
