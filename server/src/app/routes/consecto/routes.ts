import { createApiRouter } from "../../adapter/openapi.js";
import { apiKeyAuthMiddleware } from "../../middleware/api-key-auth.js";
import { controller } from "./controller.js";
import {
  ChatConsectoHeadersSchema,
  ChatConsectoInputSchema,
  ChatConsectoResponseSchema,
} from "./schema.js";

export const CONSECTO_API_BASE_PATH = "/api/consecto";

const api = createApiRouter(CONSECTO_API_BASE_PATH);

api.post("/chat", apiKeyAuthMiddleware, {
  schema: ChatConsectoInputSchema,
  response: ChatConsectoResponseSchema,
  headers: ChatConsectoHeadersSchema,
  auth: false,
  handler: controller.chatConsecto.bind(controller),
  summary: "Chat with Consecto using an API key",
  tags: ["Consecto"],
});

export const router = api.router;
