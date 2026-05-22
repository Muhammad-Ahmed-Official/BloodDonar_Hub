import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Show alerts even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type UsePushNotificationsReturn = {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
};

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Expo Go on a simulator — tokens aren't available
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("blood-requests", {
      name: "Blood Requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E53935",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
    await Notifications.setNotificationChannelAsync("donation-reminders", {
      name: "Donation Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  // Cast to any: expo-modules-core PermissionResponse is nested under expo/,
  // causing tsc to lose the .granted / .status fields depending on resolution path.
  // Runtime is correct — both fields exist on the actual object.
  const existing = (await Notifications.getPermissionsAsync()) as unknown as {
    granted: boolean;
    status: string;
  };
  let granted = existing.granted;

  if (!granted) {
    const requested = (await Notifications.requestPermissionsAsync()) as unknown as {
      granted: boolean;
    };
    granted = requested.granted;
  }

  if (!granted) {
    console.warn("[PushNotifications] Permission denied by user");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.error("[PushNotifications] Missing EAS projectId in app.json");
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    // getExpoPushTokenAsync fails in Expo Go without a real device build.
    // It works correctly in EAS / standalone APK builds.
    console.warn("[PushNotifications] Token unavailable (use EAS build for full functionality):", err);
    return null;
  }
}
