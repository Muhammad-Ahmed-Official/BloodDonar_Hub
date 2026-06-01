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
  const [expoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  // Token registration is handled by PushNotificationSetup in _layout.tsx
  // after the user is authenticated. This hook only manages the received-
  // notification listener so modal handlers can react to incoming pushes.
  useEffect(() => {
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
  try {
    if (Platform.OS === "web") {
      return null;
    }

    if (!Device.isDevice) {
      // In development on an emulator/simulator, return a recognisable fake token
      // so the entire save-to-DB and notification dispatch flow can be tested
      // without a physical device or APK build.
      if (__DEV__) {
        const fakeToken = "ExponentPushToken[SIMULATOR-DEV-TOKEN]";
        console.log("[PushNotifications] Dev emulator — using fake token:", fakeToken);
        return fakeToken;
      }
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
      console.warn("[PushNotifications] Permission denied by user");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      console.error("[PushNotifications] Missing EAS projectId in app.json");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[PushNotifications] Token obtained:", token?.slice(0, 30) + "…");
    return token;
  } catch (err) {
    // Fails in Expo Go (SDK 55+) — works correctly in EAS/standalone builds.
    // Common causes on real devices: FCM not configured (missing google-services.json
    // in EAS build), Play Services unavailable, or network unreachable.
    console.error("[PushNotifications] Token registration failed:", err);
    return null;
  }
}
