import { TextInput, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

export default function Input(props: any) {
  const { style, ...rest } = props;
  return <TextInput style={[styles.input, style]} {...rest} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 14,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
});