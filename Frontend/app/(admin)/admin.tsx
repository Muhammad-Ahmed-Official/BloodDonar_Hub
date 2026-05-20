import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import Card from "@/components/common/Card";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminUser,
  deleteAdminDonationRequest,
  getAdminRequests,
  getAdminStats,
  getAdminUsers,
  toggleSuspendAdminUser,
  updateAdminDonationRequest,
  updateAdminUser,
} from "@/services/admin.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  bloodGroup: string;
  city: string;
  country: string;
  gender: string;
  age: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  canDonateBlood?: string;
  about: string;
  status: "active" | "suspended";
}

interface DonorRequestRow {
  id: string;
  donorUserName: string;
  donorEmail: string;
  patientName: string;
  bloodGroup: string;
  city: string;
  hospital: string;
  date: string;
  address: string;
  isEmergency: boolean;
  amount: string;
  age: string;
  contactInfo: string;
  startTime: string;
  endTime: string;
  reason: string;
  urgencyLevel: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOOD_GROUPS = new Set(["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]);

function isValidEmail(s: string) { return EMAIL_RE.test(String(s).trim()); }
function trimVal(s: string | undefined) { return String(s ?? "").trim(); }
function isPlaceholderDash(s: string) { const t = trimVal(s); return t === "" || t === "—" || t === "-"; }
function normalizeBloodGroup(s: string) { return trimVal(s).replace(/\s+/g, "").toUpperCase(); }
function isValidBloodGroup(s: string) { return BLOOD_GROUPS.has(normalizeBloodGroup(s)); }
function isValidDobInput(s: string) { const t = trimVal(s); if (!t) return false; return !Number.isNaN(new Date(t).getTime()); }
function isValidGender(s: string) { const g = trimVal(s).toLowerCase(); return g === "male" || g === "female" || g === "other"; }
function isValidCanDonateBlood(s: string) { const v = trimVal(s).toLowerCase(); return v === "yes" || v === "no"; }
function approximateDobIsoFromAge(years: number) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setFullYear(d.getFullYear() - Math.min(120, Math.max(1, Math.floor(years))));
  return d.toISOString().slice(0, 10);
}
function validateAgeOrDob(ageStr: string, dobStr: string): { ok: true } | { ok: false; message: string } {
  const dobTrim = trimVal(dobStr);
  if (dobTrim && isValidDobInput(dobTrim)) {
    const d = new Date(dobTrim);
    if (d > new Date()) return { ok: false, message: "Date of birth cannot be in the future" };
    return { ok: true };
  }
  const ageTrim = trimVal(ageStr);
  if (ageTrim && ageTrim !== "-") {
    const n = Number(ageTrim);
    if (Number.isFinite(n) && n >= 1 && n <= 120) return { ok: true };
    return { ok: false, message: "Enter a valid age (1–120) or a valid date of birth" };
  }
  return { ok: false, message: "Enter date of birth (YYYY-MM-DD) or age" };
}

// ─── Platform helpers ─────────────────────────────────────────────────────────

function adminNotify(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message ?? "");
  }
}

type AdminConfirmButton = {
  text?: string;
  style?: "cancel" | "default" | "destructive";
  onPress?: () => void | Promise<void>;
};

function adminConfirm(title: string, message: string, buttons: AdminConfirmButton[]) {
  if (Platform.OS === "web") {
    if (!window.confirm(`${title}\n\n${message}`)) return;
    const confirmBtn = [...buttons].reverse().find((b) => b.style !== "cancel");
    void Promise.resolve(confirmBtn?.onPress?.());
    return;
  }
  Alert.alert(title, message, buttons as Parameters<typeof Alert.alert>[2]);
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function AdminActionBtn({
  activeKey, thisKey, style, onPress, children,
}: {
  activeKey: string | null;
  thisKey: string;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const loading = activeKey === thisKey;
  return (
    <TouchableOpacity style={style} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : children}
    </TouchableOpacity>
  );
}

function AdminModalSaveBtn({
  activeKey, thisKey, onPress, label,
}: {
  activeKey: string | null;
  thisKey: string;
  onPress: () => void;
  label: string;
}) {
  const loading = activeKey === thisKey;
  return (
    <TouchableOpacity style={styles.saveBtn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function AdminInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor="#9CA3AF" {...props} />;
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchWrapper}>
      <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  // ── UI state ──
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<"users" | "posts">("users");
  const [pageLoading, setPageLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  // ── Search state ──
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");

  // ── Data ──
  const [stats, setStats] = useState({ totalUsers: 0, totalDonorRequests: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [donorRequests, setDonorRequests] = useState<DonorRequestRow[]>([]);

  // ── Modals ──
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [insertModalVisible, setInsertModalVisible] = useState(false);
  const [donorRequestModalVisible, setDonorRequestModalVisible] = useState(false);
  const [selectedDonorRequest, setSelectedDonorRequest] = useState<DonorRequestRow | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Forms ──
  const emptyUserForm = {
    name: "", email: "", password: "", mobileNumber: "",
    bloodGroup: "", city: "", country: "", gender: "",
    dateOfBirth: "", canDonateBlood: "", age: "", about: "",
    role: "user" as "user" | "admin",
  };
  const [formData, setFormData] = useState(emptyUserForm);

  const emptyDonorForm = {
    patientName: "", bloodGroup: "", amount: "", age: "", date: "",
    hospitalName: "", location: "", contactInfo: "", city: "",
    startTime: "", endTime: "", reason: "", urgencyLevel: "",
  };
  const [donorRequestForm, setDonorRequestForm] = useState(emptyDonorForm);

  // ── Filtered lists ──
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.bloodGroup.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    if (!q) return donorRequests;
    return donorRequests.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.donorUserName.toLowerCase().includes(q) ||
        r.donorEmail.toLowerCase().includes(q) ||
        r.bloodGroup.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.hospital.toLowerCase().includes(q) ||
        r.urgencyLevel.toLowerCase().includes(q)
    );
  }, [donorRequests, postSearch]);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadDashboard = async () => {
    const [statsRes, usersRes, requestsRes] = await Promise.allSettled([
      getAdminStats(),
      getAdminUsers({ page: 1, limit: 200 }),
      getAdminRequests({ page: 1, limit: 200 }),
    ]);

    if (usersRes.status === "fulfilled") {
      const mappedUsers: User[] = (usersRes.value?.data?.users || []).map((u: any) => {
        const age = u.userInfo?.dateOfBirth
          ? String(Math.max(0, new Date().getFullYear() - new Date(u.userInfo.dateOfBirth).getFullYear()))
          : "-";
        return {
          id: u._id,
          name: u.userName || "",
          email: u.email || "",
          role: (u.role === "admin" ? "admin" : "user") as "user" | "admin",
          mobileNumber: u.userInfo?.mobileNumber || "",
          bloodGroup: u.userInfo?.bloodGroup || "-",
          city: u.userInfo?.city || "-",
          country: u.userInfo?.country || "-",
          gender: u.userInfo?.gender || "-",
          dateOfBirth: u.userInfo?.dateOfBirth || "",
          canDonateBlood: u.userInfo?.canDonateBlood || "",
          age,
          about: u.userInfo?.about || "-",
          status: u.suspended ? "suspended" : "active",
        };
      });
      setUsers(mappedUsers);
    } else {
      console.error("[Admin] Failed to load users:", usersRes.reason);
    }

    if (requestsRes.status === "fulfilled") {
      const raw: any[] = requestsRes.value?.data?.requests || [];
      const mappedDonorRequests: DonorRequestRow[] = raw.map((r: any) => {
        const u = r.createdBy;
        return {
          id: r._id,
          donorUserName: typeof u === "object" && u?.userName ? u.userName : "—",
          donorEmail: typeof u === "object" && u?.email ? u.email : "—",
          patientName: r.patientName ?? "Patient",
          bloodGroup: r.bloodGroup ?? "—",
          city: r.city ?? "—",
          hospital: r.hospitalName ?? "—",
          date: r.donationDate ? new Date(r.donationDate).toLocaleDateString() : "—",
          address: r.location ?? "—",
          isEmergency: r.urgencyLevel === "critical" || r.urgencyLevel === "high",
          amount: r.requiredUnits != null ? String(r.requiredUnits) : "",
          age: r.age != null && r.age !== "" ? String(r.age) : "",
          contactInfo: r.contactInfo ?? "",
          startTime: r.donationWindow?.startTime ?? "",
          endTime: r.donationWindow?.endTime ?? "",
          reason: r.reason ?? "",
          urgencyLevel: r.urgencyLevel ?? "low",
        };
      });
      setDonorRequests(mappedDonorRequests);
    } else {
      console.error("[Admin] Failed to load blood requests:", requestsRes.reason);
      adminNotify("Error", requestsRes.reason?.message || "Failed to load blood requests");
    }

    if (statsRes.status === "fulfilled") {
      setStats({
        totalUsers: statsRes.value?.data?.totalUsers ?? 0,
        totalDonorRequests: statsRes.value?.data?.totalRequests ?? 0,
      });
    }
  };

  useEffect(() => {
    (async () => {
      setPageLoading(true);
      await loadDashboard();
      setPageLoading(false);
    })();
  }, []);

  // ─── User actions ─────────────────────────────────────────────────────────

  const handleUpdateUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      mobileNumber: user.mobileNumber || "",
      bloodGroup: user.bloodGroup,
      city: user.city,
      country: user.country,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
      canDonateBlood: user.canDonateBlood || "",
      age: user.age,
      about: user.about,
      role: user.role,
    });
    setUpdateModalVisible(true);
  };

  const handleInsertUser = () => {
    setFormData(emptyUserForm);
    setInsertModalVisible(true);
  };

  const saveUserUpdate = async () => {
    if (!selectedUser) return;
    if (!trimVal(formData.name)) { adminNotify("Error", "Name is required"); return; }
    if (!isValidEmail(formData.email)) { adminNotify("Error", "Enter a valid email address"); return; }
    if (isPlaceholderDash(formData.bloodGroup) || !isValidBloodGroup(formData.bloodGroup)) { adminNotify("Error", "Enter a valid blood group (e.g. A+, B-, O+)"); return; }
    if (isPlaceholderDash(formData.city)) { adminNotify("Error", "City is required"); return; }
    if (isPlaceholderDash(formData.country)) { adminNotify("Error", "Country is required"); return; }
    if (!isValidGender(formData.gender)) { adminNotify("Error", "Gender must be male, female, or other"); return; }
    const cdb = trimVal(formData.canDonateBlood);
    if (!isValidCanDonateBlood(cdb)) { adminNotify("Error", "Can donate blood must be yes or no"); return; }
    const ageDob = validateAgeOrDob(formData.age, formData.dateOfBirth);
    if (!ageDob.ok) { adminNotify("Error", ageDob.message); return; }
    try {
      setActionKey("save-user-update");
      await updateAdminUser(selectedUser.id, {
        userName: trimVal(formData.name),
        email: trimVal(formData.email),
        bloodGroup: normalizeBloodGroup(formData.bloodGroup),
        city: trimVal(formData.city),
        country: trimVal(formData.country),
        gender: trimVal(formData.gender).toLowerCase(),
        dateOfBirth: trimVal(formData.dateOfBirth) || undefined,
        canDonateBlood: cdb as "yes" | "no",
        age: trimVal(formData.age),
        about: trimVal(formData.about) || undefined,
        role: formData.role,
      });
      await loadDashboard();
      setUpdateModalVisible(false);
      adminNotify("Success", "User updated successfully");
    } catch (error: any) {
      adminNotify("Error", error?.message || "Failed to update user");
    } finally {
      setActionKey(null);
    }
  };

  const saveNewUser = async () => {
    if (!trimVal(formData.name)) { adminNotify("Error", "Name is required"); return; }
    if (!isValidEmail(formData.email)) { adminNotify("Error", "Enter a valid email address"); return; }
    if (!formData.password || formData.password.length < 6) { adminNotify("Error", "Password must be at least 6 characters"); return; }
    const mobile = trimVal(formData.mobileNumber);
    if (mobile.length < 10) { adminNotify("Error", "Enter a valid mobile number (at least 10 digits)"); return; }
    if (!isValidBloodGroup(formData.bloodGroup)) { adminNotify("Error", "Enter a valid blood group (e.g. A+, B-, O+)"); return; }
    if (!trimVal(formData.city)) { adminNotify("Error", "City is required"); return; }
    if (!isValidGender(formData.gender)) { adminNotify("Error", "Gender must be male, female, or other"); return; }
    if (!isValidCanDonateBlood(formData.canDonateBlood)) { adminNotify("Error", "Can donate blood must be yes or no"); return; }
    const ageDobNew = validateAgeOrDob(formData.age, formData.dateOfBirth);
    if (!ageDobNew.ok) { adminNotify("Error", ageDobNew.message); return; }
    let dateOfBirthForApi = trimVal(formData.dateOfBirth);
    if (!isValidDobInput(dateOfBirthForApi)) {
      const ag = Number(trimVal(formData.age));
      if (Number.isFinite(ag) && ag >= 1 && ag <= 120) dateOfBirthForApi = approximateDobIsoFromAge(ag);
    }
    if (!isValidDobInput(dateOfBirthForApi)) { adminNotify("Error", "Enter a valid date of birth (YYYY-MM-DD) or age"); return; }
    try {
      setActionKey("save-user-create");
      await createAdminUser({
        userName: trimVal(formData.name),
        email: trimVal(formData.email),
        password: formData.password,
        mobileNumber: mobile,
        bloodGroup: normalizeBloodGroup(formData.bloodGroup),
        city: trimVal(formData.city),
        dateOfBirth: dateOfBirthForApi,
        gender: trimVal(formData.gender).toLowerCase() as "male" | "female" | "other",
        canDonateBlood: trimVal(formData.canDonateBlood).toLowerCase() as "yes" | "no",
        country: trimVal(formData.country) || "Pakistan",
        about: trimVal(formData.about),
        role: "user",
      });
      await loadDashboard();
      setInsertModalVisible(false);
      adminNotify("Success", "User added successfully");
    } catch (error: any) {
      adminNotify("Error", error?.message || "Failed to create user");
    } finally {
      setActionKey(null);
    }
  };

  const suspendUser = (userId: string) => {
    adminConfirm("Suspend User", "Are you sure you want to suspend/unsuspend this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          const key = `suspend:${userId}`;
          try {
            setActionKey(key);
            await toggleSuspendAdminUser(userId);
            await loadDashboard();
            adminNotify("Success", "User status updated successfully");
          } catch (error: any) {
            adminNotify("Error", error?.message || "Failed to update user status");
          } finally {
            setActionKey(null);
          }
        },
      },
    ]);
  };

  // ─── Donor request actions ────────────────────────────────────────────────

  const handleUpdateDonorRequest = (row: DonorRequestRow) => {
    setSelectedDonorRequest(row);
    setDonorRequestForm({
      patientName: row.patientName,
      bloodGroup: row.bloodGroup === "—" ? "" : row.bloodGroup,
      amount: row.amount,
      age: row.age,
      date: row.date === "—" ? "" : row.date,
      hospitalName: row.hospital === "—" ? "" : row.hospital,
      location: row.address === "—" ? "" : row.address,
      contactInfo: row.contactInfo,
      city: row.city === "—" ? "" : row.city,
      startTime: row.startTime,
      endTime: row.endTime,
      reason: row.reason,
      urgencyLevel: row.urgencyLevel,
    });
    setDonorRequestModalVisible(true);
  };

  const saveDonorRequestUpdate = async () => {
    if (!selectedDonorRequest) return;
    const f = donorRequestForm;
    const ageNum = Number(f.age);
    const amountNum = Number(f.amount);
    if (
      !f.patientName?.trim() || !f.bloodGroup?.trim() ||
      !Number.isFinite(amountNum) || amountNum <= 0 ||
      !Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120 ||
      !f.date?.trim() || !f.hospitalName?.trim() || !f.location?.trim() ||
      !f.contactInfo?.trim() || !f.city?.trim() || !f.startTime?.trim() ||
      !f.endTime?.trim() || !f.reason?.trim()
    ) {
      adminNotify("Error", "Please fill all donation request fields.");
      return;
    }
    if (!isValidBloodGroup(f.bloodGroup)) { adminNotify("Error", "Enter a valid blood group (e.g. A+, O-)"); return; }
    try {
      setActionKey("save-donor-request");
      await updateAdminDonationRequest(selectedDonorRequest.id, {
        patientName: f.patientName.trim(),
        bloodGroup: normalizeBloodGroup(f.bloodGroup),
        requiredUnits: amountNum,
        age: ageNum,
        donationDate: f.date.trim(),
        hospitalName: f.hospitalName.trim(),
        location: f.location.trim(),
        contactInfo: f.contactInfo.trim(),
        city: f.city.trim(),
        startTime: f.startTime.trim(),
        endTime: f.endTime.trim(),
        reason: f.reason.trim(),
        urgencyLevel: f.urgencyLevel.trim() || "low",
      });
      await loadDashboard();
      setDonorRequestModalVisible(false);
      setSelectedDonorRequest(null);
      adminNotify("Success", "Blood request updated");
    } catch (error: any) {
      adminNotify("Error", error?.message || "Failed to update blood request");
    } finally {
      setActionKey(null);
    }
  };

  const deleteDonorRequest = (donarDocId: string) => {
    adminConfirm("Delete donation request", "Remove this request from the donor profile? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const key = `delete-donor:${donarDocId}`;
          try {
            setActionKey(key);
            await deleteAdminDonationRequest(donarDocId);
            await loadDashboard();
            adminNotify("Success", "Donation request removed");
          } catch (error: any) {
            adminNotify("Error", error?.message || "Failed to delete donation request");
          } finally {
            setActionKey(null);
          }
        },
      },
    ]);
  };

  // ─── Logout ───────────────────────────────────────────────────────────────

  const handleLogout = () => {
    adminConfirm("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch {
            adminNotify("Error", "Could not log out. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  // ─── Loading screen ───────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 64 + insets.bottom + 10 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Ionicons name="people" size={24} color={COLORS.primary} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalDonorRequests}</Text>
            <Text style={styles.statLabel}>Donor Requests</Text>
            <Ionicons name="water" size={24} color={COLORS.primary} style={styles.statIcon} />
          </View>
        </View>

        {/* ── USERS SECTION ── */}
        {activeSection === "users" && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="people-outline" size={18} /> Users
            </Text>

            {/* User Search */}
            <SearchBar
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search by name, email, blood group, city…"
            />

            {filteredUsers.length === 0 && (
              <Text style={styles.emptyText}>
                {userSearch ? `No users matching "${userSearch}"` : "No users found."}
              </Text>
            )}

            {filteredUsers.map((user) => (
              <View
                key={user.id}
                style={[styles.userCard, user.status === "suspended" && styles.suspendedCard]}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.avatarText}>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.nameBadgeRow}>
                      <Text style={styles.name}>{user.name}</Text>
                      <Text
                        style={[
                          styles.roleBadge,
                          user.role === "admin" ? styles.adminRoleBadge : styles.userRoleBadge,
                        ]}
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.statusBadge,
                        user.status === "active" ? styles.activeBadge : styles.suspendedBadge,
                      ]}
                    >
                      {user.status === "active" ? "Active" : "Suspended"}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={14} color="#666" />
                    <Text style={styles.info}>{user.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="water" size={14} color="#666" />
                    <Text style={styles.info}>Blood Group: {user.bloodGroup}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.info}>{user.city}, {user.country}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color="#666" />
                    <Text style={styles.info}>{user.gender}, {user.age} years</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="information-circle-outline" size={14} color="#666" />
                    <Text style={styles.info}>{user.about}</Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <AdminActionBtn
                    activeKey={actionKey}
                    thisKey={`suspend:${user.id}`}
                    style={styles.suspendBtn}
                    onPress={() => suspendUser(user.id)}
                  >
                    <Ionicons name="ban-outline" size={14} color="#fff" />
                    <Text style={styles.btnText}>
                      {" "}{user.status === "active" ? "Suspend" : "Activate"}
                    </Text>
                  </AdminActionBtn>

                  <TouchableOpacity
                    style={styles.updateBtn}
                    onPress={() => handleUpdateUser(user)}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.btnText}> Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── POSTS SECTION ── */}
        {activeSection === "posts" && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="water-outline" size={18} /> Donor Requests
            </Text>

            {/* Post Search */}
            <SearchBar
              value={postSearch}
              onChangeText={setPostSearch}
              placeholder="Search by patient, donor, blood group, city…"
            />

            {filteredPosts.length === 0 ? (
              <Text style={styles.emptyText}>
                {postSearch
                  ? `No requests matching "${postSearch}"`
                  : "No donor-created requests yet."}
              </Text>
            ) : (
              filteredPosts.map((req) => (
                <View key={req.id} style={styles.userCard}>
                  {/* Donor meta row with emergency badge at right end */}
                  <View style={styles.donorMetaRow}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.donorMetaText} numberOfLines={1}>
                      {req.donorUserName} · {req.donorEmail}
                    </Text>
                  </View>

                  <Card
                    isShow={false}
                    bloodGroup={req.bloodGroup}
                    patientName={req.patientName}
                    city={req.city}
                    hospital={req.hospital}
                    date={req.date}
                    address={req.address}
                    isEmergency={req.isEmergency}
                    donationRequestId={req.id}
                  />

                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => handleUpdateDonorRequest(req)}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.btnText}> Update</Text>
                    </TouchableOpacity>
                    <AdminActionBtn
                      activeKey={actionKey}
                      thisKey={`delete-donor:${req.id}`}
                      style={styles.deleteBtn}
                      onPress={() => deleteDonorRequest(req.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.btnText}> Delete</Text>
                    </AdminActionBtn>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── UPDATE USER MODAL ── */}
        <Modal visible={updateModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Update User</Text>

              <AdminInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
              <AdminInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} keyboardType="email-address" />
              <AdminInput style={styles.input} placeholder="Blood Group" value={formData.bloodGroup} onChangeText={(t) => setFormData({ ...formData, bloodGroup: t })} />
              <AdminInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(t) => setFormData({ ...formData, city: t })} />
              <AdminInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(t) => setFormData({ ...formData, country: t })} />
              <AdminInput style={styles.input} placeholder="Gender (male / female / other)" value={formData.gender} onChangeText={(t) => setFormData({ ...formData, gender: t })} />
              <AdminInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={formData.dateOfBirth} onChangeText={(t) => setFormData({ ...formData, dateOfBirth: t })} />
              <AdminInput style={styles.input} placeholder="Can Donate Blood (yes / no)" value={formData.canDonateBlood} onChangeText={(t) => setFormData({ ...formData, canDonateBlood: t })} />
              <AdminInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(t) => setFormData({ ...formData, age: t })} keyboardType="numeric" />
              <AdminInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(t) => setFormData({ ...formData, about: t })} multiline />

              <View style={styles.roleRow}>
                <Text style={styles.roleLabel}>Role</Text>
                <View style={styles.roleToggleRow}>
                  <TouchableOpacity
                    style={[styles.roleToggleBtn, formData.role === "user" && styles.roleToggleBtnActive]}
                    onPress={() => setFormData({ ...formData, role: "user" })}
                  >
                    <Text style={[styles.roleToggleBtnText, formData.role === "user" && styles.roleToggleBtnTextActive]}>User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleToggleBtn, formData.role === "admin" && styles.roleToggleBtnActive]}
                    onPress={() => setFormData({ ...formData, role: "admin" })}
                  >
                    <Text style={[styles.roleToggleBtnText, formData.role === "admin" && styles.roleToggleBtnTextActive]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <AdminModalSaveBtn activeKey={actionKey} thisKey="save-user-update" onPress={saveUserUpdate} label="Save Changes" />
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)} disabled={actionKey === "save-user-update"}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* ── INSERT USER MODAL ── */}
        <Modal visible={insertModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New User</Text>

              <AdminInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
              <AdminInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} keyboardType="email-address" />

              <View style={styles.passwordContainer}>
                <AdminInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(t) => setFormData({ ...formData, password: t })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <AdminInput style={styles.input} placeholder="Mobile Number (03XXXXXXXXX)" value={formData.mobileNumber} onChangeText={(t) => setFormData({ ...formData, mobileNumber: t })} keyboardType="phone-pad" />
              <AdminInput style={styles.input} placeholder="Blood Group" value={formData.bloodGroup} onChangeText={(t) => setFormData({ ...formData, bloodGroup: t })} />
              <AdminInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(t) => setFormData({ ...formData, city: t })} />
              <AdminInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(t) => setFormData({ ...formData, country: t })} />
              <AdminInput style={styles.input} placeholder="Gender (male / female / other)" value={formData.gender} onChangeText={(t) => setFormData({ ...formData, gender: t })} />
              <AdminInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={formData.dateOfBirth} onChangeText={(t) => setFormData({ ...formData, dateOfBirth: t })} />
              <AdminInput style={styles.input} placeholder="Can Donate Blood (yes / no)" value={formData.canDonateBlood} onChangeText={(t) => setFormData({ ...formData, canDonateBlood: t })} />
              <AdminInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(t) => setFormData({ ...formData, age: t })} keyboardType="numeric" />
              <AdminInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(t) => setFormData({ ...formData, about: t })} multiline />

              <AdminModalSaveBtn activeKey={actionKey} thisKey="save-user-create" onPress={saveNewUser} label="Add User" />
              <TouchableOpacity onPress={() => setInsertModalVisible(false)} disabled={actionKey === "save-user-create"}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* ── UPDATE DONOR REQUEST MODAL ── */}
        <Modal visible={donorRequestModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Blood Request</Text>

              <AdminInput style={styles.input} placeholder="Patient name" value={donorRequestForm.patientName} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, patientName: t })} />
              <AdminInput style={styles.input} placeholder="Blood group" value={donorRequestForm.bloodGroup} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, bloodGroup: t })} />
              <AdminInput style={styles.input} placeholder="Required units" value={donorRequestForm.amount} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, amount: t })} keyboardType="numeric" />
              <AdminInput style={styles.input} placeholder="Patient age" value={donorRequestForm.age} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, age: t })} keyboardType="numeric" />
              <AdminInput style={styles.input} placeholder="Donation date (YYYY-MM-DD)" value={donorRequestForm.date} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, date: t })} />
              <AdminInput style={styles.input} placeholder="Hospital name" value={donorRequestForm.hospitalName} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, hospitalName: t })} />
              <AdminInput style={styles.input} placeholder="Location / address" value={donorRequestForm.location} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, location: t })} multiline />
              <AdminInput style={styles.input} placeholder="Contact info" value={donorRequestForm.contactInfo} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, contactInfo: t })} />
              <AdminInput style={styles.input} placeholder="City" value={donorRequestForm.city} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, city: t })} />
              <AdminInput style={styles.input} placeholder="Start time" value={donorRequestForm.startTime} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, startTime: t })} />
              <AdminInput style={styles.input} placeholder="End time" value={donorRequestForm.endTime} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, endTime: t })} />
              <AdminInput style={styles.input} placeholder="Urgency level (low / medium / high / critical)" value={donorRequestForm.urgencyLevel} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, urgencyLevel: t })} />
              <AdminInput style={styles.input} placeholder="Reason" value={donorRequestForm.reason} onChangeText={(t) => setDonorRequestForm({ ...donorRequestForm, reason: t })} multiline />

              <AdminModalSaveBtn activeKey={actionKey} thisKey="save-donor-request" onPress={saveDonorRequestUpdate} label="Save changes" />
              <TouchableOpacity
                onPress={() => { setDonorRequestModalVisible(false); setSelectedDonorRequest(null); }}
                disabled={actionKey === "save-donor-request"}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>

      {/* ── BOTTOM TAB BAR ── */}
      <View style={[styles.adminTabBar, { height: 64 + insets.bottom, paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity style={styles.adminTabItem} onPress={() => setActiveSection("users")}>
          <View style={[styles.adminTabIcon, activeSection === "users" && styles.adminTabIconActive]}>
            <Ionicons name="people" size={22} color="#fff" />
          </View>
          <Text style={styles.adminTabLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminTabItem} onPress={() => setActiveSection("posts")}>
          <View style={[styles.adminTabIcon, activeSection === "posts" && styles.adminTabIconActive]}>
            <Ionicons name="water" size={22} color="#fff" />
          </View>
          <Text style={styles.adminTabLabel}>Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminTabItem} onPress={handleInsertUser}>
          <View style={styles.adminTabIcon}>
            <Ionicons name="person-add" size={22} color="#fff" />
          </View>
          <Text style={styles.adminTabLabel}>Add User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminTabItem} onPress={handleLogout} disabled={loggingOut}>
          <View style={styles.adminTabIcon}>
            {loggingOut ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            )}
          </View>
          <Text style={styles.adminTabLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 100,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    ...SHADOW,
    position: "relative",
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  statIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
    opacity: 0.3,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 8,
    color: COLORS.text,
  },

  // ── Search bar ──
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },

  // ── Empty state ──
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },

  // ── User card ──
  userCard: {
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOW,
  },

  suspendedCard: {
    backgroundColor: "#F0F0F0",
    opacity: 0.7,
  },

  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  userInfo: {
    flex: 1,
  },

  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.text,
  },

  roleBadge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  adminRoleBadge: {
    backgroundColor: "#FF3B3020",
    color: "#CC2900",
  },

  userRoleBadge: {
    backgroundColor: "#88888820",
    color: "#555",
  },

  statusBadge: {
    fontSize: 11,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  activeBadge: {
    backgroundColor: "#34C75920",
    color: "#34C759",
  },

  suspendedBadge: {
    backgroundColor: "#FF3B3020",
    color: "#FF3B30",
  },

  userDetails: {
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  info: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
  },

  btnRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },

  // ── Buttons ──
  suspendBtn: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  updateBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  deleteBtn: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Donor request card ──
  donorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  donorMetaText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "600",
  },

  // ── Emergency badge (right end of donor meta row) ──
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },

  emergencyBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

  // ── Role toggle ──
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },

  roleLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    minWidth: 40,
  },

  roleToggleRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },

  roleToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#B8B8B8",
    alignItems: "center",
  },

  roleToggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  roleToggleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  roleToggleBtnTextActive: {
    color: "#fff",
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "80%",
  },

  modalContent: {
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.text,
  },

  input: {
    borderWidth: 1,
    borderColor: "#B8B8B8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B8B8B8",
    borderRadius: 10,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },

  eyeIcon: {
    padding: 12,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  cancel: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 8,
  },

  // ── Bottom tab bar ──
  adminTabBar: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  adminTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },

  adminTabIcon: {
    minWidth: 52,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  adminTabIconActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
  },

  adminTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    marginTop: 2,
  },
});