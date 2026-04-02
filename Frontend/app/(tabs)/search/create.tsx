import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

export default function CreateRequestScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input placeholder="Patient Name" />
        <Input placeholder="Hospital Name" />
        <Input placeholder="Required Date" />
        <Input placeholder="Units Required" keyboardType="numeric" />
        <Input placeholder="Location / Address" />
        <Input placeholder="Contact Number" keyboardType="phone-pad" />

        <Text style={styles.sectionLabel}>Blood Group</Text>
        <View style={styles.groupGrid}>
          {BLOOD_GROUPS.map((g) => (
            <TouchableOpacity key={g} style={styles.groupBtn}>
              <Ionicons name="water" size={14} color={COLORS.primary} />
              <Text style={styles.groupBtnText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <Button title="Submit Request" onPress={() => router.back()} />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
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
  sectionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 10 },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
  groupBtnText: { color: COLORS.primary, fontWeight: "bold", fontSize: 13 },
});