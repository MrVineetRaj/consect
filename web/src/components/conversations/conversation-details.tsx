"use client";
import { conversationLabel } from "@/components/conversations/conversation-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConversationClient } from "@/hooks/use-conversations";
import { icons } from "@/lib/assets";
import { useUserStore } from "@/store/user-store";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileIcon,
  HashIcon,
  LockIcon,
  ShieldIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
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
    month: "short",
    year: "numeric",
  });

/** Column order of the permissions grid. */
const CAPABILITIES: { key: ChannelAccessKey; label: string; hint: string }[] = [
  { key: "inviteMember", label: "Invite", hint: "Invite workspace members" },
  { key: "removeMember", label: "Remove", hint: "Remove members" },
  { key: "changeMemberRole", label: "Roles", hint: "Change member roles" },
  {
    key: "changeMemberConfig",
    label: "Permissions",
    hint: "Edit these per-member permissions",
  },
];

const roleBadgeVariant = (role: string | null) =>
  role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";

/** publicId paths look like `consect/ws_x/name_ab12.pdf` — show the leaf. */
const fileName = (publicId: string) => publicId.split("/").pop() ?? publicId;

export const ConversationDetailsView = ({
  initialDetails,
  initialFiles,
  organizationId,
  backHref,
}: {
  initialDetails: IConversationDetails;
  initialFiles: IConversationFile[];
  organizationId: string;
  backHref: string;
}) => {
  const [details, setDetails] = useState(initialDetails);
  const { token, user } = useUserStore();
  const { updateMemberRole, updateMemberAccess, removeMember } =
    useConversationClient();

  const { conversation, members } = details;
  const my = details.my;

  const isChannel = conversation.type === "channel";
  const TypeIcon =
    isChannel && conversation.visibility === "private"
      ? LockIcon
      : isChannel
        ? HashIcon
        : UsersIcon;

  const canManage =
    conversation.type !== "dm" &&
    !!my &&
    (my.access.changeMemberConfig ||
      my.access.changeMemberRole ||
      my.access.removeMember);

  const patchMember = (
    userId: string,
    patch: Partial<IConversationMemberDetail>,
  ) =>
    setDetails((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.userId === userId ? { ...m, ...patch } : m,
      ),
    }));

  async function handleToggleAccess(
    member: IConversationMemberDetail,
    key: ChannelAccessKey,
    value: boolean,
  ) {
    const previousAccess = member.access;
    patchMember(member.userId, {
      access: { ...member.access, [key]: value },
    });
    try {
      const { result } = await updateMemberAccess({
        token,
        organizationId,
        conversationId: conversation.id,
        userId: member.userId,
        config: { [key]: value },
      });
      patchMember(member.userId, {
        access: result.access,
        overrides: result.overrides,
      });
    } catch {
      patchMember(member.userId, { access: previousAccess });
      toast.error("Failed to update permission");
    }
  }

  async function handleRoleChange(
    member: IConversationMemberDetail,
    role: "admin" | "member",
  ) {
    const previous = { role: member.role, access: member.access };
    // Role defaults drive most capabilities, so refetching the merged access
    // would be ideal; approximating client-side keeps the grid responsive.
    patchMember(member.userId, { role });
    try {
      await updateMemberRole({
        token,
        organizationId,
        conversationId: conversation.id,
        memberId: member.memberId,
        role,
      });
      const defaults: ChannelAccess = {
        removeMember: role === "admin",
        inviteMember: true,
        changeMemberConfig: role === "admin",
        changeMemberRole: false,
      };
      patchMember(member.userId, {
        access: { ...defaults, ...member.overrides },
      });
      toast.success(`${member.name} is now ${role === "admin" ? "an admin" : "a member"}`);
    } catch {
      patchMember(member.userId, previous);
      toast.error("Failed to change role");
    }
  }

  async function handleRemove(member: IConversationMemberDetail) {
    try {
      await removeMember({
        token,
        organizationId,
        conversationId: conversation.id,
        memberId: member.memberId,
      });
      setDetails((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.memberId !== member.memberId),
      }));
      toast.success(`${member.name} removed`);
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Back to conversation">
          <Link href={backHref}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <TypeIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">
            {conversationLabel(details, user?.id)}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.description || "No description"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {conversation.type && (
            <Badge variant="secondary" className="capitalize">
              {conversation.type}
            </Badge>
          )}
          {isChannel && conversation.visibility && (
            <Badge variant="outline" className="capitalize">
              {conversation.visibility}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="members" className="flex-1">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="files">Files ({initialFiles.length})</TabsTrigger>
          {canManage && (
            <TabsTrigger value="permissions">
              <ShieldIcon className="size-3.5" /> Permissions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <div className="divide-y divide-border/60 rounded-xl border border-border/60">
            {members.map((member) => (
              <div key={member.memberId} className="flex items-center gap-3 px-4 py-3">
                <Avatar>
                  <AvatarImage
                    src={member.image ?? icons.avatar}
                    alt={member.name}
                  />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {member.userId === user?.id && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <span className="hidden text-[11px] text-muted-foreground sm:block">
                  Joined {formatDate(member.joinedAt)}
                </span>
                {(member.orgRole === "owner" || member.orgRole === "admin") && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <ShieldIcon className="size-3" /> Workspace {member.orgRole}
                  </Badge>
                )}
                <Badge variant={roleBadgeVariant(member.role)} className="capitalize">
                  {member.role ?? "member"}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          {initialFiles.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border/60 py-12 text-center">
              <FileIcon className="size-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No files shared in this conversation yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-border/60">
              {initialFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <FileIcon className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {fileName(file.publicId)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Shared by {file.sender.name} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" asChild aria-label="Open file">
                    <a href={file.url} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {canManage && my && (
          <TabsContent value="permissions" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              What each member can do in this{" "}
              {conversation.type === "group" ? "group" : "channel"}. The owner
              and workspace owners/admins always have full access; toggles
              override everyone else&apos;s role defaults.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Member</TableHead>
                    <TableHead className="w-32">Role</TableHead>
                    {CAPABILITIES.map((cap) => (
                      <TableHead
                        key={cap.key}
                        className="text-center"
                        title={cap.hint}
                      >
                        {cap.label}
                      </TableHead>
                    ))}
                    {my.access.removeMember && (
                      <TableHead className="w-12" aria-label="Remove" />
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isOwnerRow = member.role === "owner";
                    const isSelf = member.userId === user?.id;
                    const rowLocked = isOwnerRow || isSelf;
                    // Workspace owners/admins always have full channel
                    // access, so their toggles are informational only.
                    const isOrgPrivileged =
                      member.orgRole === "owner" || member.orgRole === "admin";
                    return (
                      <TableRow key={member.memberId}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar size="sm">
                              <AvatarImage
                                src={member.image ?? icons.avatar}
                                alt={member.name}
                              />
                              <AvatarFallback>
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">
                              {member.name}
                              {isSelf && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                              {isOrgPrivileged && (
                                <ShieldIcon
                                  className="ml-1 inline size-3 text-primary"
                                  aria-label={`Workspace ${member.orgRole}`}
                                />
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOwnerRow || isSelf || !my.access.changeMemberRole ? (
                            <Badge
                              variant={roleBadgeVariant(member.role)}
                              className="capitalize"
                            >
                              {member.role ?? "member"}
                            </Badge>
                          ) : (
                            <Select
                              value={member.role ?? "member"}
                              onValueChange={(role) =>
                                handleRoleChange(
                                  member,
                                  role as "admin" | "member",
                                )
                              }
                            >
                              <SelectTrigger size="sm" className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        {CAPABILITIES.map((cap) => (
                          <TableCell key={cap.key} className="text-center">
                            <Switch
                              checked={
                                isOwnerRow || isOrgPrivileged
                                  ? true
                                  : member.access[cap.key]
                              }
                              disabled={
                                rowLocked ||
                                isOrgPrivileged ||
                                !my.access.changeMemberConfig
                              }
                              onCheckedChange={(value) =>
                                handleToggleAccess(member, cap.key, value)
                              }
                              aria-label={`${cap.hint} — ${member.name}`}
                            />
                          </TableCell>
                        ))}
                        {my.access.removeMember && (
                          <TableCell>
                            {!rowLocked && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${member.name}`}
                                onClick={() => handleRemove(member)}
                              >
                                <Trash2Icon />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
