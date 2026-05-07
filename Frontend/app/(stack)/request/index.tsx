import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import { getPublicUserProfile } from "@/services/user.service";

type PublicPayload = {
  user?: { userName?: string; email?: string };
  userInfo?: {
    pic?: string;
    mobileNumber?: string;
    city?: string;
    bloodGroup?: string;
    gender?: string;
    about?: string;
    country?: string;
    age?: string;
  } | null;
};

export default function PosterProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = Array.isArray(userId) ? userId[0] : userId;

  const [data, setData] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) {
      setErr("Missing user");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getPublicUserProfile(id);
        const d = res?.data as PublicPayload | undefined;
        if (!cancelled) setData(d ?? null);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not load profile";
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCall = () => {
    const raw = data?.userInfo?.mobileNumber?.replace(/\s/g, "") ?? "";
    if (!raw) {
      Alert.alert("Call", "No phone number on file.");
      return;
    }
    Linking.openURL(`tel:${raw}`);
  };

  const openChat = () => {
    if (!id) return;
    router.push(`/(tabs)/inbox/${id}`);
  };

  const pic = data?.userInfo?.pic?.trim();
  const name = data?.user?.userName ?? "User";
  const blood = data?.userInfo?.bloodGroup;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : err ? (
        <Text style={styles.errorText}>{err}</Text>
      ) : !data ? (
        <Text style={styles.errorText}>No profile data</Text>
      ) : (
        <>
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              {pic ? (
                <Image source={{ uri: pic }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={42} color="#ccc" />
                </View>
              )}
            </View>

            <Text style={styles.name}>{name}</Text>
            {blood ? (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{blood} Blood</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={openChat} style={styles.chatBtn}>
                <Text style={styles.chatBtnText}>Chat Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>ABOUT</Text>

            <AboutRow icon="person-outline" label="Age" value={data.userInfo?.age ?? "—"} />
            <AboutRow
              icon="male-outline"
              label="Gender"
              value={data.userInfo?.gender ? capitalize(data.userInfo.gender) : "—"}
            />
            <AboutRow icon="location-outline" label="City" value={data.userInfo?.city ?? "—"} />
            {/* <AboutRow icon="globe-outline" label="Country" value={data.userInfo?.country ?? "—"} /> */}
            <AboutRow icon="call-outline" label="Mobile" value={data.userInfo?.mobileNumber ?? "—"} />
            <AboutRow icon="mail-outline" label="Email" value={data.user?.email ?? "—"} isLast />
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function AboutRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.aboutRow, !isLast && styles.aboutRowBorder]}>
      <View style={styles.aboutLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.aboutLabel}>{label}</Text>
      </View>
      <Text style={styles.aboutValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  errorText: {
    color: "#E53935",
    padding: SIZES.padding,
    marginTop: 16,
  },
  bioText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderColor: "#B8B8B8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  bloodBadge: {
    paddingVertical: 4,
    marginBottom: 18,
  },
  bloodText: {
    fontSize: 12,
    fontWeight: "600",
  },

  actionRow: {
    flexDirection: "row",
    gap: 42,
    paddingVertical: 20
  },
  chatBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
  chatBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  callBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 6,
    borderRadius: 5,
  },
  callBtnText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  aboutCard: {
    backgroundColor: "#fff",
    marginHorizontal: SIZES.padding,
    borderRadius: 14,
    padding: 16,
    ...SHADOW,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 12,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    gap: 8,
  },
  aboutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  aboutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutLabel: {
    fontSize: 13,
    color: "#555",
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
});
