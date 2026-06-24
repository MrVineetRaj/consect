import { useOrganizationStore } from "@/store/organization-store";
import Mention from "@tiptap/extension-mention";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { makeMentionSuggestion } from "./mention-suggestion";

export const TiptapInput = () => {
  const { orgMembers } = useOrganizationStore();

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: { class: "mention" },
          suggestion: makeMentionSuggestion(orgMembers.map((mem) => mem.user)),
        }),
      ],
      content: "<p>Hello World! 🌎️</p>",
      // Don't render immediately on the server to avoid SSR issues
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "min-h-[80px] max-h-60 overflow-y-auto px-3 py-2 text-sm outline-none focus:outline-none prose prose-sm max-w-none",
        },
      },
    },
    [orgMembers],
  );

  if (!editor) return null;

  return (
    <div className="rounded-md border bg-background/60">
      <EditorContent editor={editor} />
    </div>
  );
};
