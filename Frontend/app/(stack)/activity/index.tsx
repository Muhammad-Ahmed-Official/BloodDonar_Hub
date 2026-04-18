import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile } from "@/services/user.service";

type DonationRequestItem = {
  _id: string;
  donarName?: string;
  city?: string;
  bloodGroup?: string;
  hospitalName?: string;
  location?: string;
  contactPersonName?: string;
  status?: string;
};

const TAB_KEYS = ["progress", "completed", "cancelled"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABEL: Record<TabKey, string> = {
  progress: "IN PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

function apiStatusForTab(tab: TabKey): string {
  if (tab === "progress") return "in_progress";
  return tab;
}

export default function ActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("progress");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DonationRequestItem[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getProfile();
      const raw = res?.data?.donationRequests;
      const list = Array.isArray(raw) ? raw : [];
      setItems(list as DonationRequestItem[]);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not load activity";
      setErr(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((item) => (item.status ?? "in_progress") === apiStatusForTab(activeTab));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabsWrapper}>
          {TAB_KEYS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{TAB_LABEL[tab]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : err ? (
          <Text style={styles.emptyText}>{err}</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <ActivityCard item={item} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No records found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ActivityCard({ item }: { item: DonationRequestItem }) {
  const status = item.status ?? "in_progress";

  const getStatusLabel = () => {
    switch (status) {
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "in_progress":
      default:
        return "In progress";
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case "completed":
        return { backgroundColor: "#34C759" };
      case "cancelled":
        return { backgroundColor: "#FF3B30" };
      default:
        return { backgroundColor: "#FF9500" };
    }
  };

  const title = item.donarName?.trim() ? item.donarName : "Blood request";
  const loc = item.location?.trim() || item.city?.trim() || "—";
  const donateTo = item.contactPersonName?.trim() || item.hospitalName?.trim() || "—";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.receiverName}>{title}</Text>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>
      </View>

      <Text style={styles.locationText}>{loc}</Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Donate to</Text>
          <Text style={styles.infoLabel}>Blood Group</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoValue}>{donateTo}</Text>
          <Text style={styles.infoValue}>{item.bloodGroup ?? "—"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  headerBlock: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },

  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 6,
    marginHorizontal: SIZES.padding,
    marginTop: 24,
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
  },

  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontWeight: "600",
    fontSize: 12,
    color: "#999",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});
