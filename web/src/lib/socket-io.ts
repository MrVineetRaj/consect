import { io } from "socket.io-client";
import { env } from "./env";

export const socket = io(env.NEXT_PUBLIC_API_URL, {
  autoConnect: false, // connect manually
  transports: ["websocket"], // optional
});
