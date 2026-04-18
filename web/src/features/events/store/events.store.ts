import { create } from "zustand";

import { EVENTS_LIKES_STORAGE_KEY } from "../constants";

interface EventsStore {
  likedEventIds: string[];
  isLiked: (eventId: string) => boolean;
  toggleLike: (eventId: string) => void;
}

const readLikedEventIds = () => {
  try {
    const raw = window.localStorage.getItem(EVENTS_LIKES_STORAGE_KEY);

    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    window.localStorage.removeItem(EVENTS_LIKES_STORAGE_KEY);
    return [];
  }
};

const writeLikedEventIds = (ids: string[]) => {
  try {
    window.localStorage.setItem(EVENTS_LIKES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Likes still work in memory if localStorage is unavailable.
  }
};

const useEventsStore = create<EventsStore>((set, get) => ({
  likedEventIds: readLikedEventIds(),
  isLiked: (eventId) => get().likedEventIds.includes(eventId),
  toggleLike: (eventId) => {
    set((state) => {
      const exists = state.likedEventIds.includes(eventId);
      const likedEventIds = exists
        ? state.likedEventIds.filter((id) => id !== eventId)
        : [...state.likedEventIds, eventId];

      writeLikedEventIds(likedEventIds);

      return { likedEventIds };
    });
  },
}));

export default useEventsStore;
