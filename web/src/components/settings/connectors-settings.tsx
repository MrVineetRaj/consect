import React from "react";
import {
  CheckCircle2Icon,
  PlugIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type Connector = {
  name: string;
  description: string;
  connected: boolean;
};

const CONNECTORS: Connector[] = [
  {
    name: "Google Drive",
    description: "Sync documents and let Consecto search your files.",
    connected: false,
  },
  {
    name: "Notion",
    description: "Pull pages and databases into your knowledge base.",
    connected: false,
  },
  {
    name: "Slack",
    description: "Bring conversations and threads into the workspace.",
    connected: false,
  },
  {
    name: "GitHub",
    description: "Connect repositories for code-aware answers.",
    connected: false,
  },
];

export const ConnectorsSettings = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="w-full px-8 py-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Connectors</h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Link external tools so Consecto can draw on your data wherever it
              lives.
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/30 text-primary"
          >
            <SparklesIcon className="size-3.5" />
            Integrations
          </Badge>
        </header>

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {CONNECTORS.map((connector) => (
            <div
              key={connector.name}
              className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                  <PlugIcon className="size-5" />
                </div>
                {connector.connected ? (
                  <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                    <CheckCircle2Icon className="size-3.5" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not connected</Badge>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">{connector.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {connector.description}
                </p>
              </div>

              <Button
                variant={connector.connected ? "outline" : "default"}
                size="sm"
                className={cn("mt-auto w-full gap-1.5")}
              >
                {connector.connected ? (
                  "Manage"
                ) : (
                  <>
                    <PlusIcon className="size-3.5" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
