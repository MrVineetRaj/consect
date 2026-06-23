"use client";
import { cn } from "@/lib/utils";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import React from "react";
import { Avatar } from "../ui/avatar";
import Image from "next/image";
import { icons } from "@/lib/assets";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const SideBottomActions = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const actionClasses = cn(
    "flex size-9 items-center justify-center rounded-xl",
    "text-muted-foreground hover:text-foreground",
    "transition-all duration-200 ease-out hover:bg-background/60",
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Toggle theme"
              className={actionClasses}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {mounted && isDark ? (
                <SunIcon className="size-5" />
              ) : (
                <MoonIcon className="size-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isDark ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/ws/settings"
              aria-label="Profile"
              className="rounded-full ring-offset-background transition-all duration-200 ease-out hover:opacity-90 hover:ring-2 hover:ring-primary/40 hover:ring-offset-2"
            >
              <Avatar className="size-9 rounded-full">
                <Image
                  src={icons.avatar}
                  height={50}
                  width={50}
                  alt="profile"
                  className="rounded-full"
                />
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Profile</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Log out"
              className={cn(
                actionClasses,
                "hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={() => {
                logout().then(() => router.push("/auth"));
              }}
            >
              <LogOutIcon className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
