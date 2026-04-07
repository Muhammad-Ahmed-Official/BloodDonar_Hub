import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/common/Label";
import { updatePassword, resendOtp } from "@/services/auth.service";

const RESEND_SECONDS = 60;

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp]               = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]       = useState(false);
  const [resending, setResending]   = useState(false);
  const [error, setError]           = useState("");
  const [resendMsg, setResendMsg]   = useState("");

  // ── Countdown timer ────────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setSeconds(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setResendMsg("");
    if (!otp.trim())        { setError("OTP is required"); return; }
    if (otp.trim().length !== 6) { setError("OTP must be 6 characters"); return; }
    if (!newPassword)       { setError("New password is required"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await updatePassword({ otp: otp.trim().toUpperCase(), newPassword });
      router.replace("/(auth)/login");
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email || seconds > 0) return;
    setError(""); setResendMsg("");
    setResending(true);
    try {
      await resendOtp({ email });
      setResendMsg("OTP resent! Check your email.");
      startTimer();
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const clearError = () => { setError(""); setResendMsg(""); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Reset Password</Text>
        <Text style={styles.description}>
          Enter the 6-digit OTP sent to{"\n"}
          <Text style={styles.emailHighlight}>{email ?? "your email"}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <Label title="OTP Code" />
        <Input
          placeholder="Enter 6-digit code"
          placeholderTextColor="#B0B0B0"
          autoCapitalize="characters"
          maxLength={6}
          value={otp}
          onChangeText={(t: string) => { setOtp(t); clearError(); }}
        />

        <Label title="New Password" />
        <Input
          placeholder="••••••••"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={newPassword}
          onChangeText={(t: string) => { setNewPassword(t); clearError(); }}
        />

        <Label title="Confirm New Password" />
        <Input
          placeholder="••••••••"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(t: string) => { setConfirmPassword(t); clearError(); }}
        />

        {!!error    && <Text style={styles.errorText}>{error}</Text>}
        {!!resendMsg && <Text style={styles.successText}>{resendMsg}</Text>}

        <Button title={loading ? "Updating..." : "Update Password"} onPress={handleSubmit} disabled={loading} />

        {/* ── Resend row ── */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get the code? </Text>
          {seconds > 0 ? (
            <Text style={styles.timerText}>Resend in {seconds}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>{resending ? "Sending..." : "Resend OTP"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.white, paddingHorizontal: 24, paddingTop: 50 },
  backButton:      { marginBottom: 40, alignSelf: "flex-start" },
  header:          { alignItems: "flex-start", marginBottom: 30 },
  subtitle:        { fontSize: 20, fontWeight: "700", color: COLORS.black, marginBottom: 12 },
  description:     { fontSize: 15, color: "#666", lineHeight: 22 },
  emailHighlight:  { color: COLORS.primary, fontWeight: "600" },
  form:            { width: "100%" },
  errorText:       { color: "#E53935", fontSize: 13, marginTop: 4, marginBottom: 8 },
  successText:     { color: "#2E7D32", fontSize: 13, marginTop: 4, marginBottom: 8 },
  resendRow:       { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  resendLabel:     { fontSize: 14, color: "#666" },
  timerText:       { fontSize: 14, color: "#999", fontWeight: "600" },
  resendLink:      { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
});
