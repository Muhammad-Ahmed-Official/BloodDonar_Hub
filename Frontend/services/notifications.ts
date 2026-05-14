// TEMPORARILY DISABLED — expo-notifications not supported in Expo Go SDK 55
import api from "./api";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface BloodRequestPayload {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    requestId: string;
    type: string;
  };
  priority: "high" | "normal" | "default";
  channelId: string;
}

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

// DISABLED — requires expo-notifications
export const getLocalPushToken = async (): Promise<string | null> => {
  return null;
  // if (!Device.isDevice) return null;
  // const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  // if (!projectId) return null;
  // try {
  //   const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  //   return data;
  // } catch {
  //   return null;
  // }
};

export const sendBloodRequestNotification = async (
  expoPushToken: string,
  requestId: string
): Promise<void> => {
  const payload: BloodRequestPayload = {
    to: expoPushToken,
    sound: "default",
    title: "🩸 Blood Donation Request",
    body: "A user needs blood urgently. Tap to view.",
    data: { requestId, type: "blood_request" },
    priority: "high",
    channelId: "blood-requests",
  };

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PushNotification] send failed:", error);
    throw new Error(`Expo push error: ${response.status}`);
  }
};

export const sendBloodRequestToAll = async (
  expoPushTokens: string[],
  requestId: string
): Promise<void> => {
  if (!expoPushTokens.length) return;

  const chunks: string[][] = [];
  for (let i = 0; i < expoPushTokens.length; i += 100) {
    chunks.push(expoPushTokens.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map((chunk) => {
      const messages = chunk.map((token) => ({
        to: token,
        sound: "default",
        title: "🩸 Blood Donation Request",
        body: "A user needs blood urgently. Tap to view.",
        data: { requestId, type: "blood_request" },
        priority: "high",
        channelId: "blood-requests",
      }));

      return fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
    })
  );
};
