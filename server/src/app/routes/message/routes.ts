import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  CreateNewMessageHeadersSchema,
  CreateNewMessageInputSchema,
  DeleteMessageHeadersSchema,
  DeleteMessageInputSchema,
  ListMessagesHeadersSchema,
  ListMessagesInputSchema,
  MessageListResponseSchema,
  MessageResponseSchema,
  UpdateMessageHeadersSchema,
  UpdateMessageInputSchema,
} from "./schema.js";

export const MESSAGE_BASE_PATH = "/api/v1/message";

const api = createApiRouter(MESSAGE_BASE_PATH);

api.post("/", authMiddleware, {
  schema: CreateNewMessageInputSchema,
  response: MessageResponseSchema,
  headers: CreateNewMessageHeadersSchema,
  auth: true,
  handler: controller.newMessage.bind(controller),
  summary: "Create a new message",
  tags: ["Message"],
});


api.get("/", authMiddleware, {
  schema: ListMessagesInputSchema,
  response: MessageListResponseSchema,
  headers: ListMessagesHeadersSchema,
  auth: true,
  handler: controller.listMessages.bind(controller),
  summary: "List conversation messages",
  tags: ["Message"],
});

api.patch("/", authMiddleware, {
  schema: UpdateMessageInputSchema,
  response: MessageResponseSchema,
  headers: UpdateMessageHeadersSchema,
  auth: true,
  handler: controller.updateMessage.bind(controller),
  summary: "Update a message",
  tags: ["Message"],
});

api.delete("/", authMiddleware, {
  schema: DeleteMessageInputSchema,
  response: MessageResponseSchema,
  headers: DeleteMessageHeadersSchema,
  auth: true,
  handler: controller.deleteMessage.bind(controller),
  summary: "Delete a message",
  tags: ["Message"],
});

export const router = api.router;
