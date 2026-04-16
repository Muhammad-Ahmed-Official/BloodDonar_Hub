import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import AppProvider from "@/context/AppProvider";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/theme";

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
    //    Exception: profile-setup lives in auth group and is reached after verification
    if (isAuthenticated && user?.isVerified && inAuthGroup) {
      const onProfileSetup = currentScreen === "profile-setup";
      if (!onProfileSetup) {
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

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AppProvider>
        <RouteGuard />
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
