import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function Button({ title, onPress, disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
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
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});
