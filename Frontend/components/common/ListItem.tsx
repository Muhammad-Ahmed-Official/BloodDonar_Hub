import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/theme";

export default function ListItem({ title } : any) {
  return (
    <View style={styles.item}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  text: {
    color: COLORS.text,
  },
});