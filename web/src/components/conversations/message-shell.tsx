"use client";
import { icons } from "@/lib/assets";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Avatar } from "../ui/avatar";
import { Label } from "../ui/label";
import { TiptapTextArea, type TiptapHandle } from "../shared/tiptap/textarea";
import { MicIcon, SendIcon, StarsIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import { useUserStore } from "@/store/user-store";
import { useMessageClient } from "@/hooks/use-messages";
import { useConversationClient } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket-io";
import Link from "next/link";

/** Midnight timestamp for the given date — used to compare calendar days. */
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "Today" / "Yesterday" / "9 June 2026" for a day separator. */
const formatDayLabel = (date: Date) => {
  const DAY = 86_400_000;
  const today = startOfDay(new Date());
  const that = startOfDay(date);
  if (that === today) return "Today";
  if (that === today - DAY) return "Yesterday";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const DateDivider = ({ label }: { label: string }) => (
  <div className="flex w-full items-center gap-3 py-2">
    <span className="h-px flex-1 bg-border/60" />
    <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
    <span className="h-px flex-1 bg-border/60" />
  </div>
);

const MessageBox = ({ msg, isOwn }: { msg: IMessage; isOwn: boolean }) => {
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // System-generated messages ("X joined") render as a centered pill, not a
  // chat bubble.
  if (msg.senderId === "system_bot") {
    return (
      <div className="flex w-full justify-center py-0.5">
        <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] text-muted-foreground">
          {msg.content
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()}
        </span>
      </div>
    );
  }

  const isAI = msg.senderId == "consecto";

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-2.5",
        isOwn && "flex-row-reverse",
      )}
    >
      <Avatar className="size-8 shrink-0">
        <Image
          src={
            (msg.sender.image ?? msg.senderId == "consecto")
              ? icons.robot
              : icons.avatar
          }
          height={60}
          width={60}
          alt={msg.sender.name}
          className="rounded-full"
        />
      </Avatar>

      <div
        className={cn(
          "flex min-w-0 max-w-[78%] flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-2 px-1">
          {!isOwn &&
            (isAI ? (
              <Label className="text-xs font-semibold text-primary">
                {msg.sender.name}
              </Label>
            ) : (
              <Link
                href={`/ws/members/${msg.senderId}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {msg.sender.name}
              </Link>
            ))}
          <span className="text-[10px] text-muted-foreground">
            {isAI && <StarsIcon className="size-3 text-primary"/>}
          </span>
          <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {time}
          </span>
        </div>
        <div
          className={cn(
            "px-3.5 py-2 text-sm shadow-sm",
            isOwn
              ? "rounded-2xl rounded-tr-md bg-primary/15 text-foreground ring-1 ring-primary/20"
              : "rounded-2xl rounded-tl-md bg-muted text-foreground",
            isAI ? "border-l-2 rounded-l-none border-primary" : "",
          )}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none wrap-break-word prose-p:my-0"
            dangerouslySetInnerHTML={{ __html: msg.content }}
          />
        </div>
      </div>
    </div>
  );
};
export const MessageShell = ({
  initMessages,
  initNextCursor = null,
  initHasMore = false,
  conversationId,
  organizationId,
}: {
  initMessages: IMessage[];
  initNextCursor?: string | null;
  initHasMore?: boolean;
  conversationId: string;
  organizationId?: string | null;
}) => {
  const [messages, setMessages] = useState<IMessage[]>(initMessages);
  const [nextCursor, setNextCursor] = useState(initNextCursor);
  const [hasMore, setHasMore] = useState(initHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<TiptapHandle>(null);
  // How the next messages-change should position the viewport: stay pinned to
  // the bottom (new message) or compensate for content prepended on top.
  const stickToBottomRef = useRef(true);
  const prependStateRef = useRef<{ height: number; top: number } | null>(null);

  const { token, user } = useUserStore();
  const { sendMessage, listMessages } = useMessageClient();
  const { markConversationRead } = useConversationClient();

  useEffect(() => {
    setMessages(initMessages);
    setNextCursor(initNextCursor);
    setHasMore(initHasMore);
    stickToBottomRef.current = true;
  }, [initMessages, initNextCursor, initHasMore]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prependStateRef.current) {
      el.scrollTop =
        el.scrollHeight - prependStateRef.current.height +
        prependStateRef.current.top;
      prependStateRef.current = null;
    } else if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  };

  const markRead = useCallback(() => {
    if (!token || !organizationId) return;
    markConversationRead({ token, organizationId, conversationId }).catch(
      () => {},
    );
    // markConversationRead is recreated per render; the inputs below are what
    // actually change the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, organizationId, conversationId]);

  // Viewing a conversation reads it — on open and on every incoming message.
  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    socket.emit("join_conversation", {
      conversationId: conversationId,
    });

    const handleNewMessage = (res: { message: IMessage }) => {
      // The socket stays in every room visited this session, so drop events
      // meant for other conversations.
      if (res.message.conversationId !== conversationId) return;
      // Own messages always snap to the bottom; others only if the viewer is
      // already there (don't yank someone reading history).
      stickToBottomRef.current =
        res.message.senderId === user?.id || isNearBottom();
      setMessages((prev) =>
        prev.some((m) => m.id === res.message.id)
          ? prev
          : [...prev, { ...res.message }],
      );
      if (document.visibilityState === "visible") markRead();
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [conversationId, user?.id, markRead]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingOlder || !token || !organizationId)
      return;
    setLoadingOlder(true);
    try {
      const { result } = await listMessages({
        token,
        conversationId,
        organizationId,
        before: nextCursor,
      });
      const el = scrollRef.current;
      if (el)
        prependStateRef.current = { height: el.scrollHeight, top: el.scrollTop };
      stickToBottomRef.current = false;
      setMessages((prev) => [...result.messages, ...prev]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      toast.error("Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
    // listMessages is recreated per render but only closes over the client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, nextCursor, loadingOlder, token, organizationId, conversationId]);

  // Fetch the previous page whenever the viewport nears the top of history.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maybeLoadOlder = () => {
      if (el.scrollTop < 200) loadOlder();
    };
    el.addEventListener("scroll", maybeLoadOlder, { passive: true });
    return () => el.removeEventListener("scroll", maybeLoadOlder);
  }, [loadOlder]);

  async function handleSend() {
    // Empty check on plain text, but send the rich HTML as the body.
    const text = editorRef.current?.getText() ?? "";
    const content = editorRef.current?.getHTML() ?? "";
    if (!text || sending || !token || !organizationId) return;

    const mentions = editorRef.current?.getMentions() ?? [];
    setSending(true);
    try {
      const { result } = await sendMessage({
        token,
        conversationId,
        organizationId,
        content,
        mentions,
      });
      // The server returns the row without the `sender` relation, so attach
      // the current user for immediate rendering.
      editorRef.current?.clear();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col ">
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-3 p-2 items-start min-h-0 overflow-scroll"
      >
        {loadingOlder && (
          <div className="flex w-full justify-center py-1">
            <Spinner className="size-4" />
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDivider =
            !prev ||
            startOfDay(new Date(prev.createdAt)) !==
              startOfDay(new Date(msg.createdAt));
          return (
            <React.Fragment key={msg.id}>
              {showDivider && (
                <DateDivider label={formatDayLabel(new Date(msg.createdAt))} />
              )}
              <MessageBox msg={msg} isOwn={msg.sender.id === user?.id} />
            </React.Fragment>
          );
        })}
      </div>

      <div className="p-3 pt-0">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
          <TiptapTextArea ref={editorRef} onSubmit={handleSend} />
          <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
            <p className="text-[11px] text-muted-foreground">
              <kbd>Cmd</kbd> + <kbd>Enter</kbd> to send
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Record voice message"
                className="text-muted-foreground shadow-none"
              >
                <MicIcon />
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={sending}
                size="icon"
                aria-label="Send message"
                className="rounded-full"
              >
                {sending ? <Spinner className="size-4" /> : <SendIcon />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
