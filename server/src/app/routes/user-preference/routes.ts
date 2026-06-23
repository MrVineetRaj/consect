import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  GetUserPreferenceInputSchema,
  GetUserPreferenceHeadersSchema,
  GetUserPreferenceResponseSchema,
  UpdateUserPreferenceInputSchema,
  UpdateUserPreferenceHeadersSchema,
  UpdateUserPreferenceResponseSchema,
  DeleteUserPreferenceInputSchema,
  DeleteUserPreferenceHeadersSchema,
  DeleteUserPreferenceResponseSchema,
} from "./schema.js";

export const USER_PREFERENCE_BASE_PATH = "/api/v1/user-preference";

const api = createApiRouter(USER_PREFERENCE_BASE_PATH);

api.get("/", authMiddleware, {
  schema: GetUserPreferenceInputSchema,
  response: GetUserPreferenceResponseSchema,
  headers: GetUserPreferenceHeadersSchema,
  auth: true,
  handler: controller.getUserPreference.bind(controller),
  summary: "Get the current user's preference",
  tags: ["User Preference"],
});

api.patch("/", authMiddleware, {
  schema: UpdateUserPreferenceInputSchema,
  response: UpdateUserPreferenceResponseSchema,
  headers: UpdateUserPreferenceHeadersSchema,
  auth: true,
  handler: controller.updateUserPreference.bind(controller),
  summary: "Update the current user's preference",
  tags: ["User Preference"],
});

api.delete("/", authMiddleware, {
  schema: DeleteUserPreferenceInputSchema,
  response: DeleteUserPreferenceResponseSchema,
  headers: DeleteUserPreferenceHeadersSchema,
  auth: true,
  handler: controller.deleteUserPreference.bind(controller),
  summary: "Delete the current user's preference",
  tags: ["User Preference"],
});

export const router = api.router;
