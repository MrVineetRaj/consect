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

const MessageBox = ({ msg }: { msg: IMessage }) => {
  return (
    <div className="p-2  flex items-start gap-2">
      <Avatar className="size-8 mt-1">
        <Image
          src={msg.sender.image ?? icons.avatar}
          height={60}
          width={60}
          alt={msg.sender.name}
          className="rounded-full"
        />
      </Avatar>
      <div className="bg-accent/30 px-4 py-2 rounded-xl">
        <div className="flex items-baseline gap-2">
          <Label className="text-primary text-xs font-bold">
            {msg.sender.name}
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: msg.content }}
        />
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
      setMessages((prev) => [...prev, { ...result, sender: user as IUser }]);
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
        {messages.map((msg) => (
          <MessageBox msg={msg} key={msg.id} />
        ))}
        <span ref={focusRef}></span>
      </div>

      <span className="flex gap-1 w-full border p-2 rounded-t-xl">
        <TiptapTextArea ref={editorRef} onSubmit={handleSend} />
        <div className="flex items-center flex-col justify-end gap-1">
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Spinner className="size-4" /> : <SendIcon />}
          </Button>
          <Button>
            <MicIcon />
          </Button>
        </div>
      </span>
    </div>
  );
};
