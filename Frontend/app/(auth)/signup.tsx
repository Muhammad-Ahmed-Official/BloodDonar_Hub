import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/common/Label";
import { useAuth } from "@/context/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [userName, setUserName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const validate = (): string => {
    if (!userName.trim())  return "Name is required";
    if (!email.trim())     return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email";
    if (!password)         return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleSignup = async () => {
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await signup(userName.trim(), email.trim().toLowerCase(), password);
      // route guard redirects to /(auth)/verification automatically
    } catch (err: any) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Create an account</Text>
        <Text style={styles.description}>Fill in the form below to get started</Text>
      </View>

      <View style={styles.form}>
        <Label title="Name" />
        <Input
          placeholder="john"
          placeholderTextColor="#B0B0B0"
          value={userName}
          onChangeText={(t: string) => { setUserName(t); clearError(); }}
        />

        <Label title="Email" />
        <Input
          placeholder="abc@gmail.com"
          keyboardType="email-address"
          placeholderTextColor="#B0B0B0"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(t: string) => { setEmail(t); clearError(); }}
        />

        <Label title="Password" />
        <Input
          placeholder="••••••••"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={password}
          onChangeText={(t: string) => { setPassword(t); clearError(); }}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ marginTop: 8 }}>
          <Button title={loading ? "Signing up..." : "Sign Up"} onPress={handleSignup} disabled={loading} />
        </View>
      </View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/(auth)/login")}>
            Login
          </Text>
        </Text>
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
  loginContainer: { marginTop: 20 },
  loginText:   { fontSize: 15, color: "#666", textAlign: "center" },
  loginLink:   { color: COLORS.primary, fontWeight: "bold" },
});
