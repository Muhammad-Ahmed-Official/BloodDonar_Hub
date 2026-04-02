import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES, SHADOW } from "../../../constants/theme";

const CHATS = [
  { id: "admin", name: "Chat with admin", last: "how can we help you?", time: "Yesterday", unread: 0, avatar: null, online: false },
  { id: "hassnan", name: "Hassnan Ali", last: "Where I can donate the blood", time: "12:42 AM", unread: 1, avatar: null, online: true },
  { id: "shakir", name: "Shakir", last: "Waiting...", time: "12:42 AM", unread: 0, avatar: null, online: false },
  { id: "adin", name: "Adin Asif", last: "ok thanks", time: "12:42 AM", unread: 0, avatar: null, online: false },
];

export default function InboxScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search name"
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
        <Ionicons name="search" size={16} color={COLORS.primary} />
      </View>

      {/* Chat List */}
      <FlatList
        data={CHATS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => router.push(`/(tabs)/inbox/${item.id}`)}
          >
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={22} color={COLORS.white} />
              </View>
              {item.online && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatLast} numberOfLines={1}>{item.last}</Text>
            </View>

            <View style={styles.chatRight}>
              <Text style={styles.chatTime}>{item.time}</Text>
              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },

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

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 15,
    marginBottom: 10,
    ...SHADOW,
  },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chatInfo: { flex: 1 },
  chatName: { fontWeight: "bold", fontSize: 14, color: COLORS.text, marginBottom: 3 },
  chatLast: { fontSize: 12, color: "#999" },
  chatRight: { alignItems: "flex-end", gap: 6 },
  chatTime: { fontSize: 11, color: "#aaa" },
  badge: {
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: "bold" },
});