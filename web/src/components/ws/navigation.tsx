"use client";
import Link from "next/link";
import React from "react";
import {
  BellIcon,
  CogIcon,
  HomeIcon,
  MessageSquare,
  MessageSquareIcon,
  StarsIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const SIDE_NAV = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/ws",
  },
  {
    icon: StarsIcon,
    label: "AI Hub",
    href: "/ws/ai-hub",
  },
  {
    icon: MessageSquareIcon,
    label: "DM",
    href: "/ws/dm",
  },
  {
    icon: BellIcon,
    label: "Activity",
    href: "/ws/activity",
  },
  {
    icon: CogIcon,
    label: "Settings",
    href: "/ws/settings",
  },
];
export const Navigation = () => {
  const pathname = usePathname();
  return (
    <div className="flex flex-col items-center gap-3">
      {SIDE_NAV.map((nav) => {
        return (
          <Link
            href={nav.href}
            key={nav.href}
            className={cn(
              "flex flex-col items-center p-2 rounded",
              pathname == nav.href.split("#")[0] && "bg-background",
            )}
          >
            <nav.icon className="size-5" />
            <p className="text-xs text-center">{nav.label}</p>
          </Link>
        );
      })}
    </div>
  );
};
