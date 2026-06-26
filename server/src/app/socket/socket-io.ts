import { Server } from "socket.io";
import { socketHandlers } from "./handlers.js";
import { cachingClient } from "../clients/caching.js";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { conversationMemberRepository } from "../db/repository/conservation-member.js";
const io = new Server();

io.use(async (socket, next) => {
  const headers = fromNodeHeaders(socket.handshake.headers);
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return next(new Error("unauthorized"));
  socket.data.userId = session.user.id;
  next();
});

io.on("connection", (socket) => {
  socket.on("mark_online", async (res) => {
    if (res?.organizationId) {
      await socketHandlers.markUserOnline(res);
      socket.join(res?.organizationId);
      socket.join(socket.data.userId);
      const orgPresence = await cachingClient.hgetall(
        `users:${res?.organizationId}:presence`,
      );
      io.to(res?.organizationId).emit(`presence:update`, {
        orgPresence,
      });
    }
  });

  socket.on("join_conversation", async (res: { conversationId: string }) => {
    const isMember =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: socket.data.userId as string,
        conversationId: res.conversationId,
      });
    if (!isMember) return;
    
    socket.join("convo_" + res.conversationId);
  });
  console.log(socket.id + " connected");
});

export default io;
