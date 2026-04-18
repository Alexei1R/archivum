import { create } from "zustand";

import {
  EVENTS_LIKED_ITEMS_STORAGE_KEY,
  EVENTS_LIKES_STORAGE_KEY,
} from "../constants";
import type { EventItemWithDistance } from "../types";

type EventSnapshotById = Record<string, EventItemWithDistance>;

interface EventsStore {
  eventSnapshots: EventSnapshotById;
  likedEventIds: string[];
  getLikedEvents: () => EventItemWithDistance[];
  isLiked: (eventId: string) => boolean;
  toggleLike: (event: EventItemWithDistance) => void;
  upsertEvents: (events: EventItemWithDistance[]) => void;
}

const canUseStorage = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory Zustand state remains usable if storage is full or blocked.
  }
};

const toSnapshotById = (events: EventItemWithDistance[]) =>
  events.reduce<EventSnapshotById>((items, event) => {
    items[event.id] = event;

    return items;
  }, {});

const readLikedEventIds = () =>
  readJson<string[]>(EVENTS_LIKES_STORAGE_KEY, []).filter(Boolean);

const readEventSnapshots = () =>
  readJson<EventSnapshotById>(EVENTS_LIKED_ITEMS_STORAGE_KEY, {});

const pickSnapshots = (
  eventSnapshots: EventSnapshotById,
  eventIds: string[],
) =>
  eventIds.reduce<EventSnapshotById>((items, id) => {
    const event = eventSnapshots[id];
    if (event) items[id] = event;

    return items;
  }, {});

const useEventsStore = create<EventsStore>((set, get) => ({
  eventSnapshots: readEventSnapshots(),
  likedEventIds: readLikedEventIds(),

  getLikedEvents: () => {
    const { eventSnapshots, likedEventIds } = get();

    return likedEventIds
      .map((id) => eventSnapshots[id])
      .filter((event): event is EventItemWithDistance => Boolean(event));
  },

  isLiked: (eventId) => get().likedEventIds.includes(eventId),

  toggleLike: (event) => {
    set((state) => {
      const exists = state.likedEventIds.includes(event.id);
      const likedEventIds = exists
        ? state.likedEventIds.filter((id) => id !== event.id)
        : [...state.likedEventIds, event.id];
      const eventSnapshots = {
        ...state.eventSnapshots,
        [event.id]: event,
      };

      writeJson(EVENTS_LIKES_STORAGE_KEY, likedEventIds);
      writeJson(EVENTS_LIKED_ITEMS_STORAGE_KEY, pickSnapshots(eventSnapshots, likedEventIds));

      return { eventSnapshots, likedEventIds };
    });
  },

  upsertEvents: (events) => {
    if (events.length === 0) return;

    const state = get();
    const nextSnapshots = { ...state.eventSnapshots };
    let changed = false;

    Object.entries(toSnapshotById(events)).forEach(([id, event]) => {
      if (nextSnapshots[id] !== event) {
        nextSnapshots[id] = event;
        changed = true;
      }
    });

    if (!changed) return;

    writeJson(
      EVENTS_LIKED_ITEMS_STORAGE_KEY,
      pickSnapshots(nextSnapshots, state.likedEventIds),
    );

    set({ eventSnapshots: nextSnapshots });
  },
}));

export default useEventsStore;
