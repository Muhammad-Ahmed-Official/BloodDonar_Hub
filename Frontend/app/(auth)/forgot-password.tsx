import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/common/Label";
import { forgotPassword } from "@/services/auth.service";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSend = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      // Pass email to updatePassword so it can resend OTP if needed
      router.push({ pathname: "/(auth)/updatePassword", params: { email: email.trim().toLowerCase() } });
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Forgot Password</Text>
        <Text style={styles.description}>
          Enter your email and we'll send you a 6-digit OTP to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <Label title="Email" />
        <Input
          placeholder="abc@gmail.com"
          keyboardType="email-address"
          placeholderTextColor="#B0B0B0"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(t: string) => { setEmail(t); setError(""); }}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Button title={loading ? "Sending..." : "Send OTP"} onPress={handleSend} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.white, paddingHorizontal: 24, paddingTop: 50 },
  backButton:  { marginBottom: 40, alignSelf: "flex-start" },
  header:      { alignItems: "flex-start", marginBottom: 30 },
  subtitle:    { fontSize: 20, fontWeight: "700", color: COLORS.black, marginBottom: 12 },
  description: { fontSize: 15, color: "#666", lineHeight: 22 },
  form:        { width: "100%" },
  errorText:   { color: "#E53935", fontSize: 13, marginTop: 4, marginBottom: 8 },
});
