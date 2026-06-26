"use client";
import { ConversationAvatar } from "@/components/shared/conversation-avatar";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/store/organization-store";
import { HashIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

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

  useEffect(() => {
    console.log("orgPresence", { orgPresence });
  }, [orgPresence]);

  const itemClass = (isActive: boolean) =>
    cn(
      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm",
      "transition-colors duration-150",
      "text-muted-foreground hover:bg-background hover:text-foreground",
      isActive && "bg-primary/10 font-medium text-primary hover:bg-primary/10",
    );

  return (
    <aside className="flex w-72 flex-col border-r border-border/60 bg-muted/40">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight">Messages</h2>
      </div>

      <nav className="flex-1 min-h-0 space-y-5 overflow-y-auto px-2 pb-4">
        {!isDMPage && (
          <div>
            <SectionHeader title="Channels" count={channels.length} />
            {channels.length === 0 ? (
              <EmptyHint>No channels yet</EmptyHint>
            ) : (
              channels.map((channel) => {
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
          <SectionHeader title="Direct Messages" count={dmAndGroups.length} />
          {dmAndGroups.length === 0 ? (
            <EmptyHint>No direct messages yet</EmptyHint>
          ) : (
            dmAndGroups.map((conversation) => {
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
