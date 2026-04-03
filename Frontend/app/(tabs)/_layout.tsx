import { Tabs, usePathname } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({ name, focused, type = "ionicons" }: { name: any; focused: boolean; type?: "ionicons" | "material" }) {
  return (
    <View style={[styles.iconWrap, focused && styles.activeWrap]}>
      {type === "ionicons" ? (
        <Ionicons
          name={name}
          size={22}
          color={focused ? COLORS.primary : COLORS.white}
        />
      ) : (
        <MaterialIcons
          name={name}
          size={22}
          color={focused ? COLORS.primary : COLORS.white}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  
  // Hide tab bar on dynamic chat route (pathname is e.g. /inbox/hassnan, not /inbox/[chatId])
  const isChatScreen = /^\/inbox\/.+/.test(pathname);
  const shouldHideTabBar = isChatScreen;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === "ios" ? 70 + insets.bottom : 70,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
          display: shouldHideTabBar ? "none" : "flex", // Hide tab bar on chat
        },
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} type="ionicons" />
          ),
        }}
      />

      {/* INBOX TAB - Using MaterialIcons chat icon */}
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chat" focused={focused} type="material" />
          ),
        }}
      />

      {/* SEARCH TAB */}
      <Tabs.Screen
        name="search/index"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} type="ionicons" />
          ),
        }}
      />

      {/* PROFILE TAB */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} type="ionicons" />
          ),
        }}
      />

      

      {/* HIDE CHAT SCREEN FROM TABS */}
      <Tabs.Screen
        name="inbox/[chatId]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/privacy"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/compatibility"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/medicalInfo"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/security"
        options={{
          href: null,
        }}
      />


      {/* HIDE CREATE SCREEN FROM TABS */}
      <Tabs.Screen
        name="search/create"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.primary,
    borderTopWidth: 0,
    marginBottom: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeWrap: {
    backgroundColor: COLORS.white,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});