import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from '@expo/vector-icons/Ionicons';
import Label from "@/components/common/Label";

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const loading = false; // TODO: replace with real loading state

  const handleLogin = () => {
    // TODO: Add login logic here
    router.replace("/(auth)/verification");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} >
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Update Password</Text>
        <Text style={styles.description}>Enter your 6 digit OTP Code send we sent it to your email and set new password</Text>
      </View>

      <View style={styles.form}>
        <Label title="OTP Code" />
        <Input 
            placeholder="Enter code"
            placeholderTextColor="#B0B0B0"
            autoCorrect={false}
        />

        <Label title="New Password" />
        <Input 
          placeholder="••••••••" 
          placeholderTextColor="#B0B0B0"
          secureTextEntry 
        />
        
        <Label title="Confirm New Password" />
        <Input 
          placeholder="••••••••" 
          placeholderTextColor="#B0B0B0"
          secureTextEntry 
        />

        <Button
          title={loading ? "Signing ..." : "Sign Up"}
          onPress={handleLogin}
        />
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Did you don't get code?{" "}
          <Text style={styles.signupLink} >Resend Code </Text>
        </Text>
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

  forgotContainer: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 32,
  },

  forgotText: {
    color: COLORS.black,
    fontSize: 14.5,
    fontWeight: "500",
  },

  signupContainer: {
    marginTop: 20
  },

  signupText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },

  signupLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});