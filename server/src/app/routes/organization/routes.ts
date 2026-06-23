import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  ListOrganizationsInputSchema,
  ListOrganizationsHeadersSchema,
  ListOrganizationsResponseSchema,
  CreateOrganizationInputSchema,
  CreateOrganizationHeadersSchema,
  CreateOrganizationResponseSchema,
} from "./schema.js";

export const ORGANIZATION_BASE_PATH = "/api/v1/organization";

const api = createApiRouter(ORGANIZATION_BASE_PATH);

api.get("/", authMiddleware, {
  schema: ListOrganizationsInputSchema,
  response: ListOrganizationsResponseSchema,
  headers: ListOrganizationsHeadersSchema,
  auth: true,
  handler: controller.listOrganizations.bind(controller),
  summary: "List organizations the current user belongs to",
  tags: ["Organization"],
});

api.post("/", authMiddleware, {
  schema: CreateOrganizationInputSchema,
  response: CreateOrganizationResponseSchema,
  headers: CreateOrganizationHeadersSchema,
  auth: true,
  handler: controller.createOrganization.bind(controller),
  summary: "Create a new organization owned by the current user",
  tags: ["Organization"],
});

export const router = api.router;
