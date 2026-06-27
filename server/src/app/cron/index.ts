import cron from "node-cron";
import { cronHandlers } from "./handler.js";

cron.schedule("*/10 * * * *", () => {
  cronHandlers.reprocessEmbeddings();
});
