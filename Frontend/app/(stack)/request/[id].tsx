import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getRequestById } from "@/services/user.service";
import { getBloodRequestById, respondToRequest } from "@/services/bloodRequest.service";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

// Normalizes a BloodRequest API response to the Donar shape expected by this screen
function normalizeBloodRequest(raw: any) {
  if (!raw || !raw.createdBy) return raw; // already Donar shape
  return {
    ...raw,
    userId: raw.createdBy,
    donarName: raw.patientName ?? raw.donarName,
    amount: raw.requiredUnits != null ? String(raw.requiredUnits) : raw.amount,
    startTime: raw.donationWindow?.startTime ?? raw.startTime,
    endTime: raw.donationWindow?.endTime ?? raw.endTime,
    date: raw.donationDate ? new Date(raw.donationDate).toLocaleDateString() : raw.date,
  };
}

export default function RequestDetails() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams();
  const requestId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [donorStatus, setDonorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      try {
        // Try BloodRequest (new system) first
        const res = await getBloodRequestById(requestId);
        const raw = res?.data ?? null;
        const normalized = raw ? normalizeBloodRequest(raw) : null;
        setData(normalized);
        // Detect current user's donor status from the donors array
        if (normalized && user?._id) {
          const entry = normalized.donors?.find(
            (d: any) => String(d.donor?._id ?? d.donor) === String(user._id)
          );
          if (entry) setDonorStatus(entry.status);
        }
      } catch {
        // Fall back to old Donar system
        try {
          const res = await getRequestById(requestId);
          setData(res?.data ?? null);
        } catch {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, user?._id]);

  const handleDonate = async () => {
    if (donating || !requestId) return;
    setDonating(true);
    try {
      await respondToRequest(requestId, "accept");
      setDonorStatus("pending");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to respond to request");
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!data) {
    return <Text style={{ padding: 20 }}>No Data</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("requestDetails.title")}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Profile */}
      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          <View>
            <Text style={styles.name}>{data?.userId?.userName.charAt(0).toUpperCase() + data?.userId?.userName.slice(1) || "User"}</Text>
            <Text style={styles.city}>{data?.city || "—"}</Text>
          </View>
        </View>

        {user?._id !== data?.userId?._id && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push({ pathname: "/(stack)/request", params: { userId: data.userId._id } })
            }
          >
            <Text style={styles.btnText}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Patient Details */}
      <Section title="Patient Details">
        <DetailRow2
          leftLabel="Patient Name"
          leftValue={data.donarName}
          rightLabel="Age"
          rightValue={String(data.age || "—")}
        />
        <DetailRow2
          leftLabel="Blood Group"
          leftValue={data.bloodGroup}
          rightLabel="Units Required"
          rightValue={data.amount}
        />
        <DetailRow2
          leftLabel="Hospital"
          leftValue={data.hospitalName}
          rightLabel="City"
          rightValue={data.city}
          isLast
        />
      </Section>

      {/* Case */}
      <Section title="Patient Details">
        <DetailRow2
          leftLabel="Case"
          leftValue={data.reason || "Emergency"}
          rightLabel="Timing"
          rightValue={`${data.startTime} - ${data.endTime}`}
          isLast
        />
      </Section>

      {/* Activity — no bottom border */}
      <Section title="Activity" noBorder style={styles.section}>
        <Text style={styles.activity}>Request Sent {timeAgo(data.createdAt)}</Text>
      </Section>

      {(() => {
        const isOwner = String(data?.userId?._id ?? data?.createdBy) === String(user?._id);
        const hasAlreadyResponded =
          donorStatus != null && !["rejected", "cancelled"].includes(donorStatus);
        if (isOwner) return null;
        if (hasAlreadyResponded) {
          return (
            <View
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              style={[styles.donateBtn, styles.donateBtnDonated]}
            >
              <Text style={styles.donateText}>Donated</Text>
            </View>
          );
        }
        return (
          <Pressable
            accessibilityRole="button"
            onPress={handleDonate}
            disabled={donating}
            style={({ pressed }) => [
              styles.donateBtn,
              pressed && styles.donateBtnPressed,
              donating && { opacity: 0.6 },
            ]}
          >
            {donating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.donateText}>Donate</Text>
            )}
          </Pressable>
        );
      })()}
    </ScrollView>
    </SafeAreaView>
  );
}


function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function Section({ title, children, noBorder }: any) {
  return (
    <View style={[styles.section, noBorder && styles.sectionNoBorder]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow2({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  isLast,
}: any) {
  return (
    <View style={[styles.row]}>
      <View style={[styles.col, styles.leftCol]}>
        <Text style={styles.label}>{leftLabel}</Text>
        <Text style={styles.value}>{leftValue || "—"}</Text>
      </View>
      <View style={[styles.col, styles.rightCol]}>
        <Text style={styles.label}>{rightLabel}</Text>
        <Text style={styles.value}>{rightValue || "—"}</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: "#B8B8B8",
  },
  backBtn: {
    width: 24,
    marginLeft: -12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    marginTop: 12,
    marginBottom: 80,
    alignItems: "center",
  },

  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 10,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  name: {
    fontWeight: "bold",
    fontSize: 17,
  },

  city: {
    fontSize: 12,
    color: "#888",
  },

  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 9,
    borderRadius: 20,
  },

  btnText: {
    color: "#fff",
    fontSize: 13,
  },

  section: {
    borderBottomWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 24
  },

  sectionNoBorder: {
    borderBottomWidth: 0,
  },

  sectionTitle: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 8,
    marginLeft: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  col: {
    flex: 1,
    maxWidth: "50%",
  },

  leftCol: {
    alignItems: "flex-start",
  },

  rightCol: {
    alignItems: "flex-end",
  },

  label: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "left",
    marginLeft: 10,
  },

  value: {
    fontSize: 13,
    marginTop: 2,
    color: "#B8B8B8",
    marginLeft: 10,
  },

  activity: {
    fontSize: 13,
    marginTop: 10,
    marginLeft: 10,
  },
  donateBtnFull: {
    flex: 1,
    maxWidth: "100%",
  },
  donateBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 10
  },
  donateBtnDonated: {
    backgroundColor: "#2E7D32",
  },
  donateBtnDisabled: {
    backgroundColor: "#B8B8B8",
    borderWidth: 1,
    borderColor: "#BDBDBD",
    opacity: 1,
  },
  donateBtnPressed: {
    opacity: 0.88,
  },

  donateText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 13,
  },
  donateTextDisabled: {
    color: "#616161",
  },

});