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
import { COLORS, SIZES } from "@/constants/theme";
import { changeNumber } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";

export default function AccountSecurityScreen() {
  const router = useRouter();
  const [phoneModal, setPhoneModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const { language, setLanguage, t } = useLanguage();

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
      Alert.alert("Success", t("security.phoneUpdated"));
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
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("security.title")}</Text>
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
            <Text style={styles.text}>{t("security.accountInfo")}</Text>
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
            <Text style={styles.text}>{t("security.changePhone")}</Text>
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
            <Text style={styles.text}>{t("security.language")}</Text>
          </View>
          <View style={styles.rightValue}>
            <Text style={styles.languageValue}>{language === "en" ? "English" : "Urdu"}</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ================= PHONE MODAL ================= */}
      <Modal visible={phoneModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("security.phoneModalTitle")}</Text>

            <TextInput
              placeholder={t("security.phonePlaceholder")}
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
                <Text style={styles.saveText}>{t("common.save")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPhoneModal(false)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={langModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("security.selectLanguage")}</Text>

            {/* English Option */}
            <TouchableOpacity
              style={styles.langOption}
              onPress={() => {
                setLanguage("en");
                setLangModal(false);
              }}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioCircle, language === "en" && styles.radioSelected]}>
                  {language === "en" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.langText}>English</Text>
              </View>
            </TouchableOpacity>

            {/* Urdu Option */}
            <TouchableOpacity
              style={styles.langOption}
              onPress={() => {
                setLanguage("ur");
                setLangModal(false);
              }}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioCircle, language === "ur" && styles.radioSelected]}>
                  {language === "ur" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.langText}>Urdu</Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setLangModal(false)}
            >
              <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
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
    backgroundColor: COLORS.white
  },


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderColor: "#B8B8B8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.white,
    marginVertical: 24,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingVertical: 24,
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
    backgroundColor: "#B8B8B8",
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