import { View, Text, StyleSheet, Image, TouchableOpacity} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../../constants/theme";
import Button from "@/components/common/Button";
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding2() {  
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../../../assets/projectImages/frame2.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Save Lifes</Text>
        <Text style={styles.description}>
          Create blood donation requests and get help instantly, or donate when needed
        </Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
      </View>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Next"
          onPress={() => router.push("/(auth)/onboarding/step3")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  skipText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "600",
  },

  // Image Section
  imageContainer: {
    flex: 1.1,                    
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  image: {
    width: "100%",
    height: "100%",
    maxHeight: 380,
  },

  // Text Content
  content: {
    paddingHorizontal: 30,
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  // Dots
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 24,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },

  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});