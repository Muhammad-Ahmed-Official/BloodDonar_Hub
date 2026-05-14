// TEMPORARILY DISABLED — expo-notifications not supported in Expo Go SDK 55
// import { useState, useEffect, useRef } from "react";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";
// import { Platform } from "react-native";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export type UsePushNotificationsReturn = {
  expoPushToken: string | null;
  notification: null;
};

export function usePushNotifications(): UsePushNotificationsReturn {
  return { expoPushToken: null, notification: null };
}

// async function registerForPushNotificationsAsync(): Promise<string | null> {
//   if (!Device.isDevice) {
//     console.warn("[PushNotifications] Physical device required");
//     return null;
//   }
//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("blood-requests", {
//       name: "Blood Requests",
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#E53935",
//       sound: "default",
//       enableVibrate: true,
//       showBadge: true,
//     });
//   }
//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }
//   if (finalStatus !== "granted") {
//     console.warn("[PushNotifications] Permission denied");
//     return null;
//   }
//   const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
//   if (!projectId) {
//     console.error("[PushNotifications] Missing EAS projectId in app.json");
//     return null;
//   }
//   const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
//   return token;
// }
