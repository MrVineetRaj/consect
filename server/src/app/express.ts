import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { router as sysRoutes } from "./routes/system/routes.js";
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
