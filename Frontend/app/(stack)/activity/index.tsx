import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getMyAssignments,
  getMyRequests,
  receiverRespondToDonor,
  confirmDonation,
} from "@/services/bloodRequest.service";
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
  status: "in_progress" | "completed" | "cancelled";
  donorStatus: string;
  donationDate?: string;
};

type ReceiverItem = {
  _id: string;
  requestId: string;
  patientName: string;
  donarName: string;
  donorId: string | null;
  donorBloodGroup: string | null;
  donorPic: string | null;
  city: string;
  bloodGroup: string;
  hospitalName: string;
  units: number;
  totalUnits?: number;
  unitNumber?: number;
  status: "pending" | "completed" | "cancelled";
  donorStatus: string;
  donationDate?: string;
};

const MAIN_TAB_KEYS = ["donor", "receiver"] as const;
type MainTabKey = (typeof MAIN_TAB_KEYS)[number];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTabKey>("donor");
  const [donorItems, setDonorItems] = useState<DonorItem[]>([]);
  const [receiverItems, setReceiverItems] = useState<ReceiverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;
    socket.on("requestUpdated", fetchAll);
    return () => {
      socket.off("requestUpdated", fetchAll);
    };
  }, [fetchAll]);

  // Receiver accepts or rejects a donor who responded yes
  const handleReceiverRespond = useCallback(
    async (requestId: string, donorId: string | null, action: "accept" | "reject") => {
      if (!donorId || respondingId) return;
      const key = `${requestId}-${donorId}-${action}`;
      setRespondingId(key);
      try {
        await receiverRespondToDonor(requestId, donorId, action);
        await fetchAll();
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Action failed");
      } finally {
        setRespondingId(null);
      }
    },
    [respondingId, fetchAll]
  );

  // Donor marks their own donation as completed (receiver-side "Donated" button)
  const handleMarkDonated = useCallback(
    async (requestId: string) => {
      if (confirmingId) return;
      setConfirmingId(requestId);
      try {
        await confirmDonation(requestId, true);
        await fetchAll();
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not confirm donation");
      } finally {
        setConfirmingId(null);
      }
    },
    [confirmingId, fetchAll]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.mainTabsWrapper}>
          {MAIN_TAB_KEYS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.mainTabBtn, mainTab === tab && styles.mainTabBtnActive]}
              onPress={() => setMainTab(tab)}
            >
              <Text style={[styles.mainTabText, mainTab === tab && styles.mainTabTextActive]}>
                {tab === "donor" ? "AS DONOR" : "AS RECEIVER"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : mainTab === "donor" ? (
          <FlatList
            data={donorItems}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/(stack)/request/${item.requestId}`)}>
                <DonorCard item={item} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No donation assignments yet.</Text>
            }
          />
        ) : (
          <FlatList
            data={receiverItems}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ReceiverCard
                item={item}
                respondingId={respondingId}
                confirmingId={confirmingId}
                onAccept={() => handleReceiverRespond(item.requestId, item.donorId, "accept")}
                onReject={() => handleReceiverRespond(item.requestId, item.donorId, "reject")}
                onMarkDonated={() => handleMarkDonated(item.requestId)}
                onPress={() => router.push(`/(stack)/request/${item.requestId}`)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No blood requests yet.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Donor Card ───────────────────────────────────────────────────────────────

function DonorCard({ item }: { item: DonorItem }) {
  const statusConfig = getDonorStatusConfig(item.donorStatus);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.cardName}>{item.receiverName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
          <Text style={styles.statusText}>{statusConfig.label}</Text>
        </View>
      </View>

      <Text style={styles.locationText}>{item.city}</Text>

      {item.donorStatus === "accepted" && item.donationDate && (
        <View style={styles.scheduledRow}>
          <Ionicons name="calendar-outline" size={13} color="#666" />
          <Text style={styles.scheduledText}>
            {new Date(item.donationDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      )}

      {item.donorStatus === "completed" && item.donationDate && (
        <View style={styles.scheduledRow}>
          <Ionicons name="checkmark-circle" size={13} color="#34C759" />
          <Text style={[styles.scheduledText, { color: "#34C759" }]}>
            Donated on{" "}
            {new Date(item.donationDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      )}

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
          <Text style={styles.infoValue}>
            {item.units} {item.units === 1 ? "unit" : "units"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getDonorStatusConfig(donorStatus: string): { label: string; color: string } {
  switch (donorStatus) {
    case "completed":
      return { label: "Donated 🩸", color: "#34C759" };
    case "accepted":
      return { label: "Accepted ✓", color: "#007AFF" };
    case "rejected":
    case "cancelled":
      return { label: "Not selected", color: "#C7C7CC" };
    default:
      return { label: "Waiting for acceptance", color: "#FF9500" };
  }
}

// ─── Receiver Card ────────────────────────────────────────────────────────────

type ReceiverCardProps = {
  item: ReceiverItem;
  respondingId: string | null;
  confirmingId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onMarkDonated: () => void;
  onPress: () => void;
};

function ReceiverCard({
  item,
  respondingId,
  confirmingId,
  onAccept,
  onReject,
  onMarkDonated,
  onPress,
}: ReceiverCardProps) {
  const acceptKey = `${item.requestId}-${item.donorId}-accept`;
  const rejectKey = `${item.requestId}-${item.donorId}-reject`;
  const isAccepting = respondingId === acceptKey;
  const isRejecting = respondingId === rejectKey;
  const isConfirming = confirmingId === item.requestId;
  const anyBusy = isAccepting || isRejecting || isConfirming;

  // Empty unit slot — no donor has responded for this slot yet
  if (!item.donorId) {
    return (
      <Pressable onPress={onPress}>
        <View style={styles.card}>
          {item.unitNumber !== undefined && item.totalUnits !== undefined && (
            <Text style={styles.unitLabel}>Unit {item.unitNumber} of {item.totalUnits}</Text>
          )}
          <View style={styles.topRow}>
            <Text style={styles.cardName}>{item.patientName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: "#FF9500" }]}>
              <Text style={styles.statusText}>Searching…</Text>
            </View>
          </View>
          <Text style={styles.locationText}>{item.city}</Text>
          <View style={styles.divider} />
          <Text style={styles.waitingText}>Waiting for a donor to respond…</Text>
        </View>
      </Pressable>
    );
  }

  // Rejected donors are hidden per spec
  if (item.donorStatus === "rejected") return null;

  return (
    <Pressable onPress={onPress}>
      <View style={styles.card}>
        {/* Unit slot header — shows "Unit N of M" when backend provides it */}
        {item.unitNumber !== undefined && item.totalUnits !== undefined && (
          <Text style={styles.unitLabel}>Unit {item.unitNumber} of {item.totalUnits}</Text>
        )}
        {/* Donor info row */}
        <View style={styles.donorRow}>
          {item.donorPic ? (
            <Image source={{ uri: item.donorPic }} style={styles.donorAvatar} />
          ) : (
            <View style={styles.donorAvatarPlaceholder}>
              <Ionicons name="person" size={18} color="#999" />
            </View>
          )}
          <View style={styles.donorInfo}>
            <Text style={styles.cardName}>{item.donarName}</Text>
            {item.donorBloodGroup && (
              <Text style={styles.donorBloodGroup}>Blood: {item.donorBloodGroup}</Text>
            )}
          </View>
          <ReceiverStatusBadge status={item.donorStatus} />
        </View>

        <Text style={styles.locationText}>{item.city} · {item.patientName}</Text>

        {item.donorStatus === "accepted" && item.donationDate && (
          <View style={styles.scheduledRow}>
            <Ionicons name="calendar-outline" size={13} color="#666" />
            <Text style={styles.scheduledText}>
              {new Date(item.donationDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        {item.donorStatus === "completed" && (
          <View style={styles.scheduledRow}>
            <Ionicons name="checkmark-circle" size={14} color="#34C759" />
            <Text style={[styles.scheduledText, { color: "#34C759", fontWeight: "600" }]}>
              Request Fulfilled ✓
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Accept / Reject buttons for donors who responded YES */}
        {item.donorStatus === "pending" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, anyBusy && styles.btnDisabled]}
              onPress={onReject}
              disabled={anyBusy}
            >
              {isRejecting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Reject</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn, anyBusy && styles.btnDisabled]}
              onPress={onAccept}
              disabled={anyBusy}
            >
              {isAccepting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Receiver can also mark donation as done when donor is accepted */}
        {item.donorStatus === "accepted" && (
          <TouchableOpacity
            style={[styles.donatedBtn, anyBusy && styles.btnDisabled]}
            onPress={onMarkDonated}
            disabled={anyBusy}
          >
            {isConfirming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.donatedBtnText}>Mark as Donated ✓</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

function ReceiverStatusBadge({ status }: { status: string }) {
  let color = "#FF9500";
  let label = "Pending";
  if (status === "accepted") { color = "#007AFF"; label = "Responding"; }
  if (status === "completed") { color = "#34C759"; label = "Donated"; }
  if (status === "cancelled" || status === "rejected") { color = "#C7C7CC"; label = "Cancelled"; }

  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: "#F8F8F8" },

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 40 },

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
  mainTabText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  mainTabTextActive: { color: COLORS.primary, fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },

  listContent: { paddingHorizontal: SIZES.padding, paddingTop: 4, paddingBottom: 24 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  locationText: { fontSize: 12, color: "#666", marginBottom: 8 },

  scheduledRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  scheduledText: { fontSize: 12, color: "#666" },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 12 },

  infoRow: { flexDirection: "row", gap: 24 },
  infoBlock: { gap: 4 },
  infoLabel: { fontWeight: "600", fontSize: 12, color: "#999" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },

  donorRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  donorAvatar: { width: 44, height: 44, borderRadius: 22 },
  donorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  donorInfo: { flex: 1 },
  donorBloodGroup: { fontSize: 12, color: COLORS.primary, fontWeight: "600", marginTop: 2 },

  waitingText: { fontSize: 13, color: "#999", textAlign: "center", paddingVertical: 4 },
  unitLabel: { fontSize: 11, fontWeight: "700", color: COLORS.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: { backgroundColor: "#34C759" },
  rejectBtn: { backgroundColor: "#FF3B30" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },

  donatedBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  donatedBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
