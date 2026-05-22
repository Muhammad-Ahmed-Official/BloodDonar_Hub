import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
  StatusBar,
} from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";
import AppProvider from "@/context/AppProvider";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/theme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { saveExpoPushTokenToBackend } from "@/services/notifications";
import BloodRequestModal from "@/components/BloodRequestModal";
import ConfirmDonationModal from "@/components/ConfirmDonationModal";

const PENDING_NOTIFICATION_KEY = "pendingNotificationData";

// ─── Route Guard ──────────────────────────────────────────────────────────────
function RouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup   = segments[0] === "(auth)";
    const currentScreen = segments[1] as string | undefined;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && !user?.isVerified) {
      const alreadyOnVerification = inAuthGroup && currentScreen === "verification";
      if (!alreadyOnVerification) {
        router.replace("/(auth)/verification");
      }
      return;
    }

    if (isAuthenticated && user?.isVerified && inAuthGroup) {
      const onSetupScreen = currentScreen === "profile-setup";
      if (!onSetupScreen) {
        user.role === "admin"
          ? router.replace("/(admin)/admin")
          : router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null;
}

// ─── Push Token Registration ──────────────────────────────────────────────────
function PushNotificationSetup() {
  const { user } = useAuth();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (!expoPushToken || !user?._id) return;
    AsyncStorage.getItem("notifications_enabled").then((stored) => {
      if (stored !== "false") {
        saveExpoPushTokenToBackend(expoPushToken, user._id).catch(console.error);
      }
    });
  }, [expoPushToken, user?._id]);

  return null;
}

// ─── Notification type definitions ───────────────────────────────────────────
type PendingNotif =
  | { type: "BLOOD_REQUEST"; requestId: string }
  | { type: "DONATION_CONFIRMATION"; requestId: string }
  | null;

// ─── Notification Handler ─────────────────────────────────────────────────────
// Handles taps on push notifications. Works in foreground, background, and
// killed-state (via getLastNotificationResponseAsync on cold start).
function NotificationHandler() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [pending, setPending] = useState<PendingNotif>(null);
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);
  const handledIdRef = useRef<string | null>(null);

  // Keep a ref so the stable handler callback can read the latest auth state
  // without being re-registered on every auth change.
  const isAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // After login: check AsyncStorage for a notification the user tapped while logged out
  useEffect(() => {
    if (!isAuthenticated) return;
    AsyncStorage.getItem(PENDING_NOTIFICATION_KEY)
      .then((stored) => {
        if (!stored) return;
        AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);
        try {
          const data = JSON.parse(stored) as { type?: string; requestId?: string };
          if (data?.type === "BLOOD_REQUEST") {
            setPending({ type: "BLOOD_REQUEST", requestId: data.requestId ?? "" });
          } else if (data?.type === "DONATION_CONFIRMATION") {
            setPending({ type: "DONATION_CONFIRMATION", requestId: data.requestId ?? "" });
          }
        } catch {}
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Register response listener once on mount
  useEffect(() => {
    // Handle taps that reopened the app from a killed/background state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  function handleResponse(response: Notifications.NotificationResponse) {
    const responseId = response.notification.request.identifier;
    // Deduplicate: each notification should only be handled once
    if (handledIdRef.current === responseId) return;
    handledIdRef.current = responseId;

    const data = response.notification.request.content.data as {
      type?: string;
      requestId?: string;
    };
    if (!data?.type || !data?.requestId) return;

    const notifType = data.type;
    const requestId = data.requestId;

    if (!isAuthRef.current) {
      // User not logged in — store the pending action and send to login screen
      AsyncStorage.setItem(
        PENDING_NOTIFICATION_KEY,
        JSON.stringify({ type: notifType, requestId })
      ).catch(() => {});
      router.replace("/(auth)/login");
      return;
    }

    if (notifType === "BLOOD_REQUEST") {
      router.replace("/(tabs)");
      setPending({ type: "BLOOD_REQUEST", requestId });
    } else if (notifType === "DONATION_CONFIRMATION") {
      router.replace("/(tabs)");
      setPending({ type: "DONATION_CONFIRMATION", requestId });
    } else if (notifType === "DONOR_ACCEPTED") {
      // Informational — just navigate home, no modal needed
      router.replace("/(tabs)");
    }
  }

  function clearPending() {
    setPending(null);
  }

  return (
    <>
      <BloodRequestModal
        visible={pending?.type === "BLOOD_REQUEST"}
        requestId={pending?.requestId ?? ""}
        onClose={clearPending}
      />
      <ConfirmDonationModal
        visible={pending?.type === "DONATION_CONFIRMATION"}
        requestId={pending?.requestId ?? ""}
        onClose={clearPending}
      />
    </>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  useEffect(() => {
    async function configureNavBar() {
      if (Platform.OS === "android") {
        await NavigationBar.setBackgroundColorAsync("#ff0000");
        await NavigationBar.setButtonStyleAsync("light");
        await NavigationBar.setVisibilityAsync("visible");
      }
    }
    configureNavBar();
  }, []);

  return (
    <AppProvider>
      <RouteGuard />
      <PushNotificationSetup />
      <NotificationHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.primary },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(stack)" />
      </Stack>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} translucent={false} />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
});
