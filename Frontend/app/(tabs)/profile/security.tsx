import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/theme";
import { changeNumber } from "@/services/user.service";

export default function AccountSecurityScreen() {
  const router = useRouter();
  const [phoneModal, setPhoneModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("English");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleSavePhone = async () => {
    const cleaned = phone.replace(/\D/g, "").slice(0, 11);
    setPhone(cleaned);
    setPhoneError("");

    if (!/^03\d{9}$/.test(cleaned)) {
      setPhoneError("Mobile number must be in format 03XXXXXXXXX");
      return;
    }

    setSavingPhone(true);
    try {
      await changeNumber(cleaned);
      setPhoneModal(false);
      Alert.alert("Success", "Mobile number updated");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not update mobile number";
      setPhoneError(msg);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account And Security</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* LIST */}
      <View style={styles.card}>
        
        {/* Account Info */}
        <TouchableOpacity style={styles.row}>
          <View style={styles.left}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.text}>Account Info</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Change Phone */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setPhoneModal(true)}
        >
          <View style={styles.left}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.text}>Change Phone Number</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Language */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setLangModal(true)}
        >
          <View style={styles.left}>
            <View style={styles.iconCircle}>
              <Ionicons name="globe" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.text}>Language</Text>
          </View>
          <View style={styles.rightValue}>
            <Text style={styles.languageValue}>{language}</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ================= PHONE MODAL ================= */}
      <Modal visible={phoneModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Phone Number</Text>

            <TextInput
              placeholder="Enter new phone number"
              style={styles.input}
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, "").slice(0, 11));
                setPhoneError("");
              }}
              keyboardType="phone-pad"
            />

            {!!phoneError && (
              <Text style={{ color: "#E53935", fontSize: 13, marginBottom: 10 }}>
                {phoneError}
              </Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePhone} disabled={savingPhone}>
              {savingPhone ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPhoneModal(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={langModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Language</Text>

            {/* English Option */}
            <TouchableOpacity
              style={styles.langOption}
              onPress={() => {
                setLanguage("English");
                setLangModal(false);
              }}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioCircle, language === "English" && styles.radioSelected]}>
                  {language === "English" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.langText}>English</Text>
              </View>
            </TouchableOpacity>

            {/* Urdu Option */}
            <TouchableOpacity
              style={styles.langOption}
              onPress={() => {
                setLanguage("Urdu");
                setLangModal(false);
              }}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioCircle, language === "Urdu" && styles.radioSelected]}>
                  {language === "Urdu" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.langText}>Urdu</Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setLangModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  rightValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  languageValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  text: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  saveText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },

  cancel: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 8,
  },

  // Language Modal Styles with Radio Buttons
  langOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  radioSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  langText: {
    fontSize: 16,
    color: COLORS.text,
  },

  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelBtnText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8
  },
});