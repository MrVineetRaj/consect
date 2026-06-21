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
import {
  accessConfig,
  account,
  conversation,
  conversationMember,
  invitation,
  member,
  message,
  session,
  user,
  organization,
  file,
  aiHubResource,
} from "./schema.js";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  accessConfigs: many(accessConfig),
  conversationMembers: many(conversationMember),
  messages: many(message),
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
export const conversationRelations = relations(conversation, ({ one }) => ({
  organization: one(organization, {
    fields: [conversation.organizationId],
    references: [organization.id],
  }),
}));
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
export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  user: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
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
