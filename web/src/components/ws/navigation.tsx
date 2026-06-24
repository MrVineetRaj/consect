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
              "group flex w-full flex-col items-center gap-1 rounded-xl px-1.5 py-2",
              "transition-all duration-200 ease-out",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-background/60",
              isActive &&
                "bg-background text-foreground shadow-sm hover:bg-background",
            )}
          >
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
                isActive && "text-foreground",
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
