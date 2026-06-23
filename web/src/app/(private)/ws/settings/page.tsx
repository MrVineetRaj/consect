"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

const NAVIGATION = [
  { label: "General", tab: "general" },
  { label: "Account", tab: "account" },
] as const;

type SettingsTab = (typeof NAVIGATION)[number]["tab"];

const SettingsContent = () => {
  const searchParams = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: SettingsTab =
    NAVIGATION.some((it) => it.tab === param) ? (param as SettingsTab) : "general";

  return (
    <div className="flex h-full">
      <div className="bg-muted w-74 flex flex-col items-end h-full rounded-tr-2xl p-2 gap-2">
        {NAVIGATION.map((it) => (
          <Link
            key={it.tab}
            href={`/ws/settings?tab=${it.tab}`}
            className={cn(
              "p-2 w-full rounded text-right",
              activeTab === it.tab
                && "bg-primary text-white"
                
            )}
          >
            {it.label}
          </Link>
        ))}
      </div>
      <div className="flex-1 p-6">
        {activeTab === "general" && <p>General settings</p>}
        {activeTab === "account" && <p>Account settings</p>}
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
