import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";
import { router as sysRoutes } from "./routes/system/routes.js";
import {
  MESSAGE_BASE_PATH,
  router as messageRoutes,
} from "./routes/message/routes.js";
import {
  router as conversationRoutes,
  CONVERSATION_BASE_PATH,
} from "./routes/conversation/routes.js";
import {
  router as userPreferenceRoutes,
  USER_PREFERENCE_BASE_PATH,
} from "./routes/user-preference/routes.js";
import {
  router as organizationRoutes,
  ORGANIZATION_BASE_PATH,
} from "./routes/organization/routes.js";
import {
  router as aiHubRoutes,
  AI_HUB_BASE_PATH,
} from "./routes/ai-hub/routes.js";
import {
  router as apiKeyRoutes,
  API_KEY_BASE_PATH,
} from "./routes/api-key/routes.js";
import {
  router as consectoRoutes,
  CONSECTO_API_BASE_PATH,
} from "./routes/consecto/routes.js";
import { buildOpenApiDocument } from "./adapter/openapi.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { HttpRequest, HttpResponse } from "./adapter/http.js";
import { ResponseCodes } from "./types/codes.js";
import { env } from "../env.js";
import {
  router as webhookRoutes,
  WEBHOOK_BASE_PATH,
} from "./routes/webhook/routes.js";
import {
  router as notificationRoutes,
  NOTIFICATION_BASE_PATH,
} from "./routes/notification/routes.js";
import { logger } from "better-auth";

export function createExpressApp(): Application {
  const app: Application = express();

  app.use(
    cors({
      origin: env.VALID_ORIGINS.split(";"),
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    }),
  );

  // Resources uploaded to the AI Hub arrive as base64 data URIs in the JSON
  // body, which easily exceeds the 100kb default.
  app.use(express.json({ limit: "25mb" }));
  app.all("/api/auth/*all", toNodeHandler(auth)); // For ExpressJS v4

  app.use("/api/v1/sys", sysRoutes);
  app.use(CONVERSATION_BASE_PATH, conversationRoutes);
  app.use(MESSAGE_BASE_PATH, messageRoutes);
  app.use(USER_PREFERENCE_BASE_PATH, userPreferenceRoutes);
  app.use(ORGANIZATION_BASE_PATH, organizationRoutes);
  app.use(AI_HUB_BASE_PATH, aiHubRoutes);
  app.use(API_KEY_BASE_PATH, apiKeyRoutes);
  app.use(CONSECTO_API_BASE_PATH, consectoRoutes);
  app.use(WEBHOOK_BASE_PATH, webhookRoutes);
  app.use(NOTIFICATION_BASE_PATH, notificationRoutes);

  // Auto-generated API docs. The document is built from the Zod schemas
  // attached to each route via `createApiRouter`, so it stays in sync.
  const openApiDoc = buildOpenApiDocument();
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.json(openApiDoc);
  });
  app.use("/docs", apiReference({ content: openApiDoc }));

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err?.message ?? "Something went wrong", {
      ...new HttpRequest(req, res),
    });
    res.status(500).json({
      ...new HttpResponse({
        code: ResponseCodes.INTERNAL_SERVER_ERROR,
        message: err?.message ?? "Something went wrong",
      }),
    });
  });
  return app;
}
