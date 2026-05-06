import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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

// ─── Route Guard ──────────────────────────────────────────────────────────────
//
//  State machine:
//   ① Not authenticated           → /(auth)/login
//   ② Authenticated, unverified   → /(auth)/verification  (only that screen allowed)
//   ③ Authenticated, verified     → /(tabs) or /(admin)   (bounce out of auth group)
//   ④ profile-setup is in auth group but verified users are allowed to stay there
//
function RouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup    = segments[0] === "(auth)";
    const currentScreen  = segments[1] as string | undefined; // "login" | "verification" | "profile-setup" | …

    // ① Unauthenticated — only allow public auth screens
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    // ② Authenticated but email not verified
    //    Allow ONLY the verification screen — everything else bounces here
    if (isAuthenticated && !user?.isVerified) {
      const alreadyOnVerification = inAuthGroup && currentScreen === "verification";
      if (!alreadyOnVerification) {
        router.replace("/(auth)/verification");
      }
      return;
    }

    // ③ Authenticated + verified — bounce out of auth group
    //    Exception: profile-setup lives in auth group and is reached as an
    //    onboarding step after verification
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

// ─── Push Notification Initializer ───────────────────────────────────────────

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

// ─── Notification Tap Handler ─────────────────────────────────────────────────
// Handles taps on push notifications whether the app is foregrounded,
// backgrounded, or was completely killed. The Expo notification response
// listener fires in all three cases.

type PendingNotif =
  | { type: "BLOOD_REQUEST"; requestId: string }
  | { type: "DONATION_CONFIRMATION"; requestId: string }
  | null;

function NotificationHandler() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingNotif>(null);
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Check if app was opened FROM a killed state by a notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    // Fires when notification is tapped while app is in foreground or background
    listenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleResponse
    );

    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  function handleResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as {
      type?: string;
      requestId?: string;
    };

    if (!data?.type || !data?.requestId) return;

    if (data.type === "BLOOD_REQUEST") {
      router.replace("/(tabs)");
      setPending({ type: "BLOOD_REQUEST", requestId: data.requestId });
    } else if (data.type === "DONATION_CONFIRMATION") {
      router.replace("/(tabs)");
      setPending({ type: "DONATION_CONFIRMATION", requestId: data.requestId });
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
  return (
    <AppProvider>
        <RouteGuard />
        <PushNotificationSetup />
        <NotificationHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "white" },
            animation: "slide_from_right",
            navigationBarHidden: true,
          }}
          >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(stack)" />
        </Stack>
        <StatusBar style="light" />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
});
