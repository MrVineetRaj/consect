"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HashIcon, MessageSquareTextIcon, Search } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { icons } from "@/lib/assets";
import {
  useSearchClient,
  type ISearchChannel,
  type ISearchMember,
  type ISearchMessage,
  type ISearchResults,
} from "@/hooks/use-search";
import { useConversationClient } from "@/hooks/use-conversations";
import { useUserStore } from "@/store/user-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";

/** Message content is Tiptap HTML — flatten to plain text for previews. */
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

const rowClass =
  "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted";

export const WorkspaceSearch = () => {
  const router = useRouter();
  const { user, token } = useUserStore();
  const { userPreference } = useUserPreferenceStore();
  const { searchWorkspace } = useSearchClient();
  const { createConversation, joinChannel } = useConversationClient();
  const organizationId = userPreference?.organizationId;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ISearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K (Ctrl+K on non-mac) focuses the search bar from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced workspace search; a bare @/# still waits for a term.
  useEffect(() => {
    const term = query.trim();
    if (!token || !organizationId || term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      searchWorkspace({ token, organizationId, query: term })
        .then((res) => setResults(res.result))
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, token, organizationId]);

  // Close when clicking anywhere outside the bar/dropdown.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  const openMemberDM = async (member: ISearchMember) => {
    if (!token || !organizationId || busy || member.userId === user?.id) return;
    setBusy(true);
    try {
      // The endpoint reuses the existing 1:1 DM, so this doubles as "jump
      // to conversation" when one already exists.
      const res = await createConversation({
        token,
        organizationId,
        type: "dm",
        memberIds: [member.userId],
      });
      close();
      router.push(`/ws/dm/${res.result.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to open conversation");
    } finally {
      setBusy(false);
    }
  };

  const openChannel = async (channel: ISearchChannel) => {
    if (busy) return;
    if (channel.isMember) {
      close();
      router.push(`/ws/home/${channel.id}`);
      return;
    }
    if (!token || !organizationId) return;
    setBusy(true);
    try {
      await joinChannel({ token, organizationId, conversationId: channel.id });
      close();
      router.push(`/ws/home/${channel.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to join channel");
    } finally {
      setBusy(false);
    }
  };

  const openMessage = (msg: ISearchMessage) => {
    const base = msg.conversation.type === "channel" ? "/ws/home" : "/ws/dm";
    close();
    router.push(`${base}/${msg.conversationId}`);
  };

  const hasResults =
    !!results &&
    (results.members.length > 0 ||
      results.channels.length > 0 ||
      results.messages.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search workspace — @ members, # channels"
        className="h-8 w-full rounded-md bg-muted/50 pl-9 pr-14 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted"
      />
      {loading ? (
        <Spinner className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      ) : (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-10 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border/60 bg-popover pb-1 shadow-lg">
          {!loading && !hasResults && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No matches — try <span className="font-medium">@name</span> for
              members or <span className="font-medium">#name</span> for
              channels.
            </p>
          )}

          {results && results.members.length > 0 && (
            <div>
              <SectionLabel>Members</SectionLabel>
              {results.members.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  disabled={busy}
                  onClick={() => openMemberDM(member)}
                  className={rowClass}
                >
                  <Avatar className="size-6 shrink-0">
                    <Image
                      src={member.image ?? icons.avatar}
                      height={32}
                      width={32}
                      alt={member.name}
                      className="rounded-full"
                    />
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {member.name}
                    {member.userId === user?.id && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results && results.channels.length > 0 && (
            <div>
              <SectionLabel>Channels</SectionLabel>
              {results.channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  disabled={busy}
                  onClick={() => openChannel(channel)}
                  className={rowClass}
                >
                  <HashIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {channel.name ?? "Untitled"}
                  </span>
                  {!channel.isMember && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Join
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results && results.messages.length > 0 && (
            <div>
              <SectionLabel>Messages</SectionLabel>
              {results.messages.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => openMessage(msg)}
                  className={cn(rowClass, "items-start")}
                >
                  <MessageSquareTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs text-muted-foreground">
                      {msg.sender.name}
                      {msg.conversation.type === "channel" &&
                        ` · #${msg.conversation.name ?? "untitled"}`}
                      {" · "}
                      {new Date(msg.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="truncate text-sm">
                      {stripHtml(msg.content)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
