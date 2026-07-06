"use client";
import { useEffect } from "react";
import { socket } from "@/lib/socket-io";
import { useNotificationClient } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/notification-store";
import { useUserStore } from "@/store/user-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";

/**
 * Unread-count bubble for the Activity nav item. Owns the shared unread
 * counter: seeds it from the API and bumps it on `notification:new`, so it
 * must stay mounted exactly once (in the nav rail).
 */
export const NotificationBadge = () => {
  const { token } = useUserStore();
  const { userPreference } = useUserPreferenceStore();
  const { unreadCount, setUnreadCount, incrementUnreadCount } =
    useNotificationStore();
  const { getUnreadCount } = useNotificationClient();

  const organizationId = userPreference?.organizationId;

  useEffect(() => {
    if (!token || !organizationId) return;

    getUnreadCount({ token, organizationId })
      .then((res) => setUnreadCount(res.result?.count ?? 0))
      .catch(() => {});

    const onNew = () => incrementUnreadCount();
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [token, organizationId]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-4 text-primary-foreground">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
};
