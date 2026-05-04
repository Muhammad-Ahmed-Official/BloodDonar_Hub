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
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyAssignments, getMyRequests } from "@/services/bloodRequest.service";
import { getRealtimeSocket } from "@/services/realtime";

// ─── Types ────────────────────────────────────────────────────────────────────

type DonorItem = {
  _id: string;
  requestId: string;
  receiverName: string;
  city: string;
  bloodGroup: string;
  hospitalName: string;
  units: number;
  status: "in_progress" | "completed";
  donorStatus: string;
};

type ReceiverItem = {
  _id: string;
  requestId: string;
  donarName: string;
  city: string;
  bloodGroup: string;
  hospitalName: string;
  units: number;
  status: "pending" | "completed" | "cancelled";
};

// ─── Tab Config ───────────────────────────────────────────────────────────────

const MAIN_TAB_KEYS = ["donor", "receiver"] as const;
type MainTabKey = (typeof MAIN_TAB_KEYS)[number];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTabKey>("donor");

  const [donorItems, setDonorItems] = useState<DonorItem[]>([]);
  const [receiverItems, setReceiverItems] = useState<ReceiverItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [assignRes, reqRes] = await Promise.all([
        getMyAssignments(),
        getMyRequests(),
      ]);
      setDonorItems(assignRes?.data ?? []);
      setReceiverItems(reqRes?.data ?? []);
    } catch (err) {
      console.error("[Activity] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time: re-fetch when a requestUpdated event arrives on this user's socket room
  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;

    function onRequestUpdated() {
      fetchAll();
    }

    socket.on("requestUpdated", onRequestUpdated);
    return () => {
      socket.off("requestUpdated", onRequestUpdated);
    };
  }, [fetchAll]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Main Tabs: Donor / Receiver ── */}
        <View style={styles.mainTabsWrapper}>
          {MAIN_TAB_KEYS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.mainTabBtn, mainTab === tab && styles.mainTabBtnActive]}
              onPress={() => setMainTab(tab)}
            >
              <Text style={[styles.mainTabText, mainTab === tab && styles.mainTabTextActive]}>
                {tab === "donor" ? "DONOR" : "RECEIVER"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : mainTab === "donor" ? (
          <FlatList
            data={donorItems}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <DonorCard item={item} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No donation assignments yet.</Text>}
          />
        ) : (
          <FlatList
            data={receiverItems}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <ReceiverCard item={item} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No blood requests yet.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Donor Card ───────────────────────────────────────────────────────────────

function DonorCard({ item }: { item: DonorItem }) {
  const getStatusStyle = () => {
    switch (item.donorStatus) {
      case "completed":  return { backgroundColor: "#34C759" };
      case "accepted":   return { backgroundColor: "#007AFF" };
      case "rejected":
      case "cancelled":  return { backgroundColor: "#FF3B30" };
      default:           return { backgroundColor: "#FF9500" };
    }
  };

  const getStatusLabel = () => {
    switch (item.donorStatus) {
      case "completed":  return "Completed";
      case "accepted":   return "Accepted";
      case "rejected":   return "Rejected";
      case "cancelled":  return "Cancelled";
      default:           return "Pending";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.cardName}>{item.receiverName}</Text>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>
      </View>

      <Text style={styles.locationText}>{item.city}</Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Hospital</Text>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoLabel}>Units</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoValue}>{item.hospitalName}</Text>
          <Text style={styles.infoValue}>{item.bloodGroup}</Text>
          <Text style={styles.infoValue}>{item.units} {item.units === 1 ? "unit" : "units"}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Receiver Card ────────────────────────────────────────────────────────────

function ReceiverCard({ item }: { item: ReceiverItem }) {
  const getStatusStyle = () => {
    switch (item.status) {
      case "completed": return { backgroundColor: "#34C759" };
      case "cancelled": return { backgroundColor: "#FF3B30" };
      default:          return { backgroundColor: "#007AFF" };
    }
  };

  const getStatusLabel = () => {
    switch (item.status) {
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default:          return "Pending";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.cardName}>{item.donarName}</Text>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>
      </View>

      <Text style={styles.locationText}>{item.city}</Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Hospital</Text>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoLabel}>Units</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoValue}>{item.hospitalName}</Text>
          <Text style={styles.infoValue}>{item.bloodGroup}</Text>
          <Text style={styles.infoValue}>{item.units} {item.units === 1 ? "unit" : "units"}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  // Header
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

  // Main Tabs (Donor / Receiver)
  mainTabsWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 6,
    marginHorizontal: SIZES.padding,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  mainTabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTabText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  mainTabTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // List
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 4,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 14,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Card
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
  cardName: {
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
    gap: 24,
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
