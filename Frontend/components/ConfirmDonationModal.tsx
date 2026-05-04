import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS } from "@/constants/theme";
import { confirmDonation } from "@/services/bloodRequest.service";

interface Props {
  visible: boolean;
  requestId: string;
  onClose: () => void;
}

export default function ConfirmDonationModal({ visible, requestId, onClose }: Props) {
  const [loading, setLoading] = useState<"yes" | "no" | null>(null);

  async function handleResponse(confirmed: boolean) {
    if (!requestId) return;
    setLoading(confirmed ? "yes" : "no");
    try {
      await confirmDonation(requestId, confirmed);
    } catch (err) {
      console.error("[ConfirmDonationModal] confirm error:", err);
    } finally {
      setLoading(null);
      onClose();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>✅</Text>
          </View>

          <Text style={styles.title}>Did you donate blood?</Text>
          <Text style={styles.body}>
            Please confirm whether you completed the blood donation so the patient's
            request can be updated.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.noBtn]}
              onPress={() => handleResponse(false)}
              disabled={loading !== null}
            >
              {loading === "no" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>No</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.yesBtn]}
              onPress={() => handleResponse(true)}
              disabled={loading !== null}
            >
              {loading === "yes" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Yes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0FFF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  yesBtn: {
    backgroundColor: COLORS.primary,
  },
  noBtn: {
    backgroundColor: "#FF3B30",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
