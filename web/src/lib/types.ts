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

interface IConversation {
  id: string;
  name: string | null;
  organizationId: string;
  type: "group" | "dm" | "channel" | null;
  description: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type AiHubResourceType = "doc" | "pdf" | "url" | "text" | "md";

interface IAiHubResource {
  id: string;
  organizationId: string | null;
  type: AiHubResourceType | null;
  allowedChannelIds: string[] | null;
  tags: string[] | null;
  publicId: string;
  secureURL: string;
  embeddingId: string | null;
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
