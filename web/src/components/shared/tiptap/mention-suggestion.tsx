"use client";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { icons } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";

type MentionItem = { id: string; label: string; image: string | null };

const MentionList = forwardRef(
  (
    {
      items,
      command,
    }: { items: MentionItem[]; command: (i: MentionItem) => void },
    ref,
  ) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelected((s) => (s + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          if (items[selected]) command(items[selected]);
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="z-50 flex max-h-60 w-56 flex-col overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
        {items.length ? (
          items.map((item, i) => (
            <span
              key={item.id}
              onClick={() => command(item)}
              className={`rounded p-2 flex items-center text-sm hover:bg-accent/50 f gap-2 ${
                i === selected ? "bg-accent/50" : ""
              }`}
            >
              <Avatar>
                <Image src={item.image ?? icons.avatar} alt="" height={50} width={50} className="rounded-full" />
              </Avatar>
              {item.label}
            </span>
          ))
        ) : (
          <div className="px-2 py-1 text-sm text-muted-foreground">
            No results
          </div>
        )}
      </div>
    );
  },
);
MentionList.displayName = "MentionList";

// `users` is your IUser[] — pass it in when you build the extension
export const makeMentionSuggestion = (
  users: {
    id: string;
    name: string;
    image?: string | undefined | null;
  }[],
) => ({
  items: ({ query }: { query: string }) =>
    users
      .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        label: u.name,
        image: u.image ?? icons.avatar,
      })),

  render: () => {
    let component: ReactRenderer;
    let popup: Instance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onUpdate: (props: any) => {
        component.updateProps(props);
        popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },
      onKeyDown: (props: any) => {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown(props);
      },
      onExit: () => {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
});
