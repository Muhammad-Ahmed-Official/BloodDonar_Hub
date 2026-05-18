export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api/v1/";
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");