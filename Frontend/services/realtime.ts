import { io, type Socket } from "socket.io-client";
import { Platform } from "react-native";

// export const SOCKET_URL = Platform.select({
//   android: "http://192.168.0.104:3000",
//   ios:     "http://192.168.0.104:3000",
//   default: "http://localhost:3000",
// });

const SOCKET_URL = "https://blooddonar-hub.onrender.com";

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
