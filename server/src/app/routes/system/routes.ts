import { Router } from "express";
import { AsyncHttpHandler } from "../../adapter/http.js";
import { controller } from "./controller.js";

const router = Router();

router.get("/health", AsyncHttpHandler(controller.getHealth.bind(controller)));

export { router };
