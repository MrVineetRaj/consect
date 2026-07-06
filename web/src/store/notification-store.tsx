import { create } from "zustand";

type NotificationStore = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: (by?: number) => void;
  decrementUnreadCount: (by?: number) => void;
};

export const useNotificationStore = create<NotificationStore>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  incrementUnreadCount: (by = 1) =>
    set((state) => ({ unreadCount: state.unreadCount + by })),
  decrementUnreadCount: (by = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
}));
