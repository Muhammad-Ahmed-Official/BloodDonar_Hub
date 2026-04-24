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

/** Placeholder — replace with real API call to store token per user */
export const saveExpoPushTokenToBackend = async (
  token: string,
  userId: string
): Promise<void> => {
  // TODO: await api.patch(`/users/${userId}/push-token`, { expoPushToken: token });
  console.log("[PushToken] saved for user", userId, "→", token);
};

/** Send a blood donation request notification to a single device */
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

/** Send blood request notification to all registered devices */
export const sendBloodRequestToAll = async (
  expoPushTokens: string[],
  requestId: string
): Promise<void> => {
  if (!expoPushTokens.length) return;

  // Expo supports batching — send up to 100 per request
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
