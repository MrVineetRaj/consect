"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { icons } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, HashIcon, LockIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Display name for a conversation from the current user's point of view. */
export const conversationLabel = (
  details: IConversationDetails,
  currentUserId?: string | null,
) => {
  const { conversation, members } = details;
  if (conversation.name) return conversation.name;
  const others = members.filter((m) => m.userId !== currentUserId);
  const names = others.slice(0, 4).map((m) => m.name);
  return names.join(", ") + (others.length > 4 ? "…" : "");
};

/**
 * Clickable strip above the message list. Shows what the conversation is and
 * who's in it; clicking anywhere opens the details page.
 */
export const ConversationHeader = ({
  details,
  detailsHref,
  currentUserId,
}: {
  details: IConversationDetails;
  detailsHref: string;
  currentUserId?: string | null;
}) => {
  const { conversation, members } = details;
  const others = members.filter((m) => m.userId !== currentUserId);
  const shownAvatars = (others.length > 0 ? others : members).slice(0, 3);
  const extra = members.length - shownAvatars.length;

  const isChannel = conversation.type === "channel";
  const TypeIcon =
    isChannel && conversation.visibility === "private"
      ? LockIcon
      : isChannel
        ? HashIcon
        : UsersIcon;

  return (
    <Link
      href={detailsHref}
      aria-label="Open conversation details"
      className={cn(
        "group flex items-center gap-3 border-b border-border/60 bg-card/50 px-4 py-2.5",
        "transition-colors hover:bg-muted/60",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <TypeIcon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight">
          {conversationLabel(details, currentUserId)}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {conversation.description ||
            `${members.length} member${members.length === 1 ? "" : "s"}`}
        </span>
      </span>

      <span className="flex items-center gap-2">
        <AvatarGroup data-size="sm" className="hidden sm:flex">
          {shownAvatars.map((member) => (
            <Avatar key={member.memberId} size="sm">
              <AvatarImage
                src={member.image ?? icons.avatar}
                alt={member.name}
              />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
          {extra > 0 ? <AvatarGroupCount>+{extra}</AvatarGroupCount> : null}
        </AvatarGroup>
        <ChevronRightIcon className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};
