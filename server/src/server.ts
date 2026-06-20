import { createServer } from "http";
import { createExpressApp } from "./app/express.js";
import { env } from "./env.js";

const server = createServer(createExpressApp());
const PORT = +env.PORT;

server.listen(PORT, () => {
  console.log(`Server is up on ${PORT}`);
});
