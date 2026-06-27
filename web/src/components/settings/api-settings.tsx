"use client";

import React, { useEffect, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useApiKeyClient } from "@/hooks/use-api";
import { useUserStore } from "@/store/user-store";
import { useUserPreferenceStore } from "@/store/user-preference-store";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Public key is safe to show, but keep the list tidy: first 10 chars + tail.
const maskKey = (value: string) =>
  value.length <= 16
    ? value
    : `${value.slice(0, 10)}${"•".repeat(6)}${value.slice(-4)}`;

export const ApiSettings = () => {
  const { listApiKeys, createApiKey, deleteApiKey } = useApiKeyClient();
  const token = useUserStore((s) => s.token);
  const organizationId = useUserPreferenceStore(
    (s) => s.userPreference?.organizationId,
  );

  const [keys, setKeys] = useState<IApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // One-time secret reveal
  const [newKey, setNewKey] = useState<IApiKey | null>(null);

  useEffect(() => {
    if (!token || !organizationId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await listApiKeys({ token, organizationId });
        if (active) setKeys(res.result ?? []);
      } catch {
        if (active) toast.error("Failed to load API keys");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, organizationId]);

  const copy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !organizationId) {
      toast.error("Select an organization first");
      return;
    }
    setCreating(true);
    try {
      const res = await createApiKey({
        token,
        organizationId,
        name: name.trim() || undefined,
      });
      setKeys((prev) => [res.result, ...prev]);
      setNewKey(res.result);
      toast.success("API key created");
      setName("");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !organizationId) return;
    setDeletingId(id);
    try {
      await deleteApiKey({ token, organizationId, id });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key deleted");
    } catch {
      toast.error("Failed to delete API key");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="w-full px-8 py-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">API</h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Create keys to access the Consecto API and integrate the workspace
              into your own apps.
            </p>
          </div>
          <Button
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
            disabled={!organizationId}
          >
            <PlusIcon className="size-4" />
            Create API key
          </Button>
        </header>

        {/* Keys list / states */}
        {loading ? (
          <div className="grid w-full place-items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading API keys…</p>
          </div>
        ) : !organizationId ? (
          <div className="grid w-full place-items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <KeyRoundIcon className="size-6" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Select an organization to manage its API keys.
            </p>
          </div>
        ) : keys.length === 0 ? (
          <div className="grid w-full place-items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <KeyRoundIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No API keys yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Generate your first key to start making authenticated requests.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              Create API key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                  <KeyRoundIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {key.name?.trim() || "Untitled key"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {maskKey(key.apiKey)}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1.5">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy key"
                    onClick={() => copy(key.apiKey, key.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {copiedId === key.id ? (
                      <CheckIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Revoke key"
                    disabled={deletingId === key.id}
                    onClick={() => handleDelete(key.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === key.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <TrashIcon className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Docs highlight */}
        <div className="mt-8 grid gap-6 rounded-2xl border bg-linear-to-br from-primary/5 to-accent/5 p-6 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 text-primary"
            >
              <SparklesIcon className="size-3.5" />
              Developer access
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">
              Build on top of Consecto
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Use the REST API to manage conversations, resources, and members
              programmatically. Authenticate every request with a key from this
              page.
            </p>
          </div>
          <div className="grid aspect-video place-items-center gap-2 rounded-xl border bg-background/60 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <KeyRoundIcon className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide">
                API reference
              </p>
              <p className="text-xs text-muted-foreground">
                Endpoints, auth, and rate limits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create key dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setName("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Give your key a name so you can recognize it later. The secret is
              shown only once after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Name</Label>
              <Input
                id="api-key-name"
                placeholder="e.g. Production server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2Icon className="size-4 animate-spin" />}
                Create key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time secret reveal */}
      <Dialog
        open={newKey !== null}
        onOpenChange={(open) => {
          if (!open) setNewKey(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Save your API secret</DialogTitle>
            <DialogDescription>
              This is the only time the secret will be shown. Store it somewhere
              safe — you won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 font-mono text-xs">
                  {newKey?.apiKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Copy API key"
                  onClick={() => newKey && copy(newKey.apiKey, "new-key")}
                >
                  {copiedId === "new-key" ? (
                    <CheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 font-mono text-xs">
                  {newKey?.apiSecret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Copy API secret"
                  onClick={() =>
                    newKey?.apiSecret && copy(newKey.apiSecret, "new-secret")
                  }
                >
                  {copiedId === "new-secret" ? (
                    <CheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
