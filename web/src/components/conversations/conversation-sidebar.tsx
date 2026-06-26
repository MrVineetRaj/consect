"use client";
import { ConversationAvatar } from "@/components/shared/conversation-avatar";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/store/organization-store";
import { HashIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Channel = { id: string; name: string | null };

type DmConversation = {
  id: string;
  name?: string | null;
  image?: string | null;
  members: ConversationMember[];
  type: "group" | "dm" | "channel" | null;
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
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
      <button
        type="button"
        aria-label={`Add ${title.toLowerCase()}`}
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

  const normalizedQuery = query.trim().toLowerCase();

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
            <SectionHeader title="Channels" count={filteredChannels.length} />
            {filteredChannels.length === 0 ? (
              <EmptyHint>
                {normalizedQuery ? "No matching channels" : "No channels yet"}
              </EmptyHint>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = pathname.includes(channel.id);
                return (
                  <Link
                    key={channel.id}
                    href={`/ws/home/${channel.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={itemClass(isActive)}
                  >
                    <HashIcon className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">
                      {channel.name ?? "Untitled"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        )}
        <div>
          <SectionHeader title="Direct Messages" count={filteredDms.length} />
          {filteredDms.length === 0 ? (
            <EmptyHint>
              {normalizedQuery
                ? "No matching conversations"
                : "No direct messages yet"}
            </EmptyHint>
          ) : (
            filteredDms.map((conversation) => {
              const isActive = pathname.includes(conversation.id);
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
                  <span className="truncate">{dmLabel(conversation)}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>
    </aside>
  );
};
