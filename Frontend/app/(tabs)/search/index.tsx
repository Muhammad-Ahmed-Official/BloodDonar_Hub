import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/common/Button";
import { getAllRequests, getPosts } from "@/services/user.service";
import Card from "@/components/common/Card";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

type PostRow = {
  _id: string;
  bloodGroup: string;
  city: string;
  patientName: string;
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

export default function SearchScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setListError("");
      try {
        const [postsRes, reqRes] = await Promise.all([
          getPosts({ page: 1, limit: 200 }),
          getAllRequests({ page: 1, limit: 200 }),
        ]);
        const postsRaw = postsRes?.data;
        const reqRaw = reqRes?.data;
        if (!cancelled) {
          setPosts(Array.isArray(postsRaw) ? (postsRaw as PostRow[]) : []);
          setRequests(Array.isArray(reqRaw) ? (reqRaw as RequestRow[]) : []);
        }
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not load cards.";
        if (!cancelled) setListError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (selectedGroup && p.bloodGroup !== selectedGroup) return false;
      if (!q) return true;
      return (
        String(p.city ?? "").toLowerCase().includes(q) ||
        String(p.patientName ?? "").toLowerCase().includes(q) ||
        String(p.hospital ?? "").toLowerCase().includes(q)
      );
    });
  }, [posts, selectedGroup, searchQuery]);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search by city, name, hospital"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="search-outline" size={18} color="#aaa" />
        </View>

        <Button title="Create request" onPress={() => router.push("/(tabs)/search/create")} />

        <Text style={styles.sectionTitle}>Blood group</Text>
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

        <Text style={styles.sectionTitle}>Results ({filteredPosts.length + filteredRequests.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : listError ? (
          <Text style={styles.errorText}>{listError}</Text>
        ) : filteredPosts.length === 0 && filteredRequests.length === 0 ? (
          <Text style={styles.emptyText}>No cards match your filters.</Text>
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
        </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  content: { padding: SIZES.padding },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.text, marginVertical: 12 },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  groupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
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
  emptyText: {
    color: "#777",
    fontSize: 14,
    marginTop: 12,
  },
});
