import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  ApiKeyResponseSchema,
  CreateApiKeyHeadersSchema,
  CreateApiKeyInputSchema,
  DeleteApiKeyHeadersSchema,
  DeleteApiKeyInputSchema,
  ListApiKeysHeadersSchema,
  ListApiKeysInputSchema,
} from "./schema.js";

export const API_KEY_BASE_PATH = "/api/v1/api-key";

const api = createApiRouter(API_KEY_BASE_PATH);

api.post("/", authMiddleware, {
  schema: CreateApiKeyInputSchema,
  response: ApiKeyResponseSchema,
  headers: CreateApiKeyHeadersSchema,
  auth: true,
  handler: controller.createApiKey.bind(controller),
  summary: "Create a new API key",
  tags: ["API Key"],
});

api.get("/", authMiddleware, {
  schema: ListApiKeysInputSchema,
  response: ApiKeyResponseSchema,
  headers: ListApiKeysHeadersSchema,
  auth: true,
  handler: controller.listApiKeys.bind(controller),
  summary: "List API keys",
  tags: ["API Key"],
});

api.delete("/", authMiddleware, {
  schema: DeleteApiKeyInputSchema,
  response: ApiKeyResponseSchema,
  headers: DeleteApiKeyHeadersSchema,
  auth: true,
  handler: controller.deleteApiKey.bind(controller),
  summary: "Delete an API key",
  tags: ["API Key"],
});

export const router = api.router;
