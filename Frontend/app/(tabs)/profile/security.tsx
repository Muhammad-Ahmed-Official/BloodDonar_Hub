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
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS, PAKISTAN_CITIES } from "@/constants/theme";
import { changeNumber, updateAccountInfo, getProfile, updateProfile } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";


export default function AccountSecurityScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Phone modal
  const [phoneModal, setPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Language modal
  const [langModal, setLangModal] = useState(false);

  // Account info modal
  const [accountModal, setAccountModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState(user?.userName ?? "");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCity, setShowCity] = useState(false);
  const [about, setAbout] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  // ── Phone ───────────────────────────────────────────────────────────────────

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

  // ── Account info ────────────────────────────────────────────────────────────

  const handleOpenAccountModal = async () => {
    setAvatarUri(null);
    setExistingAvatarUrl(null);
    setUserName(user?.userName ?? "");
    setSelectedCity("");
    setCitySearch("");
    setShowCity(false);
    setAbout("");
    setAccountError("");
    setAccountModal(true);

    setLoadingProfile(true);
    try {
      const res = await getProfile();
      const info = res?.data?.userInfo;
      if (info?.pic) setExistingAvatarUrl(info.pic);
      if (info?.city) setSelectedCity(info.city);
      if (info?.about) setAbout(info.about);
    } catch {
      // silently ignore — user can still fill manually
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: Platform.OS === "ios",
      ...(Platform.OS === "ios" ? { aspect: [1, 1] as [number, number] } : {}),
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSaveAccount = async () => {
    setAccountError("");
    const trimmedName = userName.trim();
    const trimmedAbout = about.trim();

    if (!trimmedName && !selectedCity && !trimmedAbout && !avatarUri) {
      setAccountError("Please update at least one field");
      return;
    }

    setSavingAccount(true);
    try {
      const textPayload: { userName?: string; city?: string; about?: string } = {};
      if (trimmedName) textPayload.userName = trimmedName;
      if (selectedCity) textPayload.city = selectedCity;
      if (trimmedAbout) textPayload.about = trimmedAbout;

      if (Object.keys(textPayload).length > 0) {
        await updateAccountInfo(textPayload);
        if (textPayload.userName) updateUser({ userName: textPayload.userName });
      }

      if (avatarUri) {
        await updateProfile({}, avatarUri);
      }

      setAccountModal(false);
      Alert.alert("Success", t("security.accountInfoUpdated"));
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not update account info";
      setAccountError(msg);
    } finally {
      setSavingAccount(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("security.title")}</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.card}>
          {/* Account Info */}
          <TouchableOpacity style={styles.row} onPress={handleOpenAccountModal}>
            <View style={styles.left}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.text}>{t("security.accountInfo")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Change Phone */}
          <TouchableOpacity style={styles.row} onPress={() => setPhoneModal(true)}>
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
          <TouchableOpacity style={styles.row} onPress={() => setLangModal(true)}>
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

        {/* ═══════════════ ACCOUNT INFO MODAL ═══════════════ */}
        <Modal visible={accountModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.scrollModal}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>{t("security.accountInfoModalTitle")}</Text>

                {loadingProfile && (
                  <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 16 }} />
                )}

                {/* Avatar picker */}
                <TouchableOpacity style={styles.avatarPicker} onPress={handlePickAvatar}>
                  {(avatarUri || existingAvatarUrl) ? (
                    <Image source={{ uri: avatarUri || existingAvatarUrl! }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color="#999" />
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={14} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>{t("security.changePhoto")}</Text>

                {/* Username */}
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  placeholder={t("security.usernamePlaceholder")}
                  style={styles.input}
                  value={userName}
                  onChangeText={(v) => { setUserName(v); setAccountError(""); }}
                  autoCapitalize="none"
                />

                {/* City dropdown */}
                <Text style={styles.inputLabel}>City</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => { setShowCity(!showCity); setCitySearch(""); }}
                >
                  <Text style={[styles.dropdownText, !selectedCity && styles.placeholderText]}>
                    {selectedCity || t("security.cityPlaceholder")}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#888" />
                </TouchableOpacity>

                {showCity && (
                  <View style={styles.listContainer}>
                    <TextInput
                      style={styles.citySearchInput}
                      placeholder="Search city..."
                      placeholderTextColor="#B0B0B0"
                      value={citySearch}
                      onChangeText={setCitySearch}
                      autoCorrect={false}
                    />
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {PAKISTAN_CITIES.filter((c) =>
                        c.toLowerCase().includes(citySearch.toLowerCase())
                      ).map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.option}
                          onPress={() => {
                            setSelectedCity(item);
                            setShowCity(false);
                            setCitySearch("");
                            setAccountError("");
                          }}
                        >
                          <Text style={styles.optionText}>{item}</Text>
                          {selectedCity === item && (
                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* About */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>About</Text>
                <TextInput
                  placeholder={t("security.aboutPlaceholder")}
                  style={[styles.input, styles.textArea]}
                  value={about}
                  onChangeText={(v) => { setAbout(v); setAccountError(""); }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{about.length}/500</Text>

                {!!accountError && (
                  <Text style={styles.errorText}>{accountError}</Text>
                )}

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveAccount}
                  disabled={savingAccount}
                >
                  {savingAccount ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveText}>{t("common.save")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAccountModal(false)}>
                  <Text style={styles.cancel}>{t("common.cancel")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* ═══════════════ PHONE MODAL ═══════════════ */}
        <Modal visible={phoneModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{t("security.phoneModalTitle")}</Text>

              <TextInput
                placeholder={t("security.phonePlaceholder")}
                style={styles.input}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v.replace(/\D/g, "").slice(0, 11));
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

        {/* ═══════════════ LANGUAGE MODAL ═══════════════ */}
        <Modal visible={langModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{t("security.selectLanguage")}</Text>

              <TouchableOpacity
                style={styles.langOption}
                onPress={() => { setLanguage("en"); setLangModal(false); }}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioCircle, language === "en" && styles.radioSelected]}>
                    {language === "en" && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.langText}>English</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.langOption}
                onPress={() => { setLanguage("ur"); setLangModal(false); }}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioCircle, language === "ur" && styles.radioSelected]}>
                    {language === "ur" && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.langText}>Urdu</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLangModal(false)}>
                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: "#B8B8B8",
  },
  backBtn: {
    width: 24,
    marginLeft: -12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
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
  scrollModal: {
    flexGrow: 1,
    justifyContent: "center",
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
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#B8B8B8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: -10,
    marginBottom: 16,
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginBottom: 10,
  },

  /* City dropdown */
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#B8B8B8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  placeholderText: {
    color: "#999",
  },
  listContainer: {
    borderWidth: 1,
    borderColor: "#B8B8B8",
    borderRadius: 12,
    marginBottom: 4,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },
  citySearchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#B8B8B8",
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FAFAFA",
  },
  option: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  /* Save / cancel */
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
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

  /* Avatar picker */
  avatarPicker: {
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 4,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: {
    textAlign: "center",
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: 20,
  },

  /* Language modal */
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
    borderRadius: 8,
  },
});
