"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConversationClient } from "@/hooks/use-conversations";
import { icons } from "@/lib/assets";
import { useOrganizationStore } from "@/store/organization-store";
import { useUserStore } from "@/store/user-store";
import {
  ArrowLeftIcon,
  CalendarIcon,
  MailIcon,
  MessageSquareIcon,
  ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const UserProfileView = ({
  member,
  organizationId,
  currentUserId,
}: {
  member: IWorkspaceMemberDetail;
  organizationId: string;
  // From the server session, so self-detection also holds during SSR.
  currentUserId?: string | null;
}) => {
  const [dmPending, setDmPending] = useState(false);
  const router = useRouter();
  const { token } = useUserStore();
  const { orgPresence } = useOrganizationStore();
  const { createConversation } = useConversationClient();

  const isSelf = member.userId === currentUserId;
  const isOnline = orgPresence[member.userId] ?? false;

  async function handleOpenDm() {
    if (!token || dmPending) return;
    setDmPending(true);
    try {
      // DMs are idempotent server-side — this returns the existing one.
      const { result } = await createConversation({
        token,
        organizationId,
        type: "dm",
        memberIds: [member.userId],
      });
      router.push(`/ws/dm/${result.id}`);
    } catch {
      toast.error("Failed to open conversation");
      setDmPending(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto p-5">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ws/members">
            <ArrowLeftIcon /> Members
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/50 px-6 py-10 text-center">
        <div className="relative">
          <Avatar className="size-24">
            <AvatarImage
              src={member.image ?? icons.avatar}
              alt={member.name}
              className="size-24"
            />
            <AvatarFallback className="text-2xl">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <span
            className={
              "absolute bottom-1 right-1 size-4 rounded-full ring-2 ring-background " +
              (isOnline ? "bg-green-500" : "bg-muted-foreground/40")
            }
            title={isOnline ? "Online" : "Offline"}
          />
        </div>

        <div>
          <h1 className="text-xl font-semibold leading-tight">
            {member.name}
            {isSelf && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>

        <Badge
          variant={member.role === "owner" ? "default" : "secondary"}
          className="gap-1 capitalize"
        >
          <ShieldIcon className="size-3" /> Workspace {member.role}
        </Badge>

        {!isSelf && (
          <Button onClick={handleOpenDm} disabled={dmPending} className="mt-1">
            {dmPending ? (
              <Spinner className="size-4" />
            ) : (
              <MessageSquareIcon />
            )}
            Message
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <MailIcon className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <a
              href={`mailto:${member.email}`}
              className="truncate text-sm hover:underline"
            >
              {member.email}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Joined workspace
            </p>
            <p className="text-sm">{formatDate(member.joinedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
