import { Tabs, usePathname } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getConversations } from "@/services/chat.service";
import { connectRealtime } from "@/services/realtime";

function TabIcon({
  name,
  focused,
  badgeCount,
}: {
  name: any;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View
      style={[
        styles.iconWrapper,
        focused && styles.iconWrapperActive,
      ]}
    >
      <Ionicons
        name={name}
        size={22}
        color="#fff"
      />

      {(badgeCount ?? 0) > 0 && (
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeText}>
            {badgeCount! > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Per-conversation unread map: partnerId → unreadCount
  // This lets us decrement only the read conversation without zeroing the rest
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const totalUnread = useMemo(
    () => Object.values(unreadMap).reduce((a, b) => a + b, 0),
    [unreadMap]
  );

  const isChatScreen = /^\/inbox\/.+/.test(pathname);

  // Extract the active chat partner id when inside a conversation
  const chatPartnerId = useMemo(() => {
    const match = pathname.match(/^\/inbox\/(.+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Ref so the socket handler always reads the latest chatPartnerId
  const chatPartnerIdRef = useRef<string | null>(null);
  useEffect(() => {
    chatPartnerIdRef.current = chatPartnerId;
  }, [chatPartnerId]);

  // Ref to detect the chat→non-chat transition
  const wasInChatRef = useRef(false);

  // Full API sync → rebuild the unread map from server data.
  // Always zeroes the currently-open chat partner so a slow API response
  // can never restore a count the user already cleared by opening the chat.
  const refreshUnread = useCallback(() => {
    getConversations()
      .then((res) => {
        const raw: any[] = Array.isArray(res?.data) ? res.data : [];
        const map: Record<string, number> = {};
        for (const c of raw) {
          if (c.partner?._id) {
            const pid = String(c.partner._id);
            map[pid] = pid === chatPartnerIdRef.current ? 0 : (c.unreadCount ?? 0);
          }
        }
        setUnreadMap(map);
      })
      .catch(() => {});
  }, []);

  // Populate on mount
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Zero out a conversation immediately when the user opens it (optimistic).
  // No early-return guard — always zero so a slow refreshUnread() response
  // can't restore the count after the user has already entered the chat.
  useEffect(() => {
    if (!chatPartnerId) return;
    setUnreadMap((prev) => ({ ...prev, [chatPartnerId]: 0 }));
  }, [chatPartnerId]);

  // Re-sync from server the moment the user leaves a chat screen.
  // emitSeen is called when the chat screen FOCUSES (before the user navigates
  // back), so the server has already marked the messages as read by this point.
  useEffect(() => {
    if (wasInChatRef.current && !isChatScreen) {
      refreshUnread();
    }
    wasInChatRef.current = isChatScreen;
  }, [isChatScreen, refreshUnread]);

  // Realtime: increment on new message from someone we're not currently chatting with
  useEffect(() => {
    if (!user?._id) return;
    const s = connectRealtime(String(user._id));
    if (!s) return;

    const onNewMessage = (payload: any) => {
      const senderId = String(payload?.sender ?? "");
      if (!senderId) return;
      if (senderId === chatPartnerIdRef.current) return;
      setUnreadMap((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] ?? 0) + 1,
      }));
    };

    s.on("newMessage", onNewMessage);
    return () => {
      s.off("newMessage", onNewMessage);
    };
  }, [user?._id]);

  const tabBarStyle = useMemo(() => ({
    ...styles.tabBar,
    height: 64 + insets.bottom,
    paddingBottom: insets.bottom + 6,
    display: (isChatScreen ? "none" : "flex") as "none" | "flex",
  }), [isChatScreen, insets.bottom]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: t("tabs.messages"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbox-outline" focused={focused} badgeCount={totalUnread}
          />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />

      {/* HIDDEN SCREENS */}
      <Tabs.Screen name="inbox/[chatId]"        options={{ href: null }} />
      <Tabs.Screen name="profile/privacy"       options={{ href: null }} />
      <Tabs.Screen name="profile/compatibility" options={{ href: null }} />
      <Tabs.Screen name="profile/medicalInfo"   options={{ href: null }} />
      <Tabs.Screen name="profile/security"      options={{ href: null }} />
      <Tabs.Screen name="search/create"         options={{ href: null }} />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.primary,
    borderTopWidth: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  tabItem: {
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
iconWrapper: {
  minWidth: 52,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
},

iconWrapperActive: {
  backgroundColor: "rgba(255,255,255,0.22)",
},
  navBadge: {
    position: "absolute",
    top: -2,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  navBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "bold",
  },
});
