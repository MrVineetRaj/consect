import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  WorkspaceSearchHeadersSchema,
  WorkspaceSearchInputSchema,
  WorkspaceSearchResponseSchema,
} from "./schema.js";

export const SEARCH_BASE_PATH = "/api/v1/search";

const api = createApiRouter(SEARCH_BASE_PATH);

api.get("/", authMiddleware, {
  schema: WorkspaceSearchInputSchema,
  response: WorkspaceSearchResponseSchema,
  headers: WorkspaceSearchHeadersSchema,
  auth: true,
  handler: controller.search.bind(controller),
  summary: "Search the workspace (@ members, # channels, plus messages)",
  tags: ["Search"],
});

export const router = api.router;
