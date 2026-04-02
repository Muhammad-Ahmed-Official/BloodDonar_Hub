import { View, Text, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { COLORS } from "../../constants/theme";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/onboarding");
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      
      <Image 
        source={require("../../assets/projectImages/logo.png")} 
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Blood Donar Hub</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: "bold",
  },
});