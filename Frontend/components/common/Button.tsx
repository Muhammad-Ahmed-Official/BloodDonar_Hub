import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, SIZES, FONT_FAMILY } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function Button({ title, onPress, disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        disabled ? styles.btnDisabled : pressed && !disabled ? styles.btnPressed : null,
      ]}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.88,
  },
  btnDisabled: {
    backgroundColor: "#BDBDBD",
    opacity: 1,
  },
  text: {
    fontFamily: FONT_FAMILY,
    color: COLORS.white,
    fontWeight: "bold",
  },
  textDisabled: {
    color: "#F5F5F5",
  },
});
