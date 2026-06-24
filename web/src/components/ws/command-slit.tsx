"use client";
import { useOrganizationClient } from "@/hooks/use-organization";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useOrganizationStore } from "@/store/organization-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";
import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback } from "../ui/avatar";

const OrganizationSwitcher = () => {
  const { token } = useUserStore();
  const { userPreference, setUserPreference } = useUserPreferenceStore();
  const { organizations, setOrganizations } = useOrganizationStore();
  const { listOrganizations } = useOrganizationClient();
  const { updateUserPreference } = usePreferenceClient();

  const [switching, setSwitching] = useState(false);

  // Self-sufficient: load the org list if another surface hasn't already.
  useEffect(() => {
    if (!token || organizations.length > 0) return;
    let active = true;
    (async () => {
      const res = await listOrganizations(token);
      if (active && res.success && res.result) {
        setOrganizations(res.result);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleChange(organizationId: string) {
    if (!token || switching || organizationId === userPreference?.organizationId)
      return;
    setSwitching(true);
    const res = await updateUserPreference(token, { organizationId });
    if (res.success && res.result) {
      setUserPreference({ userPreference: res.result });
      // Org changed: hard-reload so every server component re-fetches for the
      // new organization. Land on /ws since deep ids belong to the old org.
      window.location.assign("/ws");
      return;
    }
    toast.error(res.message ?? "Failed to switch organization");
    setSwitching(false);
  }

  return (
    <Select
      value={userPreference?.organizationId ?? undefined}
      onValueChange={handleChange}
      disabled={switching || organizations.length === 0}
    >
      <SelectTrigger
        size="sm"
        className="border-0 shadow-none bg-transparent hover:bg-muted focus-visible:ring-0 gap-2 max-w-52"
      >
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent align="start">
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">
                {org.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{org.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const CommandSlit = () => {
  return (
    <div className="w-full p-2 min-h-12 flex items-center gap-2">
      <OrganizationSwitcher />
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-8 rounded-md bg-muted/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted transition-colors"
        />
      </div>
    </div>
  );
};
