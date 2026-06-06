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
  markDonationDone,
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
  expiresAt?: string | null;
  requestStatus?: string;
};

type RequestGroup = {
  requestId: string;
  patientName: string;
  bloodGroup: string;
  hospitalName: string;
  city: string;
  units: number;
  status: string;
  donationDate?: string;
  expiresAt?: string | null;
  requestStatus?: string;
  donors: ReceiverItem[];
};

const MAIN_TAB_KEYS = ["donor", "receiver"] as const;
type MainTabKey = (typeof MAIN_TAB_KEYS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByRequest(items: ReceiverItem[]): RequestGroup[] {
  const map = new Map<string, RequestGroup>();
  for (const item of items) {
    if (!map.has(item.requestId)) {
      map.set(item.requestId, {
        requestId: item.requestId,
        patientName: item.patientName,
        bloodGroup: item.bloodGroup,
        hospitalName: item.hospitalName,
        city: item.city,
        units: item.units,
        status: item.status,
        donationDate: item.donationDate,
        expiresAt: item.expiresAt,
        requestStatus: item.requestStatus,
        donors: [],
      });
    }
    map.get(item.requestId)!.donors.push(item);
  }
  return Array.from(map.values());
}

function isRequestExpired(group: RequestGroup): boolean {
  return (
    group.requestStatus === "cancelled" &&
    group.expiresAt != null &&
    new Date(group.expiresAt) < new Date()
  );
}

function getRequestStatusConfig(
  status: string,
  expired: boolean
): { label: string; color: string } {
  if (expired) return { label: "Expired", color: "#FF6B35" };
  switch (status) {
    case "completed": return { label: "Completed", color: "#34C759" };
    case "cancelled": return { label: "Cancelled", color: "#C7C7CC" };
    default: return { label: "Active", color: COLORS.primary };
  }
}

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

  const handleMarkDonated = useCallback(
    async (requestId: string, donorId: string | null) => {
      if (!donorId || confirmingId) return;
      setConfirmingId(requestId);
      try {
        await markDonationDone(requestId, donorId);
        await fetchAll();
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not confirm donation");
      } finally {
        setConfirmingId(null);
      }
    },
    [confirmingId, fetchAll]
  );

  const requestGroups = groupByRequest(receiverItems);

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
            data={requestGroups}
            keyExtractor={(group) => group.requestId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: group }) => (
              <ReceiverRequestCard
                group={group}
                respondingId={respondingId}
                confirmingId={confirmingId}
                onAccept={(requestId, donorId) =>
                  handleReceiverRespond(requestId, donorId, "accept")
                }
                onReject={(requestId, donorId) =>
                  handleReceiverRespond(requestId, donorId, "reject")
                }
                onMarkDonated={handleMarkDonated}
                onPress={(requestId) => router.push(`/(stack)/request/${requestId}`)}
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

// ─── Donor Card (AS DONOR tab) ────────────────────────────────────────────────

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

// ─── Receiver Request Card (AS RECEIVER tab) ─────────────────────────────────

type ReceiverRequestCardProps = {
  group: RequestGroup;
  respondingId: string | null;
  confirmingId: string | null;
  onAccept: (requestId: string, donorId: string) => void;
  onReject: (requestId: string, donorId: string) => void;
  onMarkDonated: (requestId: string, donorId: string | null) => void;
  onPress: (requestId: string) => void;
};

function ReceiverRequestCard({
  group,
  respondingId,
  confirmingId,
  onAccept,
  onReject,
  onMarkDonated,
  onPress,
}: ReceiverRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expired = isRequestExpired(group);
  const statusConfig = getRequestStatusConfig(group.status, expired);
  const visibleDonors = group.donors.filter((d) => d.donorStatus !== "rejected");
  const hasDonors = visibleDonors.some((d) => d.donorId != null);

  // Donor count label shown in the collapsed hint row
  const donorCountLabel = hasDonors
    ? `${visibleDonors.filter((d) => d.donorId).length} donor${visibleDonors.filter((d) => d.donorId).length !== 1 ? "s" : ""} responded`
    : expired
    ? "No response received"
    : "Awaiting donors";

  return (
    <View style={[styles.requestCard, expired && styles.requestCardExpired]}>
      {/* Always-visible top section — tap to expand/collapse */}
      <Pressable onPress={() => setExpanded((v) => !v)}>
        {/* Blood group image + patient info + status */}
        <View style={styles.requestCardTop}>
          <View style={styles.bloodLeft}>
            <Image
              source={require("../../../assets/projectImages/card1.png")}
              style={[styles.bloodImg, expired && styles.bloodImgExpired]}
            />
            <Text style={styles.bloodGroupText}>{group.bloodGroup}</Text>
          </View>

          <View style={styles.requestCardCenter}>
            <View style={styles.requestNameRow}>
              <Text style={styles.requestPatientName} numberOfLines={1}>
                {group.patientName}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                <Text style={styles.statusText}>{statusConfig.label}</Text>
              </View>
            </View>

            <Text style={styles.cityBadge}>{String(group.city ?? "").toUpperCase()}</Text>

            <View style={styles.requestInfoRow}>
              <Ionicons name="business-outline" size={13} color={expired ? "#999" : COLORS.primary} />
              <Text style={styles.requestInfoText} numberOfLines={1}>{group.hospitalName}</Text>
            </View>

            <View style={styles.requestInfoRow}>
              <Ionicons name="water-outline" size={13} color={expired ? "#999" : COLORS.primary} />
              <Text style={styles.requestInfoText}>
                {group.units} {group.units === 1 ? "unit" : "units"} needed
              </Text>
            </View>
          </View>
        </View>

        {/* Expired banner — always visible */}
        {expired && (
          <View style={styles.expiredBanner}>
            <Ionicons name="time-outline" size={14} color="#FF6B35" />
            <Text style={styles.expiredBannerText}>
              Donation window closed
              {group.expiresAt
                ? ` · ${new Date(group.expiresAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </Text>
          </View>
        )}

        {/* Expand / collapse hint row */}
        <View style={styles.expandRow}>
          <Text style={styles.expandHintText}>{donorCountLabel}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#999"
          />
        </View>
      </Pressable>

      {/* Expandable donors section */}
      {expanded && (
        <>
          <View style={styles.donorsSectionDivider} />

          <Text style={styles.donorsSectionTitle}>
            {expired
              ? hasDonors ? "Donor Responses" : "No Response Received"
              : hasDonors ? "Donor Responses" : "Awaiting Donors"}
          </Text>

          {expired && !hasDonors ? (
            <View style={styles.expiredNodonorWrap}>
              <Ionicons name="sad-outline" size={28} color="#CCCCCC" />
              <Text style={styles.expiredNodonorTitle}>No donors responded in time</Text>
              <Text style={styles.expiredNodonorSub}>
                The donation window closed without any donor confirming availability.
              </Text>
            </View>
          ) : visibleDonors.length === 0 ? (
            <View style={styles.donorEntryEmpty}>
              <Ionicons name="person-outline" size={15} color="#999" />
              <Text style={styles.donorEntryEmptyText}>Waiting for a donor to respond…</Text>
            </View>
          ) : (
            visibleDonors.map((donor, index) => (
              <View key={donor._id}>
                {index > 0 && <View style={styles.donorSeparator} />}
                <DonorEntry
                  item={donor}
                  respondingId={respondingId}
                  confirmingId={confirmingId}
                  onAccept={() => donor.donorId && onAccept(donor.requestId, donor.donorId)}
                  onReject={() => donor.donorId && onReject(donor.requestId, donor.donorId)}
                  onMarkDonated={() => onMarkDonated(donor.requestId, donor.donorId)}
                  actionsDisabled={expired}
                />
              </View>
            ))
          )}

        </>
      )}
    </View>
  );
}

// ─── Donor Entry (inside Receiver Request Card) ───────────────────────────────

type DonorEntryProps = {
  item: ReceiverItem;
  respondingId: string | null;
  confirmingId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onMarkDonated: () => void;
  actionsDisabled?: boolean;
};

function DonorEntry({
  item,
  respondingId,
  confirmingId,
  onAccept,
  onReject,
  onMarkDonated,
  actionsDisabled = false,
}: DonorEntryProps) {
  // Empty slot — no donor responded yet
  if (!item.donorId) {
    return (
      <View style={styles.donorEntryEmpty}>
        <Ionicons name="person-outline" size={15} color="#999" />
        <Text style={styles.donorEntryEmptyText}>Slot open — waiting for donor</Text>
      </View>
    );
  }

  const acceptKey = `${item.requestId}-${item.donorId}-accept`;
  const rejectKey = `${item.requestId}-${item.donorId}-reject`;
  const isAccepting = respondingId === acceptKey;
  const isRejecting = respondingId === rejectKey;
  const isConfirming = confirmingId === item.requestId;
  const anyBusy = isAccepting || isRejecting || isConfirming;

  return (
    <View style={styles.donorEntry}>
      {/* Avatar + name + status */}
      <View style={styles.donorEntryRow}>
        {item.donorPic ? (
          <Image source={{ uri: item.donorPic }} style={styles.donorAvatar} />
        ) : (
          <View style={styles.donorAvatarPlaceholder}>
            <Ionicons name="person" size={18} color="#999" />
          </View>
        )}
        <View style={styles.donorInfo}>
          <Text style={styles.donorEntryName}>{item.donarName}</Text>
          {item.donorBloodGroup && (
            <Text style={styles.donorBloodGroup}>Blood: {item.donorBloodGroup}</Text>
          )}
        </View>
        <ReceiverStatusBadge status={item.donorStatus} />
      </View>

      {item.donorStatus === "completed" && (
        <View style={[styles.scheduledRow, { marginTop: 4 }]}>
          <Ionicons name="checkmark-circle" size={13} color="#34C759" />
          <Text style={[styles.scheduledText, { color: "#34C759", fontWeight: "600" }]}>
            Request Fulfilled ✓
          </Text>
        </View>
      )}

      {item.donorStatus === "pending" && !actionsDisabled && (
        <View style={[styles.actionRow, { marginTop: 10 }]}>
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

      {item.donorStatus === "accepted" && !actionsDisabled && (
        <TouchableOpacity
          style={[styles.donatedBtn, { marginTop: 10 }, anyBusy && styles.btnDisabled]}
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

  // AS DONOR tab card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  locationText: { fontSize: 12, color: "#666", marginBottom: 8 },

  scheduledRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  scheduledText: { fontSize: 12, color: "#666" },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 12 },

  infoRow: { flexDirection: "row", gap: 24 },
  infoBlock: { gap: 4 },
  infoLabel: { fontWeight: "600", fontSize: 12, color: "#999" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },

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

  // AS RECEIVER tab — request card (home Card style)
  requestCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    ...SHADOW,
  },
  requestCardTop: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bloodLeft: {
    alignItems: "center",
    marginRight: 10,
  },
  bloodImg: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  bloodGroupText: {
    position: "absolute",
    top: 15,
    fontWeight: "bold",
    fontSize: 16,
    color: "#1A1A1A",
  },
  requestCardCenter: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  requestPatientName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  cityBadge: {
    backgroundColor: COLORS.primary,
    color: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 6,
    fontSize: 10,
    overflow: "hidden",
  },
  requestInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 5,
  },
  requestInfoText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },

  // Donors section inside the request card
  donorsSectionDivider: {
    height: 1,
    backgroundColor: "#F0E0E0",
    marginVertical: 10,
  },
  donorsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  donorSeparator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginVertical: 10,
  },

  // Expand / collapse row
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0E0E0",
  },
  expandHintText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },

  // Expired state styles
  requestCardExpired: {
    backgroundColor: "#FFF8F6",
    borderWidth: 1,
    borderColor: "#FFD4C2",
  },
  bloodImgExpired: {
    opacity: 0.4,
  },
  expiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF0EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFD4C2",
  },
  expiredBannerText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
    flex: 1,
  },
  expiredNodonorWrap: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  expiredNodonorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#AAAAAA",
    textAlign: "center",
  },
  expiredNodonorSub: {
    fontSize: 12,
    color: "#BBBBBB",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // Individual donor entry inside the request card
  donorEntry: {
    paddingVertical: 2,
  },
  donorEntryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  donorEntryName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  donorEntryEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  donorEntryEmptyText: {
    fontSize: 13,
    color: "#999",
  },
});
