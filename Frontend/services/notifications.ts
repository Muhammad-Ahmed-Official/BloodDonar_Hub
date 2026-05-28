import api from "./api";
import { registerForPushNotificationsAsync } from "@/hooks/usePushNotifications";

// All push notifications are sent server-side via Expo Push API (notification.service.js).
// This file only handles token registration/deregistration with the backend.

// Re-request the Expo push token for this device (needed when re-enabling notifications).
export const getLocalPushToken = async (): Promise<string | null> => {
  try {
    return await registerForPushNotificationsAsync();
  } catch {
    return null;
  }
};

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
