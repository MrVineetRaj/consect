interface IUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
}

interface IUserPreference {
  userId: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string | null;
  lastOpenedHomeConversation: string | null;
  lastOpenedDMConversation: string | null;
}

type OrganizationRole = "owner" | "admin" | "member";

interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: string | null;
  createdAt: Date;
  role: OrganizationRole;
}

type ConversationVisibility = "public" | "unlisted" | "private";

interface IConversation {
  id: string;
  name: string | null;
  organizationId: string;
  type: "group" | "dm" | "channel" | null;
  description: string | null;
  visibility?: ConversationVisibility;
  image?: string | null;
  /** Messages from others since the viewer last read this conversation. */
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

type AiHubResourceType = "doc" | "pdf" | "url" | "text" | "md";

type AiHubResourceStatus = "pending" | "processing" | "failed" | "success";

interface IAiHubResource {
  id: string;
  organizationId: string | null;
  type: AiHubResourceType | null;
  name: string | null;
  description: string | null;
  allowedChannelIds: string[] | null;
  tags: string[] | null;
  publicId: string;
  secureURL: string;
  status: AiHubResourceStatus | null;
  embeddingId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IApiKey {
  id: string;
  name: string | null;
  apiKey: string;
  // Only returned once, at creation time. Never sent back on listing.
  apiSecret?: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IOrganizationMembers {
  id: string;
  organizationId: string;
  role: "member" | "admin" | "owner";
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined | null;
  };
}
interface ConversationMember {
  id: string;
  userId: string;
  role: string | null;
  name: string;
  email: string;
  image: string | null;
}

type ChannelAccessKey =
  | "removeMember"
  | "inviteMember"
  | "changeMemberConfig"
  | "changeMemberRole";

type ChannelAccess = Record<ChannelAccessKey, boolean>;

type OrgAccessKey =
  | "removeMember"
  | "inviteMember"
  | "changeMemberConfig"
  | "changeMemberRole"
  | "aiHubWrite"
  | "createChannel";

type OrgAccess = Record<OrgAccessKey, boolean>;

interface IWorkspaceMemberDetail {
  memberId: string;
  userId: string;
  role: OrganizationRole;
  name: string;
  email: string;
  image: string | null;
  joinedAt: Date;
  /** Role defaults merged with stored overrides — what the member can do. */
  access: OrgAccess;
  /** Only the explicitly stored per-member overrides. */
  overrides: Partial<OrgAccess>;
}

interface IWorkspaceMembers {
  members: IWorkspaceMemberDetail[];
  my?: IWorkspaceMemberDetail;
}

interface IConversationMemberDetail {
  memberId: string;
  userId: string;
  role: "owner" | "admin" | "member" | null;
  /** Workspace role — owners/admins get full channel access regardless. */
  orgRole: OrganizationRole | null;
  name: string;
  email: string;
  image: string | null;
  joinedAt: Date;
  /** Role defaults merged with stored overrides — what the member can do. */
  access: ChannelAccess;
  /** Only the explicitly stored per-member overrides. */
  overrides: Partial<ChannelAccess>;
}

interface IConversationDetails {
  conversation: IConversation;
  members: IConversationMemberDetail[];
  my?: IConversationMemberDetail;
}

interface IConversationFile {
  id: string;
  publicId: string;
  messageId: string | null;
  createdAt: Date;
  url: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface IMessage {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  conversationId: string;
  senderId: string;
  parentMessageId: string | null;
  mentions: unknown;
  content: string;
  sender: IUser;
}

type NotificationKind =
  | "mention"
  | "thread_reply"
  | "conversation_invite"
  | "ai_resource_ready"
  | "ai_resource_failed";

interface INotification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationKind;
  actorId: string | null;
  conversationId: string | null;
  messageId: string | null;
  resourceId: string | null;
  data: {
    preview?: string;
    role?: string;
    resourceName?: string | null;
    responded?: "accepted" | "declined";
    viaMention?: boolean;
  } | null;
  readAt: string | null;
  createdAt: Date;
  updatedAt: Date;
  actor: IUser | null;
  conversation: IConversation | null;
}
