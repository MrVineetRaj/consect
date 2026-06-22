import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const accessConfigSpaceEnum = pgEnum("access_config_space_enum", [
  "channel",
  "organization",
]);

export const conversationTypeEnum = pgEnum("conversation_type_enum", [
  "channel",
  "group",
  "dm",
]);

export const resourceTypeEnum = pgEnum("resource_type_enum", [
  "doc",
  "pdf",
  "url",
  "text",
  "md",
]);

export const roleEnum = pgEnum("role_enum", ["owner", "admin", "member"]);
// #region --- Better Auth Schema ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);
// #endregion

export const accessConfig = pgTable("access_config", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  spaceId: text("space_id").notNull(),
  spaceType: accessConfigSpaceEnum("space_type").default("organization"),
  config: jsonb().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const conversation = pgTable("conversation", {
  id: text("id").primaryKey(),
  name: text("name"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  type: conversationTypeEnum("type"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const conversationMember = pgTable("conversation_member", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, {
      onDelete: "cascade",
    }),
  role: roleEnum().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const conversationInvitation = pgTable("conversation_invitation", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id),
  forUser: text("for_user_id")
    .notNull()
    .references(() => user.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, {
      onDelete: "cascade",
    }),
  role: roleEnum().default("member"),
  expiry: timestamp("expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "no action" }),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  parentMessageId: text("parent_message_id"),
  mentions: jsonb("mentions"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const file = pgTable("file", {
  id: text("id").primaryKey(),
  messageId: text("message_id").references(() => message.id, {
    onDelete: "cascade",
  }),
  publicId: text("public_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const aiHubResource = pgTable("ai_hub_resource", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),
  type: resourceTypeEnum("type"),
  allowedChannelIds: jsonb("allowed_channel_id"),
  tags: jsonb("tags"),
  embeddingId: text("embedding_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  accessConfigs: many(accessConfig),
  conversationMembers: many(conversationMember),
  messages: many(message),
  conversationInvitations: many(conversationInvitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  accessConfigs: many(accessConfig),
  conversations: many(conversation),
  conversationMembers: many(conversationMember),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const accessConfigRelations = relations(accessConfig, ({ one }) => ({
  organization: one(organization, {
    fields: [accessConfig.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [accessConfig.userId],
    references: [user.id],
  }),
}));

export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [conversation.organizationId],
      references: [organization.id],
    }),
    members: many(conversationMember),
    conversationMembers: many(conversationMember),
    messages: many(message),
  }),
);

export const conversationMemberRelations = relations(
  conversationMember,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationMember.conversationId],
      references: [conversation.id],
    }),
    user: one(user, {
      fields: [conversationMember.userId],
      references: [user.id],
    }),
  }),
);
export const conversationInvitationRelation = relations(
  conversationInvitation,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationInvitation.conversationId],
      references: [conversation.id],
    }),
    sender: one(user, {
      fields: [conversationInvitation.senderId],
      references: [user.id],
    }),
    user: one(user, {
      fields: [conversationInvitation.forUser],
      references: [user.id],
    }),
  }),
);
export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  user: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  files: many(file),
}));

export const fileRelations = relations(file, ({ one }) => ({
  message: one(message, {
    fields: [file.messageId],
    references: [message.id],
  }),
}));

export const aiHubResourceRelations = relations(aiHubResource, ({ one }) => ({
  organization: one(organization, {
    fields: [aiHubResource.organizationId],
    references: [organization.id],
  }),
}));
