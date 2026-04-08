import { View, Text, StyleSheet, Image } from "react-native";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export type DonorCardProps = {
  bloodGroup: string;
  donorName: string;
  city: string;
  about?: string;
};

export default function DonorCard({
  bloodGroup,
  donorName,
  city,
  about,
}: DonorCardProps) {
  const snippet =
    about && about.trim().length > 0
      ? about.trim().slice(0, 80) + (about.trim().length > 80 ? "…" : "")
      : "Ready to donate";

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Image
            source={require("../../assets/projectImages/card1.png")}
            style={styles.bloodImg}
          />
          <Text style={styles.group}>{bloodGroup}</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {donorName}
            </Text>
          </View>

          <Text style={styles.city}>{city.toUpperCase()}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="heart-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText} numberOfLines={2}>
              {snippet}
            </Text>
          </View>
        </View>
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
    flex: 1,
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
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 6,
    flex: 1,
  },
});
