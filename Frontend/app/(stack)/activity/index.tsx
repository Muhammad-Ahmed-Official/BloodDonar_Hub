import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const DATA = [
  {
    id: "1",
    name: "Receiver Name",
    location: "Location Here",
    blood: "AB +ve",
    donor: "Patient Name",
    status: "progress",
  },
  {
    id: "2",
    name: "Receiver Name",
    location: "Location Here",
    blood: "B +ve",
    donor: "Patient Name",
    status: "progress",
  },
  {
    id: "3",
    name: "Receiver Name",
    location: "Location Here",
    blood: "A +ve",
    donor: "Patient Name",
    status: "progress",
  },
  {
    id: "2",
    name: "Receiver Name",
    location: "Location Here",
    blood: "AB +ve",
    donor: "Patient Name",
    status: "completed",
  },
  {
    id: "3",
    name: "Receiver Name",
    location: "Location Here",
    blood: "AB +ve",
    donor: "Patient Name",
    status: "cancelled",
  },
];

const TABS = [
  { key: "progress", label: "IN PROGRESS" },
  { key: "completed", label: "COMPLETED" },
  { key: "cancelled", label: "CANCELLED" },
];

export default function ActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("progress");

  const filtered = DATA.filter((item) => item.status === activeTab);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>

        {/* ── RED HEADER BLOCK ── */}
        <View style={styles.headerBlock}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabsWrapper}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                activeTab === tab.key && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LIST ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ActivityCard item={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No records found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function ActivityCard({ item }: any) {
  const { badgeStyle, textStyle } = getStatusStyle(item.status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.receiverName}>{item.name}</Text>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusText, textStyle]}>
            {item.status === "progress"
              ? "Terminate"
              : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.locationText}>{item.location}</Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Donate to</Text>
          <Text style={styles.infoLabel}>Blood Group</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoValue}>{item.donor}</Text>
          <Text style={styles.infoValue}>{item.blood}</Text>
        </View>
      </View>
    </View>
  );
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "completed":
      return {
        badgeStyle: { backgroundColor: COLORS.primary },
        textStyle: { color: "#fff" },
      };
    case "cancelled":
      return {
        badgeStyle: { backgroundColor: COLORS.primary },
        textStyle: { color: "#fff" },
      };
    default:
      return {
        badgeStyle: { backgroundColor: COLORS.primary },
        textStyle: { color: "#fff" },
      };
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  /* ── RED HEADER BLOCK ── */
  headerBlock: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 36, // mirrors backBtn width to keep title perfectly centered
  },

  /* ── TABS PILL ── */
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 5,
    marginHorizontal: SIZES.padding,
    marginTop: 20,
    marginBottom: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.5,
  },

  /* ── LIST ── */
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 14,
  },

  /* ── CARD ── */
  card: {
    backgroundColor: "#FFE8E8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  receiverName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  locationText: {
    fontSize: 12,
    color: COLORS.black,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBlock: {
    gap: 3,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: COLORS.black,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "semibold",
    color: "#1A1A1A",
  },
});