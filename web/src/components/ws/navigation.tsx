"use client";
import Link from "next/link";
import React from "react";
import {
  BellIcon,
  CogIcon,
  HomeIcon,
  MessageSquareIcon,
  StarsIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "../activity/notification-badge";
const SIDE_NAV = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/ws/home",
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
    <nav className="flex flex-col items-center gap-1.5">
      {SIDE_NAV.map((nav) => {
        const isActive = pathname.includes(nav.href);
        return (
          <Link
            href={nav.href}
            key={nav.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex w-full flex-col items-center gap-1 rounded-2xl px-1.5 py-2",
              "transition-all duration-200 ease-out",
              "text-muted-foreground hover:text-foreground hover:bg-background/70",
              isActive &&
                "bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/10",
            )}
          >
            {/* Active indicator bar on the rail edge */}
            <span
              className={cn(
                "absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary",
                "transition-all duration-200 ease-out",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0",
              )}
            />
            {nav.label === "Activity" && <NotificationBadge />}
            <nav.icon
              className={cn(
                "size-5 transition-transform duration-200 ease-out",
                "group-hover:scale-110",
                isActive && "text-primary",
              )}
            />
            <span
              className={cn(
                "text-[10px] leading-none font-medium tracking-tight text-center",
                isActive && "text-primary",
              )}
            >
              {nav.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
