import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  AiHubResponseSchema,
  EmbeddingStatusUpdateHeadersSchema,
  EmbeddingStatusUpdateInputSchema,
} from "./schema.js";

export const WEBHOOK_BASE_PATH = "/api/webhook";

const api = createApiRouter(WEBHOOK_BASE_PATH);

api.post("/embedding/status-update", authMiddleware, {
  schema: EmbeddingStatusUpdateInputSchema,
  response: AiHubResponseSchema,
  headers: EmbeddingStatusUpdateHeadersSchema,
  auth: true,
  handler: controller.embeddingStatusUpdate.bind(controller),
  summary: "Callback url for Embedding service",
  tags: ["Webhooks"],
});

export const router = api.router;
