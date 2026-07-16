import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  CreateNewConversationSchema,
  CreateNewConversationResponseSchema,
  CreateNewConversationHeadersSchema,
  ListRecentConversationsInputSchema,
  ListRecentConversationsHeadersSchema,
  SendInviteInputSchema,
  SendInviteHeadersSchema,
  DeleteMultipleSentInviteInputSchema,
  DeleteMultipleSentInviteHeadersSchema,
  ListConversationMemberInputSchema,
  ListConversationMemberHeadersSchema,
  RespondInviteInputSchema,
  RespondInviteHeadersSchema,
  BrowseChannelsInputSchema,
  BrowseChannelsHeadersSchema,
  JoinChannelInputSchema,
  JoinChannelHeadersSchema,
  MarkConversationReadInputSchema,
  MarkConversationReadHeadersSchema,
  GetConversationDetailsInputSchema,
  GetConversationDetailsHeadersSchema,
  ListConversationFilesInputSchema,
  ListConversationFilesHeadersSchema,
  UpdateMemberRoleInputSchema,
  UpdateMemberRoleHeadersSchema,
  UpdateMemberAccessInputSchema,
  UpdateMemberAccessHeadersSchema,
  RemoveMemberInputSchema,
  RemoveMemberHeadersSchema,
} from "./schema.js";

export const CONVERSATION_BASE_PATH = "/api/v1/conversation";

const api = createApiRouter(CONVERSATION_BASE_PATH);

api.post("/", authMiddleware, {
  schema: CreateNewConversationSchema,
  response: CreateNewConversationResponseSchema,
  headers: CreateNewConversationHeadersSchema,
  auth: true,
  handler: controller.createNewConversation.bind(controller),
  summary: "Create a new conversation",
  tags: ["Conversation"],
});

api.get("/recent", authMiddleware, {
  schema: ListRecentConversationsInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListRecentConversationsHeadersSchema,
  auth: true,
  handler: controller.listRecentConversations.bind(controller),
  summary: "List all conversations",
  tags: ["Conversation"],
});

api.get("/dms", authMiddleware, {
  schema: ListRecentConversationsInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListRecentConversationsHeadersSchema,
  auth: true,
  handler: controller.listGroupsAndDMs.bind(controller),
  summary: "All groups and DMs of the user (no recency cutoff)",
  tags: ["Conversation"],
});

api.get("/browse", authMiddleware, {
  schema: BrowseChannelsInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: BrowseChannelsHeadersSchema,
  auth: true,
  handler: controller.browseChannels.bind(controller),
  summary: "Browse joinable channels (public, or unlisted via search)",
  tags: ["Conversation"],
});

api.post("/join", authMiddleware, {
  schema: JoinChannelInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: JoinChannelHeadersSchema,
  auth: true,
  handler: controller.joinChannel.bind(controller),
  summary: "Join a public or unlisted channel",
  tags: ["Conversation"],
});

api.post("/read", authMiddleware, {
  schema: MarkConversationReadInputSchema,
  headers: MarkConversationReadHeadersSchema,
  auth: true,
  handler: controller.markConversationRead.bind(controller),
  summary: "Mark a conversation as read up to now",
  tags: ["Conversation"],
});

api.get("/details", authMiddleware, {
  schema: GetConversationDetailsInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: GetConversationDetailsHeadersSchema,
  auth: true,
  handler: controller.getConversationDetails.bind(controller),
  summary: "Conversation details with members and their channel access",
  tags: ["Conversation"],
});

api.get("/files", authMiddleware, {
  schema: ListConversationFilesInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListConversationFilesHeadersSchema,
  auth: true,
  handler: controller.listConversationFiles.bind(controller),
  summary: "Files shared in a conversation",
  tags: ["Conversation"],
});

api.patch("/member/role", authMiddleware, {
  schema: UpdateMemberRoleInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: UpdateMemberRoleHeadersSchema,
  auth: true,
  handler: controller.updateMemberRole.bind(controller),
  summary: "Change a conversation member's role",
  tags: ["Conversation"],
});

api.patch("/member/access", authMiddleware, {
  schema: UpdateMemberAccessInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: UpdateMemberAccessHeadersSchema,
  auth: true,
  handler: controller.updateMemberAccess.bind(controller),
  summary: "Override a member's per-channel access capabilities",
  tags: ["Conversation"],
});

api.delete("/member", authMiddleware, {
  schema: RemoveMemberInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: RemoveMemberHeadersSchema,
  auth: true,
  handler: controller.removeMember.bind(controller),
  summary: "Remove a member from a conversation",
  tags: ["Conversation"],
});

api.get("/members", authMiddleware, {
  schema: ListConversationMemberInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListConversationMemberHeadersSchema,
  auth: true,
  handler: controller.listConversationMember.bind(controller),
  summary: "List all conversation members",
  tags: ["Conversation"],
});
api.post("/invite", authMiddleware, {
  schema: SendInviteInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: SendInviteHeadersSchema,
  auth: true,
  handler: controller.sendInvite.bind(controller),
  summary: "Send Invitation to multiple users",
  tags: ["Conversation"],
});

api.post("/invite/accept", authMiddleware, {
  schema: RespondInviteInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: RespondInviteHeadersSchema,
  auth: true,
  handler: controller.acceptInvite.bind(controller),
  summary: "Accept a conversation invitation",
  tags: ["Conversation"],
});

api.post("/invite/decline", authMiddleware, {
  schema: RespondInviteInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: RespondInviteHeadersSchema,
  auth: true,
  handler: controller.declineInvite.bind(controller),
  summary: "Decline a conversation invitation",
  tags: ["Conversation"],
});

api.delete("/delete-invite", authMiddleware, {
  schema: DeleteMultipleSentInviteInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: DeleteMultipleSentInviteHeadersSchema,
  auth: true,
  handler: controller.deleteMultipleSentInvite.bind(controller),
  summary: "Delete Invitation sent to multiple users",
  tags: ["Conversation"],
});

export const router = api.router;
