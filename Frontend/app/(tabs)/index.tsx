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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "../../constants/theme";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { useCallback, useEffect, useMemo, useState } from "react";
import Input from "@/components/common/Input";
import { getAllRequests, getPosts, getProfile } from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type PostRow = {
  _id: string;
  bloodGroup: string;
  patientName: string;
  city: string;
  hospital: string;
  date: string;
  address: string;
  isEmergency?: boolean;
};

type RequestRow = {
  _id: string;
  donarName?: string;
  bloodGroup?: string;
  city?: string;
  hospitalName?: string;
  date?: string;
  location?: string;
  reason?: string;
};

function requestLooksEmergency(reason?: string) {
  if (!reason) return false;
  return /emergency|urgent|critical/i.test(reason);
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [allRequests, setAllRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  const loadFeed = useCallback(async () => {
    setError("");
    const [postsRes, reqRes] = await Promise.all([
      getPosts({ page: 1, limit: 100 }),
      getAllRequests({ page: 1, limit: 100 }),
    ]);
    const posts = Array.isArray(postsRes?.data) ? postsRes.data : [];
    const reqs = Array.isArray(reqRes?.data) ? reqRes.data : [];
    setAllPosts(posts);
    setAllRequests(reqs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [prof] = await Promise.all([
          getProfile().catch(() => null),
          loadFeed(),
        ]);
        if (!cancelled && prof?.data?.userInfo?.pic) {
          setProfilePic(prof.data.userInfo.pic);
        }
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Failed to load";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFeed]);

  const filteredPosts = useMemo(() => {
    const c = cityInput.trim().toLowerCase();
    const g = selectedGroup;
    return allPosts.filter(
      (p) =>
        (!g || p.bloodGroup === g) &&
        (!c || String(p.city ?? "")
          .toLowerCase()
          .includes(c))
    );
  }, [allPosts, selectedGroup, cityInput]);

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
        <View style={[styles.header, { paddingTop: 30 + insets.top }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={22} color={COLORS.white} />
              )}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerName}>{user?.userName ?? "User"}</Text>
              <Text style={styles.headerSub} numberOfLines={2}>
                Donate Blood | also good for the donor&apos;s body
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
              size={18}
              color={COLORS.primary}
              style={styles.icon}
            />
          </View>

          <TouchableOpacity style={styles.dropdown} onPress={() => setShowGroup(!showGroup)}>
            <Text style={styles.dropdownText}>{selectedGroup || t("home.selectGroup")}</Text>
            <Ionicons name="water-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {showGroup && (
            <View style={styles.listContainer}>
              <FlatList
                data={bloodGroups}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroup(false);
                    }}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <Button title={refreshing ? t("home.refreshing") : t("common.submit")} onPress={onSubmit} disabled={refreshing} />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.bannerContainer}>
            <Image
              source={require("../../assets/projectImages/banner1.png")}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.sectionTitle}>{t("home.activityAs")}</Text>

          <View style={styles.activityRow}>
            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/infused_blood.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.bloodDonor")}</Text>
                <Text style={styles.activityCount}>{allPosts.length} posts</Text>
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
                <Text style={styles.activityCount}>{allRequests.length} requests</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/drop.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>{t("home.createPost")}</Text>
                <Text style={styles.activityCount}>It&apos;s Easy! 3 Step</Text>
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
                <Text style={styles.activityCount}>It&apos;s Easy! 1 Step</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("home.donationRequest")}</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              {filteredPosts.map((p) => (
                <Card
                  key={`post-${p._id}`}
                  bloodGroup={p.bloodGroup}
                  patientName={p.patientName}
                  city={p.city}
                  hospital={p.hospital}
                  date={p.date}
                  address={p.address}
                  isEmergency={!!p.isEmergency}
                />
              ))}
              {filteredRequests.map((r) => (
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
                />
              ))}
              {filteredPosts.length === 0 && filteredRequests.length === 0 && (
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
  },
  icon: {
    marginLeft: 8,
  },

  bannerContainer: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 15,
  },

  bannerImage: {
    width: "100%",
    height: "100%",
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
    color: "#777",
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
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
    marginBottom: 12,
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
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 12,
    flex: 1,
    minWidth: "45%",
    ...SHADOW,
  },
  activityImage: {
    width: 30,
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
