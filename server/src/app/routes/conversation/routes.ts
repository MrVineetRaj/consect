import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  CreateNewConversationSchema,
  CreateNewConversationResponseSchema,
  CreateNewConversationHeadersSchema,
  ListConversationsInputSchema,
  ListConversationsHeadersSchema,
  SendInviteInputSchema,
  SendInviteHeadersSchema,
  DeleteMultipleSentInviteInputSchema,
  DeleteMultipleSentInviteHeadersSchema,
  ListConversationMemberInputSchema,
  ListConversationMemberHeadersSchema,
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

api.get("/", authMiddleware, {
  schema: ListConversationsInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListConversationsHeadersSchema,
  auth: true,
  handler: controller.listConversations.bind(controller),
  summary: "List all conversations",
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
