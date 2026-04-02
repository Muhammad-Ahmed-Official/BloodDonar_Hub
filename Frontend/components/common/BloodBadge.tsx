import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/theme";

export default function BloodBadge({ group }:any) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{group}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});