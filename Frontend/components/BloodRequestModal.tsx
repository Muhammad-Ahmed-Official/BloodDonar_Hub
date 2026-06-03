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
import { respondToRequest } from "@/services/bloodRequest.service";

interface Props {
  visible: boolean;
  requestId: string;
  onClose: () => void;
}

export default function BloodRequestModal({ visible, requestId, onClose }: Props) {
  const [loading, setLoading] = useState<"yes" | "later" | null>(null);

  async function handleYes() {
    if (!requestId) return;
    setLoading("yes");
    try {
      await respondToRequest(requestId, "accept");
    } catch (err) {
      console.error("[BloodRequestModal] accept error:", err);
    } finally {
      setLoading(null);
      onClose();
    }
  }

  function handleMaybeLater() {
    onClose();
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
            <Text style={styles.icon}>🩸</Text>
          </View>

          <Text style={styles.title}>Are you available to donate blood?</Text>
          <Text style={styles.body}>
            Someone in your city needs blood urgently. Would you like to help by donating?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.laterBtn]}
              onPress={handleMaybeLater}
              disabled={loading !== null}
            >
              <Text style={styles.laterBtnText}>No, Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.yesBtn]}
              onPress={handleYes}
              disabled={loading !== null}
            >
              {loading === "yes" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Yes, I'm Available</Text>
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
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 30 },
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
  yesBtn: { backgroundColor: COLORS.primary },
  laterBtn: {
    backgroundColor: "#F2F2F7",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  laterBtnText: { color: "#666", fontWeight: "700", fontSize: 15 },
});
