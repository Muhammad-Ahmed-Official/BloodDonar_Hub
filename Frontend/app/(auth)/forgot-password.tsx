import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from '@expo/vector-icons/Ionicons';
import Label from "@/components/common/Label";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const loading = false; // TODO: replace with real loading state

  const handleLogin = () => {
    // TODO: Add login logic here
    router.replace("/(auth)/updatePassword");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} >
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Forgot Password</Text>
        <Text style={styles.description}>Enter your email address and we will send you a 6 digit OTP code </Text>
      </View>

      <View style={styles.form}>
        <Label title="Email" />
        <Input 
          placeholder="abc@gmail.com" 
          keyboardType="email-address"
          placeholderTextColor="#B0B0B0"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <Button
          title={loading ? "Logging in..." : "Send"}
          onPress={handleLogin}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 50,
  },

  backButton: {
    marginBottom: 40,
    alignSelf: "flex-start",
  },

  header: {
    alignItems: "flex-start",
    marginBottom: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  form: {
    width: "100%",
  },

});