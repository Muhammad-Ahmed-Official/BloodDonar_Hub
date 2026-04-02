import { View, StyleSheet } from "react-native";
import { COLORS, SIZES, SHADOW } from "../../constants/theme";

export default function AppCard({ children }:any) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    ...SHADOW,
  },
});