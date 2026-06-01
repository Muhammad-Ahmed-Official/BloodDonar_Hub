import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { debugLog } from "@/utils/debugLog";

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
  const [expoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  // Token registration is handled by PushNotificationSetup in _layout.tsx
  // after the user is authenticated. This hook only manages the received-
  // notification listener so modal handlers can react to incoming pushes.
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      const data = notif.request.content.data as { type?: string; requestId?: string };
      debugLog("[NotifReceived] Foreground notification: type=" + data?.type + " requestId=" + data?.requestId);
      setNotification(notif);
    });

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return null;
    }

    if (!Device.isDevice) {
      if (__DEV__) {
        const fakeToken = "ExponentPushToken[SIMULATOR-DEV-TOKEN]";
        debugLog("[PushToken] Dev emulator — using fake token");
        return fakeToken;
      }
      debugLog("[PushToken] FAILED — not a physical device (emulator/simulator). Push tokens require a real device.");
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
    const existing = (await Notifications.getPermissionsAsync()) as unknown as {
      granted: boolean;
    };
    let granted = existing.granted;

    if (!granted) {
      const requested = (await Notifications.requestPermissionsAsync()) as unknown as {
        granted: boolean;
      };
      granted = requested.granted;
    }

    if (!granted) {
      debugLog("[PushToken] ERROR — permission denied by user");
      return null;
    }
    debugLog("[PushToken] Permission granted");

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      debugLog("[PushToken] ERROR — missing EAS projectId in app.json");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    debugLog("[PushToken] Token obtained: " + token?.slice(0, 35) + "…");
    return token;
  } catch (err) {
    debugLog("[PushToken] EXCEPTION: " + String(err));
    return null;
  }
}
