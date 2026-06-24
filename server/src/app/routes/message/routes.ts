import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  CreateNewConversationResponseSchema,
  CreateNewMessageHeadersSchema,
  CreateNewMessageInputSchema,
  DeleteMessageHeadersSchema,
  DeleteMessageInputSchema,
  ListMessagesHeadersSchema,
  ListMessagesInputSchema,
  UpdateMessageHeadersSchema,
  UpdateMessageInputSchema,
} from "./schema.js";

export const MESSAGE_BASE_PATH = "/api/v1/message";

const api = createApiRouter(MESSAGE_BASE_PATH);

api.post("/", authMiddleware, {
  schema: CreateNewMessageInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: CreateNewMessageHeadersSchema,
  auth: true,
  handler: controller.newMessage.bind(controller),
  summary: "Create a new conversation",
  tags: ["Message"],
});


api.get("/", authMiddleware, {
  schema: ListMessagesInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: ListMessagesHeadersSchema,
  auth: true,
  handler: controller.listMessages.bind(controller),
  summary: "List conversation messages",
  tags: ["Message"],
});

api.patch("/", authMiddleware, {
  schema: UpdateMessageInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: UpdateMessageHeadersSchema,
  auth: true,
  handler: controller.updateMessage.bind(controller),
  summary: "Message Updated",
  tags: ["Message"],
});

api.delete("/", authMiddleware, {
  schema: DeleteMessageInputSchema,
  response: CreateNewConversationResponseSchema,
  headers: DeleteMessageHeadersSchema,
  auth: true,
  handler: controller.deleteMessage.bind(controller),
  summary: "List conversation messages",
  tags: ["Message"],
});

export const router = api.router;
