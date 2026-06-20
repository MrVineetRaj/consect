import express, { type Application } from "express";
import cors from "cors";
import { router as sysRoutes } from "./routes/system/routes.js";

export function createExpressApp(): Application {
  const app: Application = express();

  app.use(
    cors({
      origin: "*",
    }),
  );
  
  app.use(express.json());
  app.use("/api/v1/sys", sysRoutes);
  return app;
}
