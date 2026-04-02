import { TextInput, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

export default function Input(props:any, type='') {
  return <TextInput style={styles.input} {...props} type={type} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 14,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
});