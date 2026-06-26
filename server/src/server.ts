import "./app/cron/index.js";
import { createServer } from "http";
import { createExpressApp } from "./app/express.js";
import { env } from "./env.js";
import logger from "./app/lib/logger.js";
import io from "./app/socket/socket-io.js";

const server = createServer(createExpressApp());

io.attach(server);
const PORT = +env.PORT;

server.listen(PORT, () => {
  logger.info(`Server is up at port ${PORT}`);
});
