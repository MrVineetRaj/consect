"use client";
import { useOrganizationClient } from "@/hooks/use-organization";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useOrganizationStore } from "@/store/organization-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { useUserStore } from "@/store/user-store";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Avatar, AvatarFallback } from "../ui/avatar";

const roleVariant: Record<
  IOrganization["role"],
  "default" | "secondary" | "outline"
> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export const OrganizationModel = () => {
  const { token } = useUserStore();
  const { userPreference, setUserPreference } = useUserPreferenceStore();
  const { organizations, setOrganizations, addOrganization } =
    useOrganizationStore();
  const { listOrganizations, createOrganization } = useOrganizationClient();
  const { updateUserPreference } = usePreferenceClient();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      setLoading(true);
      const res = await listOrganizations(token);
      if (!active) return;
      if (res.success && res.result) {
        setOrganizations(res.result);
        setShowCreate(res.result.length === 0);
      } else if (res.message) {
        toast.error(res.message);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [token]);

  // Only surface the modal while the user has no active organization selected.
  if (userPreference?.organizationId) return null;

  async function handleSelect(organizationId: string) {
    if (!token || selectingId) return;
    setSelectingId(organizationId);
    const res = await updateUserPreference(token, { organizationId });
    if (res.success && res.result) {
      setUserPreference({ userPreference: res.result });
      // Org changed: hard-reload so every server component re-fetches for the
      // new organization. Land on /ws since deep ids belong to the old org.
      window.location.assign("/ws");
      return;
    }
    toast.error(res.message ?? "Failed to select organization");
    setSelectingId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || creating || !name.trim()) return;
    setCreating(true);
    const res = await createOrganization(token, { name: name.trim() });
    if (res.success && res.result) {
      addOrganization(res.result);
      setName("");
      setShowCreate(false);
      toast.success("Organization created");
      await handleSelect(res.result.id);
    } else {
      toast.error(res.message ?? "Failed to create organization");
    }
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-xl border shadow-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Your organizations</h2>
          <p className="text-sm text-muted-foreground">
            Select an organization to enter, or create a new one.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                disabled={!!selectingId}
                onClick={() => handleSelect(org.id)}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
              >
                <Avatar className="size-9">
                  <AvatarFallback>
                    {org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{org.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {org.slug}
                  </span>
                </div>
                {selectingId === org.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Badge variant={roleVariant[org.role]} className="capitalize">
                    {org.role}
                  </Badge>
                )}
              </button>
            ))}

            {organizations.length === 0 && !showCreate && (
              <p className="text-sm text-muted-foreground text-center py-6">
                You are not part of any organization yet.
              </p>
            )}
          </div>
        )}

        {showCreate ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              disabled={creating}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={creating || !name.trim()}
                className="flex-1"
              >
                {creating ? <Spinner className="size-4" /> : "Create"}
              </Button>
              {organizations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={creating}
                  onClick={() => {
                    setShowCreate(false);
                    setName("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          !loading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(true)}
              className="w-full"
            >
              <Plus className="size-4" />
              Create organization
            </Button>
          )
        )}
      </div>
    </div>
  );
};
