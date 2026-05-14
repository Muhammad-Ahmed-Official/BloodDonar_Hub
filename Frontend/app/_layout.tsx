import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { useFonts } from "expo-font";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// TEMPORARILY DISABLED — expo-notifications not supported in Expo Go SDK 55
// import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";
import AppProvider from "@/context/AppProvider";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/theme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { saveExpoPushTokenToBackend } from "@/services/notifications";
// import BloodRequestModal from "@/components/BloodRequestModal";
// import ConfirmDonationModal from "@/components/ConfirmDonationModal";

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

// TEMPORARILY DISABLED — expo-notifications not supported in Expo Go SDK 55
// type PendingNotif =
//   | { type: "DONATION_CONFIRMATION"; requestId: string }
//   | null;

// function NotificationHandler() {
//   const router = useRouter();
//   const [pending, setPending] = useState<PendingNotif>(null);
//   const listenerRef = useRef<Notifications.EventSubscription | null>(null);
//   const handledIdRef = useRef<string | null>(null);
//
//   useEffect(() => {
//     Notifications.getLastNotificationResponseAsync().then((response) => {
//       if (response) handleResponse(response);
//     });
//     listenerRef.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
//     return () => { listenerRef.current?.remove(); };
//   }, []);
//
//   function handleResponse(response: Notifications.NotificationResponse) {
//     const responseId = response.notification.request.identifier;
//     if (handledIdRef.current === responseId) return;
//     handledIdRef.current = responseId;
//     const data = response.notification.request.content.data as { type?: string; requestId?: string };
//     if (!data?.type || !data?.requestId) return;
//     if (data.type === "BLOOD_REQUEST") {
//       router.replace("/(tabs)");
//     } else if (data.type === "DONATION_CONFIRMATION") {
//       router.replace("/(tabs)");
//       setPending({ type: "DONATION_CONFIRMATION", requestId: data.requestId });
//     }
//   }
//
//   function clearPending() { setPending(null); }
//
//   return (
//     <>
//       <BloodRequestModal visible={pending?.type === "BLOOD_REQUEST"} requestId={pending?.requestId ?? ""} onClose={clearPending} />
//       <ConfirmDonationModal visible={pending?.type === "DONATION_CONFIRMATION"} requestId={pending?.requestId ?? ""} onClose={clearPending} />
//     </>
//   );
// }

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setStyle("light");
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AppProvider>
        <RouteGuard />
        <PushNotificationSetup />
        
        {/* <NotificationHandler /> DISABLED — expo-notifications not supported in Expo Go SDK 55 */}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "white" },
            animation: "slide_from_right",
            // navigationBarHidden: true,
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
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
});
