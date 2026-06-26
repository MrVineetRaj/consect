"use client";
import { icons } from "@/lib/assets";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/avatar";
import { Label } from "../ui/label";
import { TiptapTextArea, type TiptapHandle } from "../shared/tiptap/textarea";
import { MicIcon, SendIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import { useUserStore } from "@/store/user-store";
import { useMessageClient } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket-io";

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
        <div className="flex items-baseline gap-2 px-1">
          {!isOwn && (
            <Label className="text-xs font-semibold text-primary">
              {msg.sender.name}
            </Label>
          )}
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
          )}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-0"
            dangerouslySetInnerHTML={{ __html: msg.content }}
          />
        </div>
      </div>
    </div>
  );
};
export const MessageShell = ({
  initMessages,
  conversationId,
  organizationId,
}: {
  initMessages: IMessage[];
  conversationId: string;
  organizationId?: string | null;
}) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [sending, setSending] = useState(false);
  const focusRef = useRef<HTMLSpanElement>(null);
  const editorRef = useRef<TiptapHandle>(null);

  const { token, user } = useUserStore();
  const { sendMessage } = useMessageClient();

  useEffect(() => {
    setMessages(initMessages);
  }, [initMessages]);

  useEffect(() => {
    focusRef.current?.scrollIntoView();
  }, [messages]);

  useEffect(() => {
    socket.emit("join_conversation", {
      conversationId: conversationId,
    });

    socket.on("new_message", (res: { message: IMessage }) => {
      setMessages((prev) => [...prev, { ...res.message }]);
    });
  }, []);

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
      <div className="flex-1 flex flex-col gap-3 p-2 items-start min-h-0 overflow-scroll">
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
        <span ref={focusRef}></span>
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
