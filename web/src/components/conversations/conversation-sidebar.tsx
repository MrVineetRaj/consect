"use client";
import { ConversationAvatar } from "@/components/shared/conversation-avatar";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/store/organization-store";
import { CompassIcon, HashIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { socket } from "@/lib/socket-io";
import {
  BrowseChannelsDialog,
  CreateChannelDialog,
  NewDmDialog,
} from "./create-conversation-dialogs";

type Channel = { id: string; name: string | null; unreadCount?: number };

type DmConversation = {
  id: string;
  name?: string | null;
  image?: string | null;
  members: ConversationMember[];
  type: "group" | "dm" | "channel" | null;
  unreadCount?: number;
};

const UnreadBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const SectionHeader = ({
  title,
  count,
  onAdd,
  onBrowse,
}: {
  title: string;
  count: number;
  onAdd: () => void;
  onBrowse?: () => void;
}) => (
  <div className="flex items-center justify-between px-2 pb-1">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </span>
    <span className="flex items-center gap-1.5">
      {count > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground/70">
          {count}
        </span>
      )}
      {onBrowse && (
        <button
          type="button"
          aria-label={`Browse ${title.toLowerCase()}`}
          onClick={onBrowse}
          className="grid size-5 place-items-center rounded-md text-muted-foreground/70 shadow-none transition-colors hover:bg-background hover:text-foreground"
        >
          <CompassIcon className="size-3.5" />
        </button>
      )}
      <button
        type="button"
        aria-label={`Add ${title.toLowerCase()}`}
        onClick={onAdd}
        className="grid size-5 place-items-center rounded-md text-muted-foreground/70 shadow-none transition-colors hover:bg-background hover:text-foreground"
      >
        <PlusIcon className="size-3.5" />
      </button>
    </span>
  </div>
);

const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <p className="px-2.5 py-1.5 text-xs text-muted-foreground/70">{children}</p>
);

const dmLabel = (c: DmConversation) =>
  c.name ??
  c.members.map((m) => m.name).join(", ") + (c.members.length > 4 ? "…" : "");

export const ConversationSidebar = ({
  channels,
  dmAndGroups,
  isDMPage = false,
}: {
  channels: Channel[];
  dmAndGroups: DmConversation[];
  isDMPage?: boolean;
}) => {
  const { orgPresence } = useOrganizationStore();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  // Server-provided counts seed the badges; socket activity keeps them live.
  const initialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of channels) counts[c.id] = c.unreadCount ?? 0;
    for (const c of dmAndGroups) counts[c.id] = c.unreadCount ?? 0;
    return counts;
  }, [channels, dmAndGroups]);
  const [unreadCounts, setUnreadCounts] = useState(initialCounts);
  useEffect(() => setUnreadCounts(initialCounts), [initialCounts]);

  // The socket handler reads the pathname through a ref so it can stay
  // subscribed across navigations.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const handleActivity = (res: { conversationId: string }) => {
      // The open conversation is being read right now — no badge for it.
      if (pathnameRef.current.includes(res.conversationId)) return;
      setUnreadCounts((prev) => ({
        ...prev,
        [res.conversationId]: (prev[res.conversationId] ?? 0) + 1,
      }));
    };
    socket.on("conversation_activity", handleActivity);
    return () => {
      socket.off("conversation_activity", handleActivity);
    };
  }, []);

  // Opening a conversation clears its badge (the shell marks it read).
  useEffect(() => {
    setUnreadCounts((prev) => {
      const activeId = Object.keys(prev).find(
        (id) => prev[id] && pathname.includes(id),
      );
      if (!activeId) return prev;
      return { ...prev, [activeId]: 0 };
    });
  }, [pathname]);

  const filteredChannels = useMemo(
    () =>
      normalizedQuery
        ? channels.filter((c) =>
            (c.name ?? "untitled").toLowerCase().includes(normalizedQuery),
          )
        : channels,
    [channels, normalizedQuery],
  );

  const filteredDms = useMemo(
    () =>
      normalizedQuery
        ? dmAndGroups.filter((c) =>
            dmLabel(c).toLowerCase().includes(normalizedQuery),
          )
        : dmAndGroups,
    [dmAndGroups, normalizedQuery],
  );

  const itemClass = (isActive: boolean) =>
    cn(
      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm",
      "transition-colors duration-150",
      "text-muted-foreground hover:bg-background hover:text-foreground",
      isActive && "bg-primary/10 font-medium text-primary hover:bg-primary/10",
    );
    
  return (
    <aside className="flex w-72 flex-col border-r border-border/60 bg-muted/40">
      <div className="flex flex-col gap-3 px-4 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight">Messages</h2>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="h-8 bg-background/60 pl-8 text-sm"
          />
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-5 overflow-y-auto px-2 pb-4">
        {!isDMPage && (
          <div>
            <SectionHeader
              title="Channels"
              count={filteredChannels.length}
              onAdd={() => setChannelDialogOpen(true)}
              onBrowse={() => setBrowseDialogOpen(true)}
            />
            {filteredChannels.length === 0 ? (
              <EmptyHint>
                {normalizedQuery ? "No matching channels" : "No channels yet"}
              </EmptyHint>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = pathname.includes(channel.id);
                const unread = isActive ? 0 : (unreadCounts[channel.id] ?? 0);
                return (
                  <Link
                    key={channel.id}
                    href={`/ws/home/${channel.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={itemClass(isActive)}
                  >
                    <HashIcon className="size-4 shrink-0 opacity-70" />
                    <span
                      className={cn(
                        "truncate",
                        unread > 0 && "font-semibold text-foreground",
                      )}
                    >
                      {channel.name ?? "Untitled"}
                    </span>
                    <UnreadBadge count={unread} />
                  </Link>
                );
              })
            )}
          </div>
        )}
        <div>
          <SectionHeader
            title="Direct Messages"
            count={filteredDms.length}
            onAdd={() => setDmDialogOpen(true)}
          />
          {filteredDms.length === 0 ? (
            <EmptyHint>
              {normalizedQuery
                ? "No matching conversations"
                : "No direct messages yet"}
            </EmptyHint>
          ) : (
            filteredDms.map((conversation) => {
              const isActive = pathname.includes(conversation.id);
              const unread = isActive
                ? 0
                : (unreadCounts[conversation.id] ?? 0);
              const isOnline =
                conversation.type == "group"
                  ? false
                  : (orgPresence[conversation.members[0].userId] ?? false);

              return (
                <Link
                  key={conversation.id}
                  href={`/ws/${isDMPage ? "dm" : "home"}/${conversation.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={itemClass(isActive)}
                >
                  <ConversationAvatar
                    image={conversation.image}
                    members={conversation.members}
                    isOnline={isOnline}
                  />
                  <span
                    className={cn(
                      "truncate",
                      unread > 0 && "font-semibold text-foreground",
                    )}
                  >
                    {dmLabel(conversation)}
                  </span>
                  <UnreadBadge count={unread} />
                </Link>
              );
            })
          )}
        </div>
      </nav>

      <CreateChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
      />
      <BrowseChannelsDialog
        open={browseDialogOpen}
        onOpenChange={setBrowseDialogOpen}
      />
      <NewDmDialog open={dmDialogOpen} onOpenChange={setDmDialogOpen} />
    </aside>
  );
};
