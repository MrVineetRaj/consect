import { Badge } from "@/components/ui/badge";
import { OrganizationModel } from "@/components/ws/organizations-model";
import { useConversationClient } from "@/hooks/use-conversations";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ArrowRightIcon,
  HashIcon,
  MessagesSquareIcon,
  ScanSearchIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/ws/ai-hub",
    label: "AI Hub",
    description: "Add knowledge sources and let Consecto answer from them.",
    icon: ScanSearchIcon,
  },
  {
    href: "/ws/activity",
    label: "Activity",
    description: "Catch up on mentions, replies and reactions.",
    icon: ActivityIcon,
  },
  {
    href: "/ws/settings",
    label: "Settings",
    description: "Manage your profile, connectors and API keys.",
    icon: SettingsIcon,
  },
];

const HomePage = async () => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();
  const token = session?.session.token;
  if (!token) {
    redirect("/auth");
  }

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);
  const organizationId = preference?.organizationId;

  console.log(preference)

  if (preference?.lastOpenedHomeConversation) {
    redirect(`/ws/home/${preference.lastOpenedHomeConversation}`);
  }

  const { listRecentConversations } = useConversationClient();
  const conversations = organizationId
    ? (await listRecentConversations({ token, organizationId })).result
    : { channels: [], dmAndGroups: [] };

  const channels = conversations.channels ?? [];
  const dmAndGroups = conversations.dmAndGroups ?? [];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const dmLabel = (c: (typeof dmAndGroups)[number]) =>
    c.name ?? c.members.map((m) => m.name).join(", ");

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <div className="flex w-full flex-col gap-8 p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Jump back into a conversation, or pick up where your team left
              off.
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-primary/30 text-primary"
          >
            <SparklesIcon className="size-3.5" />
            Your workspace
          </Badge>
        </div>

        {/* Quick actions */}
        <div className="grid gap-5 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Jump back in */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Channels */}
          <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                <HashIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Channels
                </h2>
                <p className="text-sm text-muted-foreground">
                  {channels.length} channel{channels.length === 1 ? "" : "s"} in
                  this workspace
                </p>
              </div>
            </div>

            {channels.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No channels yet. Create one from the sidebar to get started.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {channels.slice(0, 5).map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/ws/home/${channel.id}`}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                      "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <HashIcon className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">
                      {channel.name ?? "Untitled channel"}
                    </span>
                    <ArrowRightIcon className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Direct messages */}
          <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Direct messages
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dmAndGroups.length} recent conversation
                  {dmAndGroups.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {dmAndGroups.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No direct messages yet. Start a conversation with a teammate.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {dmAndGroups.slice(0, 5).map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/ws/home/${conversation.id}`}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                      "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <MessagesSquareIcon className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{dmLabel(conversation)}</span>
                    <ArrowRightIcon className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* AI Hub feature highlight */}
        <div className="grid gap-6 rounded-2xl border bg-linear-to-br from-primary/5 to-accent/5 p-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 text-primary"
            >
              <SparklesIcon className="size-3.5" />
              Powered by AI Hub
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ask anything, grounded in
              <br />
              <span className="text-primary">your team&apos;s knowledge.</span>
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Mention <span className="font-medium">@consecto</span> in any
              channel to get answers cited from the documents, links and notes
              your team has added to the AI Hub.
            </p>
            <Link
              href="/ws/ai-hub"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open the AI Hub
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="grid aspect-video place-items-center gap-2 rounded-xl border bg-background/60 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <ScanSearchIcon className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide">
                Semantic search
              </p>
              <p className="text-xs text-muted-foreground">
                Grounded answers across every source
              </p>
            </div>
          </div>
        </div>
      </div>

      <OrganizationModel />
    </div>
  );
};

export default HomePage;
