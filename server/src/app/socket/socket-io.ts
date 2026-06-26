import { Server } from "socket.io";
import { socketHandlers } from "./handlers.js";
import { cachingClient } from "../clients/caching.js";
const io = new Server();

io.on("connection", (socket) => {
  socket.on("mark_online", async (res) => {
    if (res?.organizationId) {
      await socketHandlers.markUserOnline(res);
      socket.join(res?.organizationId);
      socket.join(res?.userId);
      const orgPresence = await cachingClient.hgetall(
        `users:${res?.organizationId}:presence`,
      );
      io.to(res?.organizationId).emit(`presence:update`, {
        orgPresence,
      });
    }
  });

  socket.on("join_conversation", (res: { conversationId: string }) => {
    socket.join("convo_" + res.conversationId);
  });
  console.log(socket.id + " connected");
});

export default io;
