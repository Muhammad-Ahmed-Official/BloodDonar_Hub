import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/common/Label";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): string => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleLogin = async () => {
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
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
        <Text style={styles.subtitle}>Welcome to Blood Care!</Text>
        <Text style={styles.description}>Enter your email address and password to login</Text>
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
          onChangeText={(text:string) => { setEmail(text); setError(""); }}
        />

        <Label title="Password" />
        <View style={styles.passwordField}>
          <Input
            placeholder="••••••••"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              setError("");
            }}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            style={styles.passwordEye}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Inline error — shows server message or validation error */}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.forgotContainer}
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title={loading ? "Logging in..." : "Login"}
          onPress={handleLogin}
          disabled={loading}
        />
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>
          Don't have an account?{" "}
          <Text style={styles.signupLink} onPress={() => router.push("/(auth)/signup")}>
            Sign up
          </Text>
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
  passwordField: {
    position: "relative",
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 48,
  },
  passwordEye: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
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
    marginTop: 20,
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