"use client";
import { ApiSettings } from "@/components/settings/api-settings";
import { ConnectorsSettings } from "@/components/settings/connectors-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { cn } from "@/lib/utils";
import { KeyRoundIcon, PlugIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

const NAVIGATION = [
  { label: "General", tab: "general", icon: UserIcon },
  { label: "Connectors", tab: "connectors", icon: PlugIcon },
  { label: "API", tab: "api", icon: KeyRoundIcon },
] as const;

type SettingsTab = (typeof NAVIGATION)[number]["tab"];

const SettingsContent = () => {
  const searchParams = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: SettingsTab = NAVIGATION.some((it) => it.tab === param)
    ? (param as SettingsTab)
    : "general";

  return (
    <div className="flex-1 min-h-0 flex">
      <aside className="flex w-60 flex-col gap-1 border-r border-border/60 p-3">
        <h2 className="px-3 pb-2 text-lg font-semibold tracking-tight">
          Settings
        </h2>
        {NAVIGATION.map((it) => {
          const isActive = activeTab === it.tab;
          return (
            <Link
              key={it.tab}
              href={`/ws/settings?tab=${it.tab}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-colors duration-200",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive && "bg-primary/10 text-primary hover:bg-primary/10",
              )}
            >
              <it.icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </aside>
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "connectors" && <ConnectorsSettings />}
        {activeTab === "api" && <ApiSettings />}
      </div>
    </div>
  );
};

const Settings = () => {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
};

export default Settings;
