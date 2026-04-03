import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Button from "./Button";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Card({
  bloodGroup = "B+",
  patientName = "Patient Name",
  city = "Karachi",
  hospital = "Hospital Name",
  date = "12 Dec 2025",
  address = "National Stadium Rd, Karachi",
  isEmergency = true,
}: any) {
  return (
    <View style={styles.wrapper}>

      <View style={styles.container}>
        {/* LEFT */}
        <View style={styles.left}>
          <Image
            source={require("../../assets/projectImages/card1.png")}
            style={styles.bloodImg}
          />
          <Text style={styles.group}>{bloodGroup}</Text>
        </View>

        {/* CENTER */}
        <View style={styles.center}>
          <View style={styles.row}>
            <Text style={styles.name}>{patientName}</Text>
            {/* <Text style={styles.unit}>Unit  : {units}</Text> */}
          </View>

          <Text style={styles.city}>{city.toUpperCase()}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText}>{hospital}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText}>{date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText}>{address}</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.donateBtn}>
              <Text style={styles.donateText}>Donate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewBtn} onPress={() => router.push("/(stack)/request/123")}>
              <Text style={styles.viewText}>View Details</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* RIGHT (Emergency) */}
        {isEmergency && (
          <View style={styles.right}>
            <Image
              source={require("../../assets/projectImages/card2.png")}
              style={styles.emergencyImg}
            />
            <Text style={styles.emergencyText}>Emergency</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  container: {
    flexDirection: "row",
  },

  /* LEFT */
  left: {
    alignItems: "center",
    marginRight: 10,
  },
  bloodImg: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  group: {
    position: "absolute",
    top: 15,
    fontWeight: "bold",
    fontSize: 16,
  },

  /* CENTER */
  center: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 14,
  },
  unit: {
    fontSize: 12,
  },
  city: {
    backgroundColor: COLORS.primary,
    color: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    borderRadius: 5,
    marginVertical: 4,
    fontSize: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 6,
    flex: 1,
  },

  /* BUTTONS */
  btnRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },

  donateBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  donateText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 13,
  },

  viewBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  viewText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  /* RIGHT */
  right: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  emergencyImg: {
    width: 30,
    height: 100,
    resizeMode: "contain",
  },
  emergencyText: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});