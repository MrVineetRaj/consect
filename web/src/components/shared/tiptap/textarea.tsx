"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import Mention from "@tiptap/extension-mention";
import { makeMentionSuggestion } from "./mention-suggestion";

import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/store/organization-store";
import { icons } from "@/lib/assets";

type ToolbarButton = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: () => boolean;
  onClick: () => void;
};

const MenuBar = ({ editor }: { editor: Editor }) => {
  const buttons: ToolbarButton[] = [
    {
      icon: Bold,
      label: "Bold",
      isActive: () => editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      isActive: () => editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      isActive: () => editor.isActive("strike"),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      label: "Code",
      isActive: () => editor.isActive("code"),
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: Heading2,
      label: "Heading",
      isActive: () => editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: "Bullet list",
      isActive: () => editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered list",
      isActive: () => editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Quote",
      isActive: () => editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1.5 py-1">
      {buttons.map(({ icon: Icon, label, isActive, onClick }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={isActive()}
          onClick={onClick}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground",
            isActive() && "bg-primary/10 text-primary hover:bg-primary/10",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
};

export type TiptapHandle = {
  /** Trimmed plain-text content — use for empty checks. */
  getText: () => string;
  /** Rich HTML content of the editor — use as the message body. */
  getHTML: () => string;
  /** IDs of every @mention currently in the editor. */
  getMentions: () => string[];
  /** Empty the editor. */
  clear: () => void;
};

type TiptapTextAreaProps = {
  /** Called on Cmd/Ctrl+Enter so the parent can submit. */
  onSubmit?: () => void;
};

export const TiptapTextArea = forwardRef<TiptapHandle, TiptapTextAreaProps>(
  ({ onSubmit }, ref) => {
    const { orgMembers } = useOrganizationStore();

    // Keep the latest onSubmit reachable from the editor's (one-time) keymap.
    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;

    const editor = useEditor(
      {
        extensions: [
          StarterKit,
          Mention.configure({
            HTMLAttributes: { class: "mention" },
            suggestion: makeMentionSuggestion([
              {
                id: "consecto",
                name: "consecto",
                image: icons.robot,
              },
              ...orgMembers.map((mem) => mem.user),
            ]),
          }),
        ],
        content: "",
        // Don't render immediately on the server to avoid SSR issues
        immediatelyRender: false,
        editorProps: {
          attributes: {
            class:
              "min-h-[80px] max-h-40 overflow-y-auto px-3 py-2 text-sm outline-none focus:outline-none prose prose-sm max-w-none",
          },
          handleKeyDown: (_view, event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onSubmitRef.current?.();
              return true;
            }
            return false;
          },
        },
      },
      [orgMembers],
    );

    useImperativeHandle(
      ref,
      () => ({
        getText: () => editor?.getText().trim() ?? "",
        getHTML: () => editor?.getHTML() ?? "",
        getMentions: () => {
          const ids: Set<string> = new Set();
          editor?.state.doc.descendants((node) => {
            if (node.type.name === "mention" && node.attrs.id) {
              ids.add(node.attrs.id as string);
            }
          });
          return Array.from(ids);
        },
        clear: () => editor?.commands.clearContent(true),
      }),
      [editor],
    );

    if (!editor) return null;

    return (
      <div className="flex w-full flex-col">
        <MenuBar editor={editor} />
        <div className="max-h-40 min-h-20 w-full overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);
TiptapTextArea.displayName = "TiptapTextArea";
