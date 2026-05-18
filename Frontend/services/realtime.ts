import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "../utils/apiConfig";

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function connectRealtime(userId: string): Socket {
  if (socket && currentUserId === userId && socket.connected) return socket;

  disconnectRealtime();

  currentUserId = userId;
  socket = io(SOCKET_BASE_URL, {
    transports: ["polling", "websocket"],
    query: { userId },
    autoConnect: true,
    reconnectionAttempts: 5,
  });

  socket.on("connect",       () => console.log("[Socket] connected:", socket?.id));
  socket.on("connect_error", (e) => console.error("[Socket] error:", e.message));
  socket.on("disconnect",    (r) => console.log("[Socket] disconnected:", r));

  return socket;
}

export function getRealtimeSocket() {
  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentUserId = null;
}
