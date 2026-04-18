import axios from "axios";
import { Platform } from "react-native";
import { getToken, clearSession } from "../storage/tokenStorage";

// const API_URL = Platform.select({
//   default: "http://localhost:3000/api/v1/",
//   android: "http://192.168.0.104:3000/api/v1/",
//   ios: "http://192.168.0.104:3000/api/v1/",
// });

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — attach token automatically ────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 globally ──────────────────────────────
// When the server returns 401 (token expired / invalid) we clear storage.
// The AuthContext will detect the missing token and redirect to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearSession();
      // AuthContext listens for token removal and redirects automatically
    }
    return Promise.reject(error);
  }
);

export default api;