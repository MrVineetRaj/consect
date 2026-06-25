import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  AiHubResponseSchema,
  CreateResourceHeadersSchema,
  CreateResourceInputSchema,
  DeleteResourceHeadersSchema,
  DeleteResourceInputSchema,
  ListResourcesHeadersSchema,
  ListResourcesInputSchema,
} from "./schema.js";

export const AI_HUB_BASE_PATH = "/api/v1/ai-hub";

const api = createApiRouter(AI_HUB_BASE_PATH);

api.post("/", authMiddleware, {
  schema: CreateResourceInputSchema,
  response: AiHubResponseSchema,
  headers: CreateResourceHeadersSchema,
  auth: true,
  handler: controller.createResource.bind(controller),
  summary: "Add a resource to the AI Hub",
  tags: ["AI Hub"],
});

api.get("/", authMiddleware, {
  schema: ListResourcesInputSchema,
  response: AiHubResponseSchema,
  headers: ListResourcesHeadersSchema,
  auth: true,
  handler: controller.listResources.bind(controller),
  summary: "List AI Hub resources",
  tags: ["AI Hub"],
});

api.delete("/", authMiddleware, {
  schema: DeleteResourceInputSchema,
  response: AiHubResponseSchema,
  headers: DeleteResourceHeadersSchema,
  auth: true,
  handler: controller.deleteResource.bind(controller),
  summary: "Remove a resource from the AI Hub",
  tags: ["AI Hub"],
});

export const router = api.router;
