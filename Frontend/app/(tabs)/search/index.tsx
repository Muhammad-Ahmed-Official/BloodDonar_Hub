import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import { useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

export default function SearchScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={18} color="#aaa" />
        </View>

        <Button title="Submit" onPress={() => router.push("/(tabs)/search/create")} />

        <Text style={styles.sectionTitle}>Blood Group</Text>
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

                <Text
                    style={[
                    styles.bloodText,
                    { color: COLORS.white },
                    ]}
                >
                    {g}
                </Text>
                </View>
            </TouchableOpacity>
        ))}
        </View>

        <Text style={styles.sectionTitle}>Donation Request</Text>

        <Card
            bloodGroup="A+"
            patientName="Ali Khan"
            city="Karachi"
            hospital="Aga Khan Hospital"
            date="15 Dec 2025"
            address="National Stadium Rd, Karachi"
            isEmergency={true}
            />

            <Card
            bloodGroup="O-"
            patientName="Ahmed Raza"
            city="Lahore"
            hospital="Shaukat Khanum"
            date="20 Dec 2025"
            address="Johar Town, Lahore"
            isEmergency={false}
            />

            <Card
            bloodGroup="B+"
            patientName="Hamza"
            city="Islamabad"
            hospital="Shaukat Khanum"
            date="25 Jan 2025"
            address="Johar Town, Lahore"
            isEmergency={false}
            />

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: COLORS.white 
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
    backgroundColor: '#FFE8E8' 
  },
  groupBtnText: { color: COLORS.primary, fontWeight: "bold", fontSize: 13 },
  groupBtnTextActive: { color: COLORS.white },
  
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
  position: "absolute",   // 🔥 overlay text on image
  fontSize: 10,
  fontWeight: "bold",
},
});