import React from "react";
import {
  CopyIcon,
  KeyRoundIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type ApiKey = {
  id: string;
  label: string;
  masked: string;
  createdAt: string;
  lastUsed: string;
};

const API_KEYS: ApiKey[] = [];

export const ApiSettings = () => {
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
          <Button className="gap-1.5">
            <PlusIcon className="size-4" />
            Create API key
          </Button>
        </header>

        {/* Keys list / empty state */}
        {API_KEYS.length === 0 ? (
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
            <Button variant="outline" size="sm" className="mt-1 gap-1.5">
              <PlusIcon className="size-3.5" />
              Create API key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {API_KEYS.map((key) => (
              <div
                key={key.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                  <KeyRoundIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{key.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {key.masked}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1.5">
                  Last used {key.lastUsed}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy key"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Revoke key"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <TrashIcon className="size-4" />
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
    </div>
  );
};
