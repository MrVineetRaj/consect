"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AtSignIcon,
  BellIcon,
  CheckCheckIcon,
  MailPlusIcon,
  MessagesSquareIcon,
  StarsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { icons } from "@/lib/assets";
import { socket } from "@/lib/socket-io";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { useNotificationClient } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/notification-store";

const TABS = [
  { key: "all", label: "All" },
  { key: "mention", label: "Mentions" },
  { key: "thread_reply", label: "Threads" },
  { key: "conversation_invite", label: "Invites" },
  { key: "ai_hub", label: "AI Hub" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TYPE_ICON: Record<NotificationKind, React.ElementType> = {
  mention: AtSignIcon,
  thread_reply: MessagesSquareIcon,
  conversation_invite: MailPlusIcon,
  ai_resource_ready: StarsIcon,
  ai_resource_failed: StarsIcon,
};

/** Message previews are Tiptap HTML — flatten to plain text for the feed. */
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatWhen = (date: Date | string) => {
  const then = new Date(date);
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const conversationLabel = (notif: INotification) => {
  if (!notif.conversation) return null;
  if (notif.conversation.type === "dm") return "a direct message";
  return `#${notif.conversation.name ?? "untitled"}`;
};

const headline = (notif: INotification) => {
  const actor = notif.actor?.name ?? "Someone";
  const where = conversationLabel(notif);
  switch (notif.type) {
    case "mention":
      return `${actor} mentioned you${where ? ` in ${where}` : ""}`;
    case "thread_reply":
      return `${actor} replied to your thread${where ? ` in ${where}` : ""}`;
    case "conversation_invite":
      return `${actor} invited you to join ${where ?? "a conversation"}`;
    case "ai_resource_ready":
      return `"${notif.data?.resourceName ?? "A resource"}" is ready in the AI Hub`;
    case "ai_resource_failed":
      return `"${notif.data?.resourceName ?? "A resource"}" failed to embed in the AI Hub`;
  }
};

export const ActivityFeed = ({
  token,
  organizationId,
  initialNotifications,
}: {
  token: string;
  organizationId: string;
  initialNotifications: INotification[];
}) => {
  const router = useRouter();
  const { markRead, markAllRead } = useNotificationClient();
  const { decrementUnreadCount, setUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    const onNew = ({ notification }: { notification: INotification }) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, []);

  const visible = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "ai_hub")
      return notifications.filter((n) => n.type.startsWith("ai_resource"));
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const unreadHere = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    await markAllRead({ token, organizationId });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
  };

  const handleOpen = async (notif: INotification) => {
    if (!notif.readAt) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      decrementUnreadCount();
      // Fire-and-forget; the optimistic update above already reflects it.
      markRead({ token, organizationId, ids: [notif.id] }).catch(() => {});
    }

    if (notif.type.startsWith("ai_resource")) {
      router.push("/ws/ai-hub");
    } else if (notif.conversationId) {
      const base =
        notif.conversation?.type === "dm" ? "/ws/dm" : "/ws/home";
      router.push(`${base}/${notif.conversationId}`);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellIcon className="size-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Activity</h1>
          {unreadHere > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {unreadHere} unread
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadHere === 0}
          className="gap-1.5 text-xs"
        >
          <CheckCheckIcon className="size-3.5" />
          Mark all as read
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <BellIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nothing here yet — mentions, thread replies, invites and AI Hub
              updates will show up in this feed.
            </p>
          </div>
        )}

        {visible.map((notif) => {
          const Icon = TYPE_ICON[notif.type];
          const isUnread = !notif.readAt;
          const preview = notif.data?.preview
            ? stripHtml(notif.data.preview)
            : null;
          const isSystem = notif.type.startsWith("ai_resource");

          return (
            <button
              key={notif.id}
              onClick={() => handleOpen(notif)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                "hover:bg-muted/70",
                isUnread && "bg-primary/5 ring-1 ring-primary/10",
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="size-9">
                  <Image
                    src={
                      isSystem
                        ? icons.robot
                        : (notif.actor?.image ?? icons.avatar)
                    }
                    height={60}
                    width={60}
                    alt={notif.actor?.name ?? "System"}
                    className="rounded-full"
                  />
                </Avatar>
                <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-background ring-1 ring-border">
                  <Icon className="size-3 text-primary" />
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      isUnread ? "font-semibold" : "font-medium",
                    )}
                  >
                    {headline(notif)}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatWhen(notif.createdAt)}
                  </span>
                </div>
                {preview && (
                  <p className="truncate text-xs text-muted-foreground">
                    {preview}
                  </p>
                )}
              </div>

              {isUnread && (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
