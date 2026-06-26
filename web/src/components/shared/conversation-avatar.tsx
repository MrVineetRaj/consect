"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useConversationClient } from "@/hooks/use-conversations";
import { icons } from "@/lib/assets";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";
import { HashIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const ConversationAvatar = ({
  image,
  members,
  isOnline = false,
}: {
  image?: string | null;
  members: ConversationMember[];
  isOnline: boolean;
}) => {
  // A dedicated conversation image always wins.
  if (image) {
    return (
      <Avatar size="sm" className="relative">
        <AvatarImage src={image} alt="" />
        <AvatarFallback>#</AvatarFallback>
      </Avatar>
    );
  }

  // Otherwise stack member avatars (server caps this list, current user excluded).
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;

  if (shown.length === 0) {
    return <HashIcon className="size-4" />;
  }

  return (
    <div className="relative inline-flex">
      <AvatarGroup data-size="sm">
        {shown.map((member) => (
          <Avatar key={member.id} size="sm">
            <AvatarImage src={member.image ?? icons.avatar} alt={member.name} />

            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? <AvatarGroupCount>+{extra}</AvatarGroupCount> : null}
      </AvatarGroup>
      {isOnline ? (
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      ) : null}
    </div>
  );
};
