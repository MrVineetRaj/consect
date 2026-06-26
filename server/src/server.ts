import "./app/cron/index.js";
import { createServer } from "http";
import { createExpressApp } from "./app/express.js";
import { env } from "./env.js";
import logger from "./app/lib/logger.js";

const server = createServer(createExpressApp());
const PORT = +env.PORT;

server.listen(PORT, () => {
  logger.info(`Server is up at port ${PORT}`);
});
