import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getRequestById } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function RequestDetails() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams();
  const requestId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      try {
        const res = await getRequestById(requestId);
        setData(res?.data ?? null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!data) {
    return <Text style={{ padding: 20 }}>No Data</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("requestDetails.title")}</Text>
        <View style={{ width: 24 }} />
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
              router.push({ pathname: "/(stack)/request/", params: { userId: data.userId._id } })
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

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
        // onPress={onDonate ?? (() => router.push("/(tabs)/profile/medicalInfo"))}
        style={({ pressed }) => [
          styles.donateBtn,
          // !donationRequestId && styles.donateBtnFull,
          pressed && styles.donateBtnPressed,
        ]}
      >
        <Text style={styles.donateText}>Donate</Text>
      </Pressable>

    </ScrollView>
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
  container: {
    backgroundColor: "#fff",
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
    fontWeight: "bold",
    fontSize: 18,
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
  donateBtnDisabled: {
    backgroundColor: "#E0E0E0",
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