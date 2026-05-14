import { io, type Socket } from "socket.io-client";

// Strip "/api/v1/" suffix from the REST base URL to get the socket server origin.
// Keeps socket in sync with whatever is set in EXPO_PUBLIC_API_URL.
const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? "")
  .replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function connectRealtime(userId: string): Socket {
  if (socket && currentUserId === userId && socket.connected) return socket;

  disconnectRealtime();

  currentUserId = userId;
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    query: { userId },
    autoConnect: true,
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
