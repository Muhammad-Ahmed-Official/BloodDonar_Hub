import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getRequestById } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";

type PosterProfile = {
  pic?: string;
  mobileNumber?: string;
  city?: string;
  bloodGroup?: string;
  gender?: string;
  about?: string;
  country?: string;
};

type RequestDetail = {
  _id?: string;
  donarName?: string;
  bloodGroup?: string;
  amount?: string;
  age?: number;
  date?: string;
  hospitalName?: string;
  city?: string;
  location?: string;
  contactPersonName?: string;
  mobileNumber?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  posterProfile?: PosterProfile | null;
  userId?: { _id?: string; userName?: string; email?: string } | string;
};

function getOwnerId(userId: RequestDetail["userId"]): string {
  if (userId && typeof userId === "object" && userId._id) {
    return String(userId._id);
  }
  if (typeof userId === "string") return userId;
  return "";
}

export default function RequestDetails() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Array.isArray(id) ? id[0] : id;

  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!requestId) {
      setErr("Missing request id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getRequestById(requestId);
        const d = res?.data as RequestDetail | undefined;
        if (!cancelled) setData(d ?? null);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not load request";
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const poster =
    data?.userId && typeof data.userId === "object"
      ? data.userId.userName ?? "User"
      : "User";

  const posterPic = data?.posterProfile?.pic?.trim();
  const posterCity = data?.posterProfile?.city ?? data?.city ?? "";
  const ownerId = data ? getOwnerId(data.userId) : "";

  const openPosterProfile = () => {
    if (!ownerId) return;
    router.push({
      pathname: "/(stack)/request",
      params: { userId: ownerId },
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("requestDetails.title")}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : err ? (
        <Text style={styles.errorText}>{err}</Text>
      ) : !data ? (
        <Text style={styles.errorText}>{t("requestDetails.noData")}</Text>
      ) : (
        <>
          <View style={styles.profileCard}>
            <View style={styles.profileLeft}>
              <View style={styles.avatarCircle}>
                {posterPic ? (
                  <Image source={{ uri: posterPic }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={28} color="#ccc" />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {poster}
                </Text>
                <Text style={styles.profileLocation} numberOfLines={1}>
                  {posterCity || "—"}
                </Text>
              </View>
            </View>
            {!!ownerId && (
              <TouchableOpacity style={styles.viewProfileBtn} onPress={openPosterProfile}>
                <Text style={styles.viewProfileText}>{t("requestDetails.viewProfile")}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>{t("requestDetails.patientDetails")}</Text>
          <View style={styles.detailsCard}>
            <DetailRow label={t("requestDetails.patientName")} value={data.donarName ?? "—"} />
            <DetailRow label={t("requestDetails.age")} value={data.age != null ? String(data.age) : "—"} />
            <DetailRow label={t("requestDetails.bloodGroup")} value={data.bloodGroup ?? "—"} highlight />
            <DetailRow label={t("requestDetails.units")} value={data.amount ?? "—"} />
            <DetailRow label={t("requestDetails.hospital")} value={data.hospitalName ?? "—"} />
            <DetailRow label={t("requestDetails.city")} value={data.city ?? "—"} isLast />
          </View>

          <Text style={styles.sectionTitle}>{t("requestDetails.case")}</Text>
          <View style={styles.detailsCard}>
            <DetailRow label={t("requestDetails.dateNeeded")} value={data.date ?? "—"} />
            <DetailRow label={t("requestDetails.timing")} value={`${data.startTime ?? "—"} – ${data.endTime ?? "—"}`} />
            <DetailRow label={t("requestDetails.contact")} value={data.contactPersonName ?? "—"} />
            <DetailRow label={t("requestDetails.mobile")} value={data.mobileNumber ?? "—"} />
            <DetailRow label={t("requestDetails.address")} value={data.location ?? "—"} isLast />
          </View>

          {!!data.reason && (
            <>
              <Text style={styles.sectionTitle}>{t("requestDetails.reason")}</Text>
              <View style={[styles.detailsCard, { paddingVertical: 12 }]}>
                <Text style={styles.reasonText}>{data.reason}</Text>
              </View>
            </>
          )}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  isLast,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.highlightValue]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    color: "#E53935",
    padding: SIZES.padding,
    marginTop: 16,
  },
  reasonText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: SIZES.padding,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#1A1A1A",
  },

  profileCard: {
    backgroundColor: "#fff",
    margin: SIZES.padding,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    ...SHADOW,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileInfo: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  profileLocation: {
    fontSize: 12,
    color: "#888",
  },
  viewProfileBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
  },
  viewProfileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    marginBottom: 8,
  },

  detailsCard: {
    backgroundColor: "#fff",
    marginHorizontal: SIZES.padding,
    borderRadius: 14,
    paddingHorizontal: 16,
    ...SHADOW,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
  highlightValue: {
    color: COLORS.primary,
  },
});
