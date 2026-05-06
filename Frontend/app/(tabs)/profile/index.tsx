import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SIZES, SHADOW } from "../../../constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";
import { saveExpoPushTokenToBackend, clearExpoPushToken, getLocalPushToken } from "@/services/notifications";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const MENU_ITEMS = [
    { id: "create", label: t("profile.menuCreateRequestBlood"), icon: "water" as const },
    { id: "security", label: t("security.title"), icon: "shield-checkmark-outline" as const },
    { id: "medical", label: t("profile.menuMedicalInfo"), icon: "medkit-outline" as const },
    { id: "activity", label: t("profile.menuActivity"), icon: "pulse-outline" as const },
    { id: "privacy", label: t("profile.menuPrivacyPolicy"), icon: "lock-closed-outline" as const },
    { id: "compatibility", label: t("profile.menuCompatibility"), icon: "heart-outline" as const },
    { id: "logout", label: t("common.logout"), icon: "log-out-outline" as const, danger: true },
  ];

  const [isAvailable, setIsAvailable] = useState(true);
  const [isNotif, setIsNotif] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    bloodGroup?: string;
    canDonateBlood?: string;
    city?: string;
  } | null>(null);
  const [inProgressDonationCount, setInProgressDonationCount] = useState(0);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const [res, notifPref] = await Promise.all([
          getProfile(),
          AsyncStorage.getItem("notifications_enabled"),
        ]);
        const d = res?.data;
        if (cancelled) return;
        setUserInfo(d?.userInfo ?? null);
        const rawList = d?.donationRequests;
        const list = Array.isArray(rawList) ? rawList : [];
        const cnt = list.filter(
          (r: { status?: string; donarName?: string }) =>
            r?.status === "in_progress" && r?.donarName && String(r.donarName).trim()
        ).length;
        setInProgressDonationCount(cnt);
        setProfilePic(d?.userInfo?.pic || null);
        setIsAvailable(d?.userInfo?.canDonateBlood === "yes");
        setIsNotif(notifPref !== "false");
      } catch {
        if (!cancelled) {
          setUserInfo(null);
          setInProgressDonationCount(0);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onAvailChange = async (val: boolean) => {
    setIsAvailable(val);
    setSavingAvail(true);
    try {
      await updateProfile({ canDonateBlood: val ? "yes" : "no" });
      setUserInfo((prev) => (prev ? { ...prev, canDonateBlood: val ? "yes" : "no" } : prev));
    } catch {
      setIsAvailable(!val);
    } finally {
      setSavingAvail(false);
    }
  };

  const onNotifChange = async (val: boolean) => {
    setIsNotif(val);
    setSavingNotif(true);
    try {
      await AsyncStorage.setItem("notifications_enabled", String(val));
      if (val) {
        const token = await getLocalPushToken();
        if (token) await saveExpoPushTokenToBackend(token, user?._id ?? "");
      } else {
        await clearExpoPushToken();
      }
    } catch {
      setIsNotif(!val);
      await AsyncStorage.setItem("notifications_enabled", String(!val)).catch(() => {});
    } finally {
      setSavingNotif(false);
    }
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMenuPress = (itemId: string) => {
    if (itemId === "logout") {
      handleLogout();
    } else if (itemId === "create") {
      router.push("/search/create");
    } else if (itemId === "security") {
      router.push("/profile/security");
    } else if (itemId === "medical") {
      router.push("/profile/medicalInfo");
    } else if (itemId === "activity") {
      router.push("/activity");
    } else if (itemId === "privacy") {
      router.push("/profile/privacy");
    } else if (itemId === "compatibility") {
      router.push("/profile/compatibility");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {profileLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.profileAvatar}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileAvatarImg} />
              ) : (
                <Ionicons name="person" size={28} color={COLORS.white} />
              )}
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.profileName}>{t("profile.hello")} {user?.userName ?? t("common.user")}</Text>
              {!!userInfo?.bloodGroup && (
                <Text style={styles.profileMeta}>{t("profile.blood")}: {userInfo.bloodGroup}</Text>
              )}
            </View>
          </View>
          <Switch
            value={isNotif}
            onValueChange={onNotifChange}
            disabled={savingNotif || profileLoading}
            trackColor={{ true: '#f38e8e', false: "#E0E0E0" }}
            thumbColor={COLORS.white}
            ios_backgroundColor="#E0E0E0"
          />
        </View>

        <View style={styles.statsRow}>
           <View style={styles.statCard}>
            <Text style={styles.statNumber}>{String(inProgressDonationCount)}</Text>
            <Text style={styles.statLabel}>{t("profile.completed")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{String(inProgressDonationCount)}</Text>
            <Text style={styles.statLabel}>{t("profile.requested")}</Text>
          </View>
        </View>

        <View style={styles.menuList}>
            <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>
            {t("profile.availableToggle")}
          </Text>

          <Switch
            value={isAvailable}
            onValueChange={onAvailChange}
            disabled={savingAvail || profileLoading}
            trackColor={{ true: COLORS.primary, false: "#E0E0E0" }}
            thumbColor={COLORS.white}
          />
        </View>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={[styles.menuLabel, item.danger && styles.menuDanger]}>
                {item.label}
              </Text>
              {!item.danger && (
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("common.logout")}</Text>
              <Text style={styles.modalMessage}>
                {t("profile.logoutConfirm")}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.logoutButton]}
                  onPress={confirmLogout}
                  disabled={loggingOut}
                >
                  {loggingOut
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.logoutButtonText}>{t("common.logout")}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 23,
    paddingBottom: 23,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#B8B8B8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  content: {
    padding: SIZES.padding,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 16,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    ...SHADOW,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileMeta: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
  },
  profileName: {
    color: COLORS.white,
    fontWeight: "semibold",
    fontSize: 16,
  },
  profileSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 10,
    alignItems: "center",
    ...SHADOW,
  },
  statNumber: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "bold",
  },
  statLabel: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
    opacity: 0.9,
  },


  menuList: {
    backgroundColor: COLORS.white,
    overflow: "hidden", // important → cuts last border cleanly
  },

menuItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E5E5",
},

  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },
  menuDanger: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 10,
    overflow: "hidden",
    ...SHADOW,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontWeight: "semibold",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});