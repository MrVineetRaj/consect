import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";
import { router as sysRoutes } from "./routes/system/routes.js";
import { MESSAGE_BASE_PATH, router as messageRoutes } from "./routes/message/routes.js";
import {
  router as conversationRoutes,
  CONVERSATION_BASE_PATH,
} from "./routes/conversation/routes.js";
import { buildOpenApiDocument } from "./adapter/openapi.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { HttpResponse } from "./adapter/http.js";
import { ResponseCodes } from "./types/codes.js";

export function createExpressApp(): Application {
  const app: Application = express();

  app.use(
    cors({
      origin: "*",
    }),
  );

  app.use(express.json());
  app.all("/api/auth/*all", toNodeHandler(auth)); // For ExpressJS v4

  app.use("/api/v1/sys", sysRoutes);
  app.use(CONVERSATION_BASE_PATH, conversationRoutes);
  app.use(MESSAGE_BASE_PATH, messageRoutes);

  // Auto-generated API docs. The document is built from the Zod schemas
  // attached to each route via `createApiRouter`, so it stays in sync.
  const openApiDoc = buildOpenApiDocument();
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.json(openApiDoc);
  });
  app.use("/docs", apiReference({ content: openApiDoc }));

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
      ...new HttpResponse({
        code: ResponseCodes.INTERNAL_SERVER_ERROR,
        message: err?.message ?? "Something went wrong",
      }),
    });
  });
  return app;
}
