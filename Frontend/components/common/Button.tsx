import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

export default function Button({ title, onPress } : any) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: "center",
  },
  text: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});