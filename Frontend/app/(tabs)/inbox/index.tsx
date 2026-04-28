import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES, SHADOW } from "../../../constants/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getConversations, searchUsers } from "@/services/chat.service";
import { useFocusEffect } from "@react-navigation/native";
import { connectRealtime } from "@/services/realtime";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

type Partner = { _id: string; userName?: string; pic?: string };
type SearchUser = { _id: string; userName?: string; email?: string; pic?: string; city?: string };

type ConversationRow = {
  _id: string;
  message?: string;
  createdAt?: string;
  unreadCount?: number;
  partner?: Partner;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [list, setList] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear search whenever user leaves this tab (WhatsApp-like behavior)
  // Important: must memoize callback to avoid subscribe/unsubscribe loop.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setQuery("");
        setSearchResults([]);
        setSearching(false);
        setSearchError("");
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = null;
      };
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getConversations();
        const raw = res?.data;
        setList(Array.isArray(raw) ? raw : []);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not load conversations";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live refresh conversations on new messages
  useEffect(() => {
    if (!user?._id) return;
    const s = connectRealtime(String(user._id));
    if (!s) return;

    const onNewMessage = () => {
      // lightweight refresh
      getConversations()
        .then((res) => {
          const raw = res?.data;
          setList(Array.isArray(raw) ? raw : []);
        })
        .catch(() => {});
    };

    const onSeen = () => {
      getConversations()
        .then((res) => {
          const raw = res?.data;
          setList(Array.isArray(raw) ? raw : []);
        })
        .catch(() => {});
    };

    s.on("newMessage", onNewMessage);
    s.on("seenMsg", onSeen);
    return () => {
      s.off("newMessage", onNewMessage);
      s.off("seenMsg", onSeen);
    };
  }, [user?._id]);

  const filtered = useMemo(() => {
    const withPartner = list.filter((item) => !!item.partner?._id);
    const q = query.trim().toLowerCase();
    if (!q) return withPartner;
    return withPartner.filter((item) => {
      const name = String(item.partner?.userName ?? "").toLowerCase();
      const last = String(item.message ?? "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [list, query]);

  // WhatsApp-like: when user types, search users even if no conversations exist.
  useEffect(() => {
    const q = query.trim();
    setSearchError("");

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchUsers(q);
        const raw = res?.data;
        setSearchResults(Array.isArray(raw) ? raw : []);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not search users";
        setSearchError(msg);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const showSearchMode = query.trim().length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("inbox.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* <View style={styles.searchWrap}>
        <TextInput
          placeholder={t("inbox.searchPlaceholder")}
          placeholderTextColor="#aaa"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
        <Ionicons name="search" size={16} color={COLORS.primary} />
      </View> */}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : showSearchMode ? (
        <>
          {searching ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
          ) : searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingTop: 8 }}
            ListEmptyComponent={
              searching ? null : (
                <Text style={styles.emptyText}>{t("inbox.noUsers")}</Text>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => router.push(`/(tabs)/inbox/${item._id}`)}
              >
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    {item.pic ? (
                      <Image source={{ uri: item.pic }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={22} color={COLORS.white} />
                    )}
                  </View>
                </View>

                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{item.userName ?? "User"}</Text>
                  <Text style={styles.chatLast} numberOfLines={1}>
                    {item.city ? `${item.city} • ${item.email ?? ""}` : item.email ?? ""}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingTop: 8 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("inbox.noConversations")}</Text>
          }
          renderItem={({ item }) => {
            const partnerId = item.partner!._id;
            const name = item.partner?.userName ?? "User";
            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => router.push(`/(tabs)/inbox/${partnerId}`)}
              >
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    {item.partner?.pic ? (
                      <Image source={{ uri: item.partner.pic }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={22} color={COLORS.white} />
                    )}
                  </View>
                </View>

                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{name}</Text>
                  <Text style={styles.chatLast} numberOfLines={1}>
                    {item.message ?? ""}
                  </Text>
                </View>

                <View style={styles.chatRight}>
                  <Text style={styles.chatTime}>{formatTime(item.createdAt)}</Text>
                  {(item.unreadCount ?? 0) > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unreadCount! > 99 ? "99+" : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={{ height: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 23,
    paddingBottom: 23,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#B8B8B8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding,
    marginVertical: 12,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, padding: 5, color: COLORS.text },

  errorText: {
    color: "#E53935",
    paddingHorizontal: SIZES.padding,
    marginTop: 16,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 24,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 15,
    marginBottom: 10,
    ...SHADOW,
  },
  avatarWrap: { marginRight: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  chatLast: { fontSize: 13, color: "#888", marginTop: 4 },
  chatRight: { alignItems: "flex-end" },
  chatTime: { fontSize: 11, color: "#aaa" },
  badge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: "bold" },
});
