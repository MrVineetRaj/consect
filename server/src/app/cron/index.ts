import cron from "node-cron";
import { cronHandlers } from "./handler.js";

cron.schedule("*/1 * * * *", () => {
  console.log("Hello")
  cronHandlers.reprocessEmbeddings();
});
