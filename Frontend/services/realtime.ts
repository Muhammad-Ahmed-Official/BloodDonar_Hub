import { io, type Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://blooddonar-hub.onrender.com/api/v1/";

/** Socket.IO connects to the HTTP origin — strip REST prefix `/api/v1`. */
function getSocketBaseUrl(): string {
  // const origin = API_URL.replace(/\/?api\/v1\/?$/i, "").replace(/\/$/, "");
  return "https://blooddonar-hub.onrender.com";
}

let socket: Socket | null = null;
let currentUserId: string | null = null;

// function getSocketBaseUrl() {
//   // Must match your API host (without /api/v1)
//   const host = Platform.select({
//     default: "http://localhost:3000",
//     android: "http://192.168.0.106:3000",
//     ios: "http://192.168.0.106:3000",
//   });
//   return host!;
// }

export function connectRealtime(userId: string) {
  if (!userId) return null;
  if (socket && currentUserId === userId) return socket;

  disconnectRealtime();

  currentUserId = userId;
  socket = io(getSocketBaseUrl(), {
    transports: ["websocket"],
    query: { userId },
    autoConnect: true,
  });

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

