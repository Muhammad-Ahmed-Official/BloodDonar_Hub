import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/theme";

export default function ProfileHeader({ name } : any) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 12,
  },
  name: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});