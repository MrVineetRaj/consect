"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { HexagonIcon } from "lucide-react";
import { Navigation } from "./navigation";
import { SideBottomActions } from "./side-bottom-actions";
import { OrganizationModel } from "./organizations-model";
import { CommandSlit } from "./command-slit";
import { useUserStore } from "@/store/user-store";
import { socket } from "@/lib/socket-io";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useOrganizationStore } from "@/store/organization-store";

const BrandMark = () => (
  <Link
    href="/ws/home"
    aria-label="Home"
    className="group relative grid size-10 place-items-center rounded-2xl bg-linear-to-br from-primary to-accent text-primary-foreground shadow-md transition-transform duration-200 ease-out hover:scale-105"
  >
    <HexagonIcon className="size-5 fill-current/15" strokeWidth={2.25} />
  </Link>
);

export const WorkspaceShell = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { user } = useUserStore();
  const { userPreference } = useUserPreferenceStore();
  const { setOrgPresence } = useOrganizationStore();
  useEffect(() => {
    socket.connect();
    socket.emit("mark_online", {
      userId: user?.id,
      organizationId: userPreference?.organizationId,
    });
    const interval = setInterval(() => {
      socket.emit("mark_online", {
        userId: user?.id,
        organizationId: userPreference?.organizationId,
      });
    }, 20 * 1000);

    socket.on("presence:update", (res) => {
      setOrgPresence(res?.orgPresence ?? {});
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);
  return (
    <div className="relative flex h-svh gap-3 overflow-hidden bg-linear-to-br from-primary/20 via-background to-accent/15 p-3">
      {/* Left rail: brand + navigation, with quick actions pinned to the bottom */}
      <aside className="flex w-16 flex-col items-center justify-between py-1">
        <div className="flex flex-col items-center gap-5">
          <BrandMark />
          <Navigation />
        </div>
        <SideBottomActions />
      </aside>

      {/* Main surface floats above the gradient backdrop */}
      <main className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-background shadow-xl ring-1 ring-border/60">
        <CommandSlit />
        {children}
      </main>

      <OrganizationModel />
    </div>
  );
};
