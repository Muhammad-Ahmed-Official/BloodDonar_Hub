import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useRouter } from "expo-router";

export default function RequestDetails() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.profileLeft}>
          {/* Avatar placeholder */}
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color="#ccc" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Adin Ahmed</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= 4 ? "star" : "star-outline"}
                  size={12}
                  color="#FFB800"
                />
              ))}
            </View>
            <Text style={styles.profileLocation}>Karachi</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewProfileBtn} onPress={() => router.push("/(stack)/request")}>
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </View>

      {/* PATIENT DETAILS */}
      <Text style={styles.sectionTitle}>Patient Details</Text>
      <View style={styles.detailsCard}>
        <DetailRow label="Patient Name" value="Basim Khan" />
        <DetailRow label="Age" value="23" />
        <DetailRow label="Blood Group" value="A+" highlight />
        <DetailRow label="Units Required" value="3" />
        <DetailRow label="Hospital" value="Indus Hospital" />
        <DetailRow label="City" value="Karachi" isLast />
      </View>

      {/* CASE DETAILS */}
      <Text style={styles.sectionTitle}>Patient Details</Text>
      <View style={styles.detailsCard}>
        <DetailRow label="Case" value="Emergency" />
        <DetailRow label="Timing" value="07:00 PM - 5:00 PM" isLast />
      </View>

      {/* ACTIVITY */}
      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.detailsCard}>
        <View style={styles.activityRow}>
          <View style={styles.activityDot} />
          <Text style={styles.activityText}>Request Sent 1hr ago</Text>
        </View>
      </View>

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
      <Text style={[styles.detailValue, highlight && styles.highlightValue]}>
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

  /* HEADER */
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

  /* PROFILE CARD */
  profileCard: {
    backgroundColor: "#fff",
    margin: SIZES.padding,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOW,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    gap: 2,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 1,
    marginVertical: 2,
  },
  profileLocation: {
    fontSize: 12,
    color: "#888",
  },
  viewProfileBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewProfileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  /* SECTION */
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    marginBottom: 8,
  },

  /* DETAILS CARD */
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
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  highlightValue: {
    color: COLORS.primary,
  },

  /* ACTIVITY */
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activityText: {
    fontSize: 13,
    color: "#555",
  },
});