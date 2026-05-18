import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/common/Button";
import { getAllRequests, getProfile, deleteRequest } from "@/services/user.service";
import { getBloodRequestFeed, deleteBloodRequest } from "@/services/bloodRequest.service";
import Card from "@/components/common/Card";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

type RequestRow = {
  _id: string;
  donarName?: string;
  bloodGroup?: string;
  city?: string;
  hospitalName?: string;
  date?: string;
  location?: string;
  reason?: string;
  userId?: { _id: string; userName?: string; email?: string } | string;
  source?: "donar" | "bloodRequest";
};

function requestLooksEmergency(reason?: string) {
  if (!reason) return false;
  return /emergency|urgent|critical/i.test(reason);
}

const getRequestOwnerId = (r: RequestRow) =>
  typeof r.userId === "object" ? r.userId?._id : r.userId;

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState("");
  const [canDonateBlood, setCanDonateBlood] = useState<"yes" | "no" | "">("");
  const [hasMedicalInfo, setHasMedicalInfo] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadLists = useCallback(async (mode: "initial" | "submit") => {
    if (mode === "initial") setLoading(true);
    else setSubmitting(true);
    setListError("");
    try {
      const [reqRes, brRes, profRes] = await Promise.all([
        getAllRequests({ page: 1, limit: 200 }),
        getBloodRequestFeed().catch(() => null),
        getProfile().catch(() => null),
      ]);
      if (!mountedRef.current) return;
      const info = profRes?.data?.userInfo;
      const medList = profRes?.data?.medicalInfo;
      setCanDonateBlood(info?.canDonateBlood === "yes" ? "yes" : "no");
      setHasMedicalInfo(Array.isArray(medList) ? medList.length > 0 : !!medList);
      const donarReqs = Array.isArray(reqRes?.data) ? (reqRes.data as RequestRow[]) : [];
      const bloodReqs = Array.isArray(brRes?.data) ? (brRes.data as RequestRow[]) : [];
      setRequests([...donarReqs, ...bloodReqs]);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not load cards.";
      setListError(msg);
    } finally {
      if (!mountedRef.current) return;
      if (mode === "initial") setLoading(false);
      else setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    loadLists("initial");
  }, [loadLists]);

  const handleDelete = async (requestId: string, source?: string) => {
    if (deletingId) return;
    try {
      setDeletingId(requestId);
      if (source === "bloodRequest") {
        await deleteBloodRequest(requestId);
      } else {
        await deleteRequest(requestId);
      }
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(requestId)));
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to delete request.";
      Alert.alert("Error", msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    loadLists("submit");
  };

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (selectedGroup && r.bloodGroup !== selectedGroup) return false;
      if (!q) return true;
      return (
        String(r.city ?? "").toLowerCase().includes(q) ||
        String(r.donarName ?? "").toLowerCase().includes(q) ||
        String(r.hospitalName ?? "").toLowerCase().includes(q)
      );
    });
  }, [requests, selectedGroup, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("search.createRequest")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder={t("search.placeholder")}
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="search-outline" size={20} color="#FF0000" />
        </View>

        <Button title={t("common.submit")} onPress={handleSearchSubmit} disabled={submitting} />

        <Text style={styles.sectionTitle}>{t("search.bloodGroup")}</Text>
        <View style={styles.groupGrid}>
          {BLOOD_GROUPS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.groupBtn, selectedGroup === g && styles.groupBtnActive]}
              onPress={() => setSelectedGroup(g === selectedGroup ? null : g)}
            >
              <View style={styles.iconWrapper}>
                <Image
                  source={require("../../../assets/projectImages/drop2.png")}
                  style={styles.bloodIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.bloodText, { color: COLORS.white }]}>{g}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {t("search.results")}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : listError ? (
          <Text style={styles.errorText}>{listError}</Text>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>{t("search.noCards")}</Text>
          </View>
        ) : (
          <>
            {filteredRequests.map((r) => {
              const isOwner = String(getRequestOwnerId(r)) === String(user?._id);
              const handleDonate = () => {
                if (!hasMedicalInfo) {
                  router.push("/(tabs)/profile/medicalInfo");
                  return;
                }
                if (r._id) router.push(`/(stack)/request/${r._id}`);
              };
              return (
                <Card
                  key={`req-${r._id}`}
                  bloodGroup={r.bloodGroup ?? "—"}
                  patientName={r.donarName ?? "Patient"}
                  city={r.city ?? "—"}
                  hospital={r.hospitalName ?? "—"}
                  date={r.date ?? "—"}
                  address={r.location ?? "—"}
                  isEmergency={requestLooksEmergency(r.reason)}
                  donationRequestId={r._id}
                  donateDisabled={canDonateBlood !== "yes"}
                  isOwner={isOwner}
                  onDelete={isOwner ? () => handleDelete(r._id, r.source) : undefined}
                  isDeleting={deletingId === r._id}
                  onDonate={!isOwner ? handleDonate : undefined}
                />
              );
            })}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  backBtn: {
    width: 24,
    marginLeft: -12,
  },


  content: { padding: SIZES.padding, flexGrow: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#FFF5F5",
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text,  },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.text, marginVertical: 18, marginLeft: 16 },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 6,
  },
  groupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  groupBtnActive: {
    backgroundColor: "#FFE8E8",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  bloodIcon: {
    width: 36,
    height: 36,
  },
  bloodText: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "bold",
  },
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: "#777",
    fontSize: 15,
    textAlign: "center",
  },
});
