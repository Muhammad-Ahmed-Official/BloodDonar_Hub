import { COLORS } from "@/constants/theme";
import { Text, StyleSheet } from "react-native";

export default function Label({ title } : any) {
  return (
    <Text style={styles.label}> {title}  </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: "500",
  },
  required: {
    color: COLORS.primary,
  },
});