import axios from "axios";
import { getToken, clearSession } from "../storage/tokenStorage";
import { notifySessionExpired } from "./authBridge";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
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
      notifySessionExpired();
    }
    return Promise.reject(error);
  }
);

export default api;