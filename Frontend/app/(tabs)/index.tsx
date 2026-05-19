import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "../../constants/theme";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import Input from "@/components/common/Input";
import { getAllRequests, getProfile, deleteRequest } from "@/services/user.service";
import { getAssignedBloodRequests, getMyAssignments, getMyRequests, respondToRequest, getBloodRequestFeed, deleteBloodRequest } from "@/services/bloodRequest.service";
import { getRealtimeSocket } from "@/services/realtime";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BANNERS = [
  require("../../assets/projectImages/banner1.png"),
  require("../../assets/projectImages/banner2.jpeg"),
  require("../../assets/projectImages/banner3.jpeg"),
];
const BANNER_WIDTH = Dimensions.get("window").width - SIZES.padding * 2;

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

type AssignedRequest = {
  _id: string;
  patientName: string;
  bloodGroup: string;
  city: string;
  hospitalName: string;
  location: string;
  donationDate: string;
  donationWindow: { startTime: string; endTime: string };
  urgencyLevel: string;
  donorStatus: string;
};

function requestLooksEmergency(reason?: string) {
  if (!reason) return false;
  return /emergency|urgent|critical/i.test(reason);
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [allRequests, setAllRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [canDonateBlood, setCanDonateBlood] = useState<"yes" | "no" | "">("");
  const [hasMedicalInfo, setHasMedicalInfo] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assignedRequests, setAssignedRequests] = useState<AssignedRequest[]>([]);
  const [donatingId, setDonatingId] = useState<string | null>(null);
  const [donatedIds, setDonatedIds] = useState<Set<string>>(new Set());
  const [activityStats, setActivityStats] = useState({
    donorAssignments: 0,
    completedDonations: 0,
    ownRequests: 0,
    ownDonarPosts: 0,
  });

  const bannerRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadFeed = useCallback(async () => {
    setError("");
    const [reqRes, brRes] = await Promise.allSettled([
      getAllRequests({ page: 1, limit: 100 }),
      getBloodRequestFeed(),
    ]);
    const donarReqs =
      reqRes.status === "fulfilled" && Array.isArray(reqRes.value?.data)
        ? reqRes.value.data
        : [];
    const bloodReqs =
      brRes.status === "fulfilled" && Array.isArray(brRes.value?.data)
        ? brRes.value.data
        : [];
    setAllRequests([...donarReqs, ...bloodReqs]);
  }, []);

  const loadAssigned = useCallback(async () => {
    try {
      const res = await getAssignedBloodRequests();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAssignedRequests(list);
      // Pre-populate already-accepted ones as donated
      setDonatedIds((prev) => {
        const next = new Set(prev);
        list.forEach((r: AssignedRequest) => {
          if (r.donorStatus === "accepted") next.add(r._id);
        });
        return next;
      });
    } catch {
      // silently ignore — not critical
    }
  }, []);

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prof, , , allAssignmentsRes, myRequestsRes] = await Promise.all([
        getProfile().catch(() => null),
        loadFeed(),
        loadAssigned(),
        getMyAssignments().catch(() => null),
        getMyRequests().catch(() => null),
      ]);

      const info = prof?.data?.userInfo;
      const medList = prof?.data?.medicalInfo;
      const ownDonarPosts = Array.isArray(prof?.data?.donationRequests)
        ? prof.data.donationRequests.length
        : 0;

      if (info?.pic) setProfilePic(info.pic);
      setCanDonateBlood(info?.canDonateBlood === "yes" ? "yes" : "no");
      setHasMedicalInfo(Array.isArray(medList) ? medList.length > 0 : !!medList);

      const allAssignments = Array.isArray(allAssignmentsRes?.data)
        ? allAssignmentsRes.data
        : [];
      const myRequests = Array.isArray(myRequestsRes?.data)
        ? myRequestsRes.data
        : [];

      const uniqueRequestCount = new Set(
        myRequests.map((item: any) => item.requestId).filter(Boolean)
      ).size;

      setActivityStats({
        donorAssignments: allAssignments.length,
        completedDonations: allAssignments.filter(
          (a: any) => a.donorStatus === "completed"
        ).length,
        ownRequests: uniqueRequestCount,
        ownDonarPosts,
      });
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loadFeed, loadAssigned]);

  // useFocusEffect already fires on initial mount — no separate useEffect needed.
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  // Realtime: refresh active assignments whenever a requestUpdated socket event arrives.
  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket || !user?._id) return;

    const handleRequestUpdated = () => {
      loadAssigned();
    };

    socket.on("requestUpdated", handleRequestUpdated);
    return () => {
      socket.off("requestUpdated", handleRequestUpdated);
    };
  }, [user?._id, loadAssigned]);

  const filteredRequests = useMemo(() => {
    const c = cityInput.trim().toLowerCase();
    const g = selectedGroup;
    return allRequests.filter(
      (r) =>
        (!g || r.bloodGroup === g) &&
        (!c ||
          String(r.city ?? "")
            .toLowerCase()
            .includes(c))
    );
  }, [allRequests, selectedGroup, cityInput]);

  const getRequestOwnerId = (r: RequestRow) =>
    typeof r.userId === "object" ? r.userId?._id : r.userId;

  const handleDelete = async (requestId: string, source?: string) => {
    if (deletingId) return;
    try {
      setDeletingId(requestId);
      if (source === "bloodRequest") {
        await deleteBloodRequest(requestId);
      } else {
        await deleteRequest(requestId);
      }
      setAllRequests((prev) => prev.filter((r) => String(r._id) !== String(requestId)));
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to delete request.";
      Alert.alert("Error", msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDonateBloodRequest = async (requestId: string) => {
    if (donatingId) return;
    setDonatingId(requestId);
    try {
      await respondToRequest(requestId, "accept");
      setDonatedIds((prev) => new Set([...prev, requestId]));
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to respond to request.";
      Alert.alert("Error", msg);
    } finally {
      setDonatingId(null);
    }
  };

  const onSubmit = async () => {
    setRefreshing(true);
    setError("");
    try {
      await loadFeed();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Refresh failed";
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: 10 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={22} color={COLORS.white} />
              )}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerName}>
                {(user?.userName ?? "User").charAt(0).toUpperCase() +
                  (user?.userName ?? "User").slice(1)}
              </Text>
              <Text style={styles.headerSub} numberOfLines={2}>
                Donate Blood is also good for{'\n'}
                the donor&apos;s body
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentInner}>
          <View style={styles.containerSearch}>
            <Input
              style={styles.input}
              placeholder={t("home.searchLocation")}
              placeholderTextColor="#B0B0B0"
              value={cityInput}
              onChangeText={setCityInput}
            />
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.primary}
              style={styles.icon}
            />
          </View>

          <TouchableOpacity style={styles.dropdown} onPress={() => setShowGroup(!showGroup)}>
            <Text style={styles.dropdownText}>{selectedGroup || t("home.selectGroup")}</Text>
            {selectedGroup ? (
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  setSelectedGroup("");
                  setShowGroup(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ) : (
              <Image
                source={require("../../assets/projectImages/homeIcon.png")}
                style={styles.dropdownIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          {showGroup && (
            <View style={styles.listContainer}>
              <FlatList
                data={bloodGroups}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, selectedGroup === item && styles.selectedOption]}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroup(false);
                    }}
                  >
                    <Text style={selectedGroup === item && styles.selectedOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <Button title={refreshing ? t("home.refreshing") : t("common.submit")} onPress={onSubmit} disabled={refreshing} />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.bannerContainer}>
            <View style={styles.bannerSlider}>
              <FlatList
                ref={bannerRef}
                data={BANNERS}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                getItemLayout={(_, index) => ({
                  length: BANNER_WIDTH,
                  offset: BANNER_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / BANNER_WIDTH
                  );
                  setActiveBanner(index);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={item}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                )}
              />
            </View>
            <View style={styles.dotsRow}>
              {BANNERS.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeBanner && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("home.activityAs")}</Text>

          <View style={styles.activityRow}>
            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/infused_blood.png")}
                style={styles.activityImage}
                // resizeMode=""
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.bloodDonor")}</Text>
                <Text style={styles.activityCount}>
                  {activityStats.donorAssignments} assigned
                </Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/blood_recepent.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.bloodRecipient")}</Text>
                <Text style={styles.activityCount}>
                  {activityStats.ownRequests} requests
                </Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/drop.png")}
                style={styles.activityImageDrop}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.createPost")}</Text>
                <Text style={styles.activityCount}>
                  {activityStats.ownDonarPosts} posts
                </Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/blood_transfusion.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.bloodGiven")}</Text>
                <Text style={styles.activityCount}>
                  {activityStats.completedDonations} donated
                </Text>
              </View>
            </View>
          </View>

          {assignedRequests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Assigned to You</Text>
              {assignedRequests.map((r) => {
                const isDonated = donatedIds.has(r._id);
                const isDonating = donatingId === r._id;
                return (
                  <Card
                    key={`assigned-${r._id}`}
                    bloodGroup={r.bloodGroup}
                    patientName={r.patientName}
                    city={r.city}
                    hospital={r.hospitalName}
                    date={r.donationDate ? new Date(r.donationDate).toLocaleDateString() : "—"}
                    address={r.location}
                    isEmergency={r.urgencyLevel === "critical" || r.urgencyLevel === "high"}
                    isShow={true}
                    donated={isDonated}
                    donateDisabled={isDonating}
                    onDonate={!isDonated ? () => handleDonateBloodRequest(r._id) : undefined}
                  />
                );
              })}
            </>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
                <View style={styles.createRequestCard}>
                  <Text style={styles.createRequestTitle}>{t("search.createRequest")}</Text>
                  <Text style={styles.createRequestSubText}>
                    You are available as donor. Create your donation request.
                  </Text>
                  <Button title={t("search.createRequest")} onPress={() => router.push("/(tabs)/search/create")} />
                </View>
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
              {filteredRequests.length === 0 && (
                <Text style={styles.emptyFeed}>{t("home.noCards")}</Text>
              )}
            </>
          )}

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flexGrow: 1,
  },
  contentInner: {
    padding: SIZES.padding,
    gap: 10,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginBottom: 4,
  },
  emptyFeed: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
  },
  createRequestCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F6D5D5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  createRequestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  createRequestSubText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },

  containerSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    borderWidth: 0,
    marginBottom: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  icon: {
    marginLeft: 8,
  },

  bannerContainer: {
    width: "100%",
    marginVertical: 10,
  },
  bannerSlider: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  bannerImage: {
    width: BANNER_WIDTH,
    height: 120,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },

  listContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },

  dropdown: {
    backgroundColor: "#FFE8E8",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dropdownText: {
    flex: 1,
    color: "#777",
    fontSize: 14,
  },
  dropdownIcon: {
    width: 13,
    height: 18,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  selectedOption: {
    backgroundColor: "#FFE8E8",
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: SIZES.padding,
    width: "100%",
  },
  headerLeft: {
    paddingLeft: 40,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerName: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 3,
    maxWidth: 260,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
    textAlign: "center",
  },
  activityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FCFCFD',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 12,
    flex: 1,
    minWidth: "45%",
  },
  activityImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  activityImageDrop: {
    width: 23,
    height: 30,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "bold",
  },
  activityCount: {
    fontSize: 12,
    color: COLORS.black,
  },
});
