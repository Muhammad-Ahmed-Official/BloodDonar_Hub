import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { COLORS } from "../../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "@/components/common/Label";
import { useAuth } from "@/context/AuthContext";
import { resendOtp } from "@/services/auth.service";

const RESEND_SECONDS = 60;

export default function VerificationScreen() {
  const router   = useRouter();
  const { verifyOtp, user } = useAuth();

  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState("");
  const [resendMsg, setResendMsg] = useState("");

  // ── Countdown timer ────────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setSeconds(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setError(""); setResendMsg("");
    if (!otp.trim()) { setError("Please enter the OTP code"); return; }
    if (otp.trim().length !== 6) { setError("OTP must be 6 characters"); return; }

    setLoading(true);
    try {
      await verifyOtp(otp.trim().toUpperCase());
      // Verified → navigate to profile-setup manually
      // Route guard allows profile-setup for verified users
      router.replace("/(auth)/profile-setup");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!user?.email || seconds > 0) return;
    setError(""); setResendMsg("");
    setResending(true);
    try {
      await resendOtp({ email: user.email });
      setResendMsg("OTP resent! Check your email.");
      startTimer();
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.subtitle}>Verification Code</Text>
        <Text style={styles.description}>
          Enter the 6-digit OTP sent to{"\n"}
          <Text style={styles.emailHighlight}>{user?.email ?? "your email"}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <Label title="OTP Code" />
        <Input
          placeholder="Enter 6-digit code"
          placeholderTextColor="#B0B0B0"
          autoCorrect={false}
          keyboardType="default"
          autoCapitalize="characters"
          maxLength={6}
          value={otp}
          onChangeText={(t: string) => { setOtp(t); setError(""); setResendMsg(""); }}
        />

        {!!error    && <Text style={styles.errorText}>{error}</Text>}
        {!!resendMsg && <Text style={styles.successText}>{resendMsg}</Text>}

        <Button title={loading ? "Verifying..." : "Verify"} onPress={handleVerify} disabled={loading} />

        {/* ── Resend row ── */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get the code? </Text>

          {seconds > 0 ? (
            <Text style={styles.timerText}>Resend in {seconds}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>
                {resending ? "Sending..." : "Resend OTP"}
              </Text>
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
