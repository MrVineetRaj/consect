"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckIcon,
  EyeOffIcon,
  GlobeIcon,
  HashIcon,
  LockIcon,
  SearchIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { icons } from "@/lib/assets";
import { useConversationClient } from "@/hooks/use-conversations";
import { useOrganizationStore } from "@/store/organization-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";

/** Searchable multi-select over the org's members (current user excluded). */
const MemberPicker = ({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (userId: string) => void;
}) => {
  const { orgMembers } = useOrganizationStore();
  const { user } = useUserStore();
  const [query, setQuery] = useState("");

  const candidates = useMemo(() => {
    const others = orgMembers.filter((m) => m.userId !== user?.id);
    const q = query.trim().toLowerCase();
    if (!q) return others;
    return others.filter(
      (m) =>
        m.user.name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q),
    );
  }, [orgMembers, user?.id, query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="h-8 pl-8 text-sm"
        />
      </div>
      <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border/60 p-1">
        {candidates.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No members found
          </p>
        )}
        {candidates.map((member) => {
          const isSelected = selected.has(member.userId);
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => onToggle(member.userId)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                "hover:bg-muted",
                isSelected && "bg-primary/10 hover:bg-primary/10",
              )}
            >
              <Avatar className="size-7 shrink-0">
                <Image
                  src={member.user.image ?? icons.avatar}
                  height={40}
                  width={40}
                  alt={member.user.name}
                  className="rounded-full"
                />
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {member.user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {member.user.email}
                </span>
              </span>
              {isSelected && (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const VISIBILITY_OPTIONS: {
  value: ConversationVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Listed in the channel browser — anyone in the org can join.",
    icon: GlobeIcon,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Anyone can join, but only by searching its exact name.",
    icon: EyeOffIcon,
  },
  {
    value: "private",
    label: "Private",
    description: "Invite-only. Never shows up in browse or search.",
    icon: LockIcon,
  },
];

const useCreateConversation = () => {
  const { token } = useUserStore();
  const { userPreference } = useUserPreferenceStore();
  const { createConversation } = useConversationClient();
  const organizationId = userPreference?.organizationId;

  return { token, organizationId, createConversation };
};

export const CreateChannelDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();
  const { token, organizationId, createConversation } =
    useCreateConversation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ConversationVisibility>("public");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const reset = () => {
    setName("");
    setDescription("");
    setVisibility("public");
    setSelected(new Set());
  };

  const handleCreate = async () => {
    if (!token || !organizationId || !name.trim()) return;
    setSubmitting(true);
    try {
      const res = await createConversation({
        token,
        organizationId,
        name: name.trim(),
        description: description.trim() || null,
        type: "channel",
        visibility,
        memberIds: Array.from(selected),
      });
      toast.success(
        selected.size > 0
          ? "Channel created — invitations sent"
          : "Channel created",
      );
      reset();
      onOpenChange(false);
      router.push(`/ws/home/${res.result.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HashIcon className="size-4 text-primary" />
            Create a channel
          </DialogTitle>
          <DialogDescription>
            Channels are where your team talks about a topic. Invited members
            can accept from their Activity feed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-name">Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. product-updates"
              maxLength={60}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              maxLength={160}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Visibility</Label>
            <div className="flex flex-col gap-1 rounded-lg border border-border/60 p-1">
              {VISIBILITY_OPTIONS.map((option) => {
                const isActive = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                      "hover:bg-muted",
                      isActive && "bg-primary/10 hover:bg-primary/10",
                    )}
                  >
                    <option.icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                    {isActive && (
                      <CheckIcon className="mt-1 size-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              Invite members{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <MemberPicker selected={selected} onToggle={toggle} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            className="gap-2"
          >
            {submitting && <Spinner className="size-3.5" />}
            Create channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BrowseChannelsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();
  const { token } = useUserStore();
  const { userPreference } = useUserPreferenceStore();
  const { browseChannels, joinChannel } = useConversationClient();
  const organizationId = userPreference?.organizationId;

  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<
    (IConversation & { isMember: boolean })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Public channels are always listed; typing also surfaces unlisted
  // channels whose name matches. Debounced to avoid a request per keystroke.
  useEffect(() => {
    if (!open || !token || !organizationId) return;
    setLoading(true);
    const timeout = setTimeout(() => {
      browseChannels({ token, organizationId, query })
        .then((res) => setChannels(res.result ?? []))
        .catch(() => setChannels([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [open, query, token, organizationId]);

  const handleJoin = async (channel: IConversation & { isMember: boolean }) => {
    if (!token || !organizationId || joiningId) return;
    setJoiningId(channel.id);
    try {
      await joinChannel({ token, organizationId, conversationId: channel.id });
      onOpenChange(false);
      setQuery("");
      router.push(`/ws/home/${channel.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to join channel");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Browse channels</DialogTitle>
          <DialogDescription>
            Public channels are listed below. Unlisted channels only appear
            when you search their name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels"
              className="h-8 pl-8 text-sm"
            />
          </div>

          <div className="flex max-h-72 min-h-24 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border/60 p-1">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-4" />
              </div>
            )}
            {!loading && channels.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                {query.trim()
                  ? "No channels match your search"
                  : "No public channels yet"}
              </p>
            )}
            {!loading &&
              channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5"
                >
                  <HashIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {channel.name ?? "Untitled"}
                      {channel.visibility === "unlisted" && (
                        <EyeOffIcon className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </span>
                    {channel.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {channel.description}
                      </span>
                    )}
                  </span>
                  {channel.isMember ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Joined
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 px-3 text-xs"
                      disabled={joiningId === channel.id}
                      onClick={() => handleJoin(channel)}
                    >
                      {joiningId === channel.id ? (
                        <Spinner className="size-3" />
                      ) : (
                        "Join"
                      )}
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const NewDmDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();
  const { token, organizationId, createConversation } =
    useCreateConversation();
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const isGroup = selected.size > 1;

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const reset = () => {
    setGroupName("");
    setSelected(new Set());
  };

  const handleStart = async () => {
    if (!token || !organizationId || selected.size === 0) return;
    setSubmitting(true);
    try {
      const res = await createConversation({
        token,
        organizationId,
        name: isGroup ? groupName.trim() || null : null,
        type: isGroup ? "group" : "dm",
        memberIds: Array.from(selected),
      });
      reset();
      onOpenChange(false);
      router.push(`/ws/dm/${res.result.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to start conversation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Pick one person for a direct message, or several to start a group.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <MemberPicker selected={selected} onToggle={toggle} />
          {isGroup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-name">
                Group name{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. launch-crew"
                maxLength={60}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={selected.size === 0 || submitting}
            className="gap-2"
          >
            {submitting && <Spinner className="size-3.5" />}
            {isGroup ? "Create group" : "Start DM"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
