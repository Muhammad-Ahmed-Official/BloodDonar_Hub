import api from "./api";

// All push notifications are sent server-side via Expo Push API (notification.service.js).
// This file only handles token registration/deregistration with the backend.

export const saveExpoPushTokenToBackend = async (
  token: string,
  _userId: string
): Promise<void> => {
  try {
    await api.patch("user/push-token", { expoPushToken: token });
    console.log("[PushToken] Saved to backend:", token);
  } catch (err) {
    console.error("[PushToken] Failed to save:", err);
  }
};

export const clearExpoPushToken = async (): Promise<void> => {
  await api.patch("user/push-token", { expoPushToken: null });
};
