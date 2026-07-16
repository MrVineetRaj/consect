"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
import { useOrganizationClient } from "@/hooks/use-organization";
import { icons } from "@/lib/assets";
import { useUserStore } from "@/store/user-store";
import {
  MessageSquareIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

/** Column order of the workspace permissions grid. */
const CAPABILITIES: { key: OrgAccessKey; label: string; hint: string }[] = [
  { key: "inviteMember", label: "Invite", hint: "Invite people to the workspace" },
  { key: "removeMember", label: "Remove", hint: "Remove workspace members" },
  { key: "changeMemberRole", label: "Roles", hint: "Change workspace roles" },
  {
    key: "changeMemberConfig",
    label: "Permissions",
    hint: "Edit these per-member permissions",
  },
  { key: "aiHubWrite", label: "AI Hub", hint: "Upload and manage AI Hub resources" },
  { key: "createChannel", label: "Channels", hint: "Create channels" },
];

const roleBadgeVariant = (role: string | null) =>
  role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";

export const WorkspaceMembersView = ({
  initialMembers,
  organizationId,
}: {
  initialMembers: IWorkspaceMembers;
  organizationId: string;
}) => {
  const [data, setData] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [dmPendingFor, setDmPendingFor] = useState<string | null>(null);
  const router = useRouter();
  const { token, user } = useUserStore();
  const {
    updateWorkspaceMemberRole,
    updateWorkspaceMemberAccess,
    removeWorkspaceMember,
  } = useOrganizationClient();
  const { createConversation } = useConversationClient();

  const { members } = data;
  const my = data.my;

  const canManage =
    !!my &&
    (my.access.changeMemberConfig ||
      my.access.changeMemberRole ||
      my.access.removeMember);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = useMemo(
    () =>
      normalizedQuery
        ? members.filter(
            (m) =>
              m.name.toLowerCase().includes(normalizedQuery) ||
              m.email.toLowerCase().includes(normalizedQuery),
          )
        : members,
    [members, normalizedQuery],
  );

  const patchMember = (
    userId: string,
    patch: Partial<IWorkspaceMemberDetail>,
  ) =>
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.userId === userId ? { ...m, ...patch } : m,
      ),
    }));

  async function handleOpenDm(member: IWorkspaceMemberDetail) {
    if (!token || dmPendingFor) return;
    setDmPendingFor(member.userId);
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
    } finally {
      setDmPendingFor(null);
    }
  }

  async function handleToggleAccess(
    member: IWorkspaceMemberDetail,
    key: OrgAccessKey,
    value: boolean,
  ) {
    const previousAccess = member.access;
    patchMember(member.userId, {
      access: { ...member.access, [key]: value },
    });
    try {
      const { result } = await updateWorkspaceMemberAccess({
        token,
        organizationId,
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
    member: IWorkspaceMemberDetail,
    role: "admin" | "member",
  ) {
    const previous = { role: member.role, access: member.access };
    patchMember(member.userId, { role });
    try {
      await updateWorkspaceMemberRole({
        token,
        organizationId,
        memberId: member.memberId,
        role,
      });
      const isAdmin = role === "admin";
      const defaults: OrgAccess = {
        removeMember: isAdmin,
        inviteMember: isAdmin,
        changeMemberConfig: isAdmin,
        changeMemberRole: false,
        aiHubWrite: isAdmin,
        createChannel: true,
      };
      patchMember(member.userId, {
        access: { ...defaults, ...member.overrides },
      });
      toast.success(
        `${member.name} is now ${isAdmin ? "a workspace admin" : "a member"}`,
      );
    } catch {
      patchMember(member.userId, previous);
      toast.error("Failed to change role");
    }
  }

  async function handleRemove(member: IWorkspaceMemberDetail) {
    try {
      await removeWorkspaceMember({
        token,
        organizationId,
        memberId: member.memberId,
      });
      setData((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.memberId !== member.memberId),
      }));
      toast.success(`${member.name} removed from the workspace`);
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <UsersIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">Members</h1>
          <p className="text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? "person" : "people"} in
            this workspace
          </p>
        </div>
        <div className="relative w-56">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="directory" className="flex-1">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          {canManage && (
            <TabsTrigger value="permissions">
              <ShieldIcon className="size-3.5" /> Permissions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          {filteredMembers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
              No members match your search
            </p>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-border/60">
              {filteredMembers.map((member) => {
                const isSelf = member.userId === user?.id;
                return (
                  <div
                    key={member.memberId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={member.image ?? icons.avatar}
                        alt={member.name}
                      />
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        <Link
                          href={`/ws/members/${member.userId}`}
                          className="hover:underline"
                        >
                          {member.name}
                        </Link>
                        {isSelf && (
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
                    <Badge
                      variant={roleBadgeVariant(member.role)}
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Message ${member.name}`}
                        disabled={dmPendingFor !== null}
                        onClick={() => handleOpenDm(member)}
                      >
                        {dmPendingFor === member.userId ? (
                          <Spinner className="size-4" />
                        ) : (
                          <MessageSquareIcon />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {canManage && my && (
          <TabsContent value="permissions" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              What each member can do across the workspace. The owner always
              has full access; toggles override everyone else&apos;s role
              defaults.
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
                  {filteredMembers.map((member) => {
                    const isOwnerRow = member.role === "owner";
                    const isSelf = member.userId === user?.id;
                    const rowLocked = isOwnerRow || isSelf;
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
                              <Link
                                href={`/ws/members/${member.userId}`}
                                className="hover:underline"
                              >
                                {member.name}
                              </Link>
                              {isSelf && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rowLocked || !my.access.changeMemberRole ? (
                            <Badge
                              variant={roleBadgeVariant(member.role)}
                              className="capitalize"
                            >
                              {member.role}
                            </Badge>
                          ) : (
                            <Select
                              value={member.role}
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
                                isOwnerRow ? true : member.access[cap.key]
                              }
                              disabled={
                                rowLocked || !my.access.changeMemberConfig
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
                                aria-label={`Remove ${member.name} from workspace`}
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
