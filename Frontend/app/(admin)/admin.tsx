import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import Card from "@/components/common/Card";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { createAdminUser, deleteAdminDonationRequest, getAdminRequests, getAdminStats, getAdminUsers, toggleSuspendAdminUser, updateAdminDonationRequest, updateAdminUser } from "@/services/admin.service";

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
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
  donarName: string;
  bloodGroup: string;
  patientName: string;
  city: string;
  hospital: string;
  date: string;
  address: string;
  isEmergency: boolean;
  amount: string;
  age: string;
  contactPersonName: string;
  mobileNumber: string;
  startTime: string;
  endTime: string;
  reason: string;
}

function donorRequestLooksEmergency(reason?: string) {
  if (!reason) return false;
  return /emergency|urgent|critical/i.test(reason);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOOD_GROUPS = new Set(["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]);

function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(String(s).trim());
}

function trimVal(s: string | undefined): string {
  return String(s ?? "").trim();
}

function isPlaceholderDash(s: string): boolean {
  return trimVal(s) === "" || trimVal(s) === "—" || trimVal(s) === "-";
}

function normalizeBloodGroup(s: string): string {
  return trimVal(s).replace(/\s+/g, "").toUpperCase();
}

function isValidBloodGroup(s: string): boolean {
  return BLOOD_GROUPS.has(normalizeBloodGroup(s));
}

function isValidDobInput(s: string): boolean {
  const t = trimVal(s);
  if (!t) return false;
  const d = new Date(t);
  return !Number.isNaN(d.getTime());
}

function isValidGender(s: string): boolean {
  const g = trimVal(s).toLowerCase();
  return g === "male" || g === "female" || g === "other";
}

function isValidCanDonateBlood(s: string): boolean {
  const v = trimVal(s).toLowerCase();
  return v === "yes" || v === "no";
}

function approximateDobIsoFromAge(years: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setFullYear(d.getFullYear() - Math.min(120, Math.max(1, Math.floor(years))));
  return d.toISOString().slice(0, 10);
}

function validateAgeOrDob(ageStr: string, dobStr: string): { ok: true } | { ok: false; message: string } {
  const dobTrim = trimVal(dobStr);
  if (dobTrim && isValidDobInput(dobTrim)) {
    const d = new Date(dobTrim);
    const now = new Date();
    if (d > now) return { ok: false, message: "Date of birth cannot be in the future" };
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

function AdminActionBtn({ activeKey, thisKey, style, onPress, children }: {
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

function AdminModalSaveBtn({ activeKey, thisKey, onPress, label }: {
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

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalDonorRequests: 0 });

  const [users, setUsers] = useState<User[]>([]);
  const [donorRequests, setDonorRequests] = useState<DonorRequestRow[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [insertModalVisible, setInsertModalVisible] = useState(false);
  const [donorRequestModalVisible, setDonorRequestModalVisible] = useState(false);
  const [selectedDonorRequest, setSelectedDonorRequest] = useState<DonorRequestRow | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    bloodGroup: "",
    city: "",
    country: "",
    gender: "",
    dateOfBirth: "",
    canDonateBlood: "",
    age: "",
    about: "",
  });

  const [donorRequestForm, setDonorRequestForm] = useState({
    donarName: "",
    bloodGroup: "",
    amount: "",
    age: "",
    date: "",
    hospitalName: "",
    location: "",
    contactPersonName: "",
    mobileNumber: "",
    city: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  const loadDashboard = async () => {
    try {
      const [statsRes, usersRes, requestsRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers({ page: 1, limit: 200 }),
        getAdminRequests({ page: 1, limit: 200 }),
      ]);

      const mappedUsers: User[] = (usersRes?.data?.users || []).map((u: any) => {
        const age =
          u.userInfo?.dateOfBirth
            ? String(Math.max(0, new Date().getFullYear() - new Date(u.userInfo.dateOfBirth).getFullYear()))
            : "-";
        return {
          id: u._id,
          name: u.userName || "",
          email: u.email || "",
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

      const mappedDonorRequests: DonorRequestRow[] = (requestsRes?.data?.requests || []).map((r: any) => {
        const u = r.user;
        const donorUserName = typeof u === "object" && u?.userName ? u.userName : "—";
        const donorEmail = typeof u === "object" && u?.email ? u.email : "—";
        const dn = r.donarName ?? "";
        return {
          id: r._id,
          donorUserName,
          donorEmail,
          donarName: dn,
          bloodGroup: r.bloodGroup ?? "—",
          patientName: dn.trim() ? dn : "Patient",
          city: r.city ?? "—",
          hospital: r.hospitalName ?? "—",
          date: r.date ?? "—",
          address: r.location ?? "—",
          isEmergency: donorRequestLooksEmergency(r.reason),
          amount: r.amount != null ? String(r.amount) : "",
          age: r.age != null && r.age !== "" ? String(r.age) : "",
          contactPersonName: r.contactPersonName ?? "",
          mobileNumber: r.mobileNumber ?? "",
          startTime: r.startTime ?? "",
          endTime: r.endTime ?? "",
          reason: r.reason ?? "",
        };
      });

      setUsers(mappedUsers);
      setDonorRequests(mappedDonorRequests);
      setStats({
        totalUsers: statsRes?.data?.totalUsers ?? mappedUsers.length,
        totalDonorRequests: statsRes?.data?.totalRequests ?? mappedDonorRequests.length,
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load admin dashboard");
    }
  };

  useEffect(() => {
    (async () => {
      setPageLoading(true);
      await loadDashboard();
      setPageLoading(false);
    })();
  }, []);

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
    });
    setUpdateModalVisible(true);
  };

  const handleInsertUser = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      mobileNumber: "",
      bloodGroup: "",
      city: "",
      country: "",
      gender: "",
      dateOfBirth: "",
      canDonateBlood: "",
      age: "",
      about: "",
    });
    setInsertModalVisible(true);
  };

  const saveUserUpdate = async () => {
    if (!selectedUser) return;
    if (!trimVal(formData.name)) {
      Alert.alert("Error", "Name is required");
      return;
    }
    if (!isValidEmail(formData.email)) {
      Alert.alert("Error", "Enter a valid email address");
      return;
    }
    if (isPlaceholderDash(formData.bloodGroup) || !isValidBloodGroup(formData.bloodGroup)) {
      Alert.alert("Error", "Enter a valid blood group (e.g. A+, B-, O+)");
      return;
    }
    if (isPlaceholderDash(formData.city)) {
      Alert.alert("Error", "City is required");
      return;
    }
    if (isPlaceholderDash(formData.country)) {
      Alert.alert("Error", "Country is required");
      return;
    }
    if (!isValidGender(formData.gender)) {
      Alert.alert("Error", "Gender must be male, female, or other");
      return;
    }
    const cdb = trimVal(formData.canDonateBlood);
    if (!isValidCanDonateBlood(cdb)) {
      Alert.alert("Error", "Can donate blood must be yes or no");
      return;
    }
    const ageDob = validateAgeOrDob(formData.age, formData.dateOfBirth);
    if (!ageDob.ok) {
      Alert.alert("Error", ageDob.message);
      return;
    }
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
      });
      await loadDashboard();
      setUpdateModalVisible(false);
      Alert.alert("Success", "User updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update user");
    } finally {
      setActionKey(null);
    }
  };

  const saveNewUser = async () => {
    if (!trimVal(formData.name)) {
      Alert.alert("Error", "Name is required");
      return;
    }
    if (!isValidEmail(formData.email)) {
      Alert.alert("Error", "Enter a valid email address");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    const mobile = trimVal(formData.mobileNumber);
    if (mobile.length < 10) {
      Alert.alert("Error", "Enter a valid mobile number (at least 10 digits)");
      return;
    }
    if (!isValidBloodGroup(formData.bloodGroup)) {
      Alert.alert("Error", "Enter a valid blood group (e.g. A+, B-, O+)");
      return;
    }
    if (!trimVal(formData.city)) {
      Alert.alert("Error", "City is required");
      return;
    }
    if (!isValidGender(formData.gender)) {
      Alert.alert("Error", "Gender must be male, female, or other");
      return;
    }
    if (!isValidCanDonateBlood(formData.canDonateBlood)) {
      Alert.alert("Error", "Can donate blood must be yes or no");
      return;
    }
    const ageDobNew = validateAgeOrDob(formData.age, formData.dateOfBirth);
    if (!ageDobNew.ok) {
      Alert.alert("Error", ageDobNew.message);
      return;
    }
    let dateOfBirthForApi = trimVal(formData.dateOfBirth);
    if (!isValidDobInput(dateOfBirthForApi)) {
      const ag = Number(trimVal(formData.age));
      if (Number.isFinite(ag) && ag >= 1 && ag <= 120) {
        dateOfBirthForApi = approximateDobIsoFromAge(ag);
      }
    }
    if (!isValidDobInput(dateOfBirthForApi)) {
      Alert.alert("Error", "Enter a valid date of birth (YYYY-MM-DD) or age");
      return;
    }
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
      Alert.alert("Success", "User added successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create user");
    } finally {
      setActionKey(null);
    }
  };

  const suspendUser = (userId: string) => {
    Alert.alert(
      "Suspend User",
      "Are you sure you want to suspend/unsuspend this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const key = `suspend:${userId}`;
            try {
              setActionKey(key);
              await toggleSuspendAdminUser(userId);
              await loadDashboard();
              Alert.alert("Success", "User status updated successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to update user status");
            } finally {
              setActionKey(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleUpdateDonorRequest = (row: DonorRequestRow) => {
    setSelectedDonorRequest(row);
    setDonorRequestForm({
      donarName: row.donarName,
      bloodGroup: row.bloodGroup === "—" ? "" : row.bloodGroup,
      amount: row.amount,
      age: row.age,
      date: row.date === "—" ? "" : row.date,
      hospitalName: row.hospital === "—" ? "" : row.hospital,
      location: row.address === "—" ? "" : row.address,
      contactPersonName: row.contactPersonName,
      mobileNumber: row.mobileNumber,
      city: row.city === "—" ? "" : row.city,
      startTime: row.startTime,
      endTime: row.endTime,
      reason: row.reason,
    });
    setDonorRequestModalVisible(true);
  };

  const saveDonorRequestUpdate = async () => {
    if (!selectedDonorRequest) return;
    const f = donorRequestForm;
    const ageNum = Number(f.age);
    if (
      !f.donarName?.trim() ||
      !f.bloodGroup?.trim() ||
      !f.amount?.trim() ||
      !Number.isFinite(ageNum) ||
      ageNum <= 0 ||
      ageNum > 120 ||
      !f.date?.trim() ||
      !f.hospitalName?.trim() ||
      !f.location?.trim() ||
      !f.contactPersonName?.trim() ||
      !f.mobileNumber?.trim() ||
      !f.city?.trim() ||
      !f.startTime?.trim() ||
      !f.endTime?.trim() ||
      !f.reason?.trim()
    ) {
      Alert.alert("Error", "Please fill all donation request fields (same as app form).");
      return;
    }
    if (!isValidBloodGroup(f.bloodGroup)) {
      Alert.alert("Error", "Enter a valid blood group (e.g. A+, O-)");
      return;
    }
    if (trimVal(f.mobileNumber).length < 10) {
      Alert.alert("Error", "Enter a valid mobile number (at least 10 digits)");
      return;
    }
    try {
      setActionKey("save-donor-request");
      await updateAdminDonationRequest(selectedDonorRequest.id, {
        donarName: f.donarName.trim(),
        bloodGroup: normalizeBloodGroup(f.bloodGroup),
        amount: f.amount.trim(),
        age: ageNum,
        date: f.date.trim(),
        hospitalName: f.hospitalName.trim(),
        location: f.location.trim(),
        contactPersonName: f.contactPersonName.trim(),
        mobileNumber: f.mobileNumber.trim(),
        city: f.city.trim(),
        startTime: f.startTime.trim(),
        endTime: f.endTime.trim(),
        reason: f.reason.trim(),
      });
      await loadDashboard();
      setDonorRequestModalVisible(false);
      setSelectedDonorRequest(null);
      Alert.alert("Success", "Donation request updated");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update donation request");
    } finally {
      setActionKey(null);
    }
  };

  const deleteDonorRequest = (donarDocId: string) => {
    Alert.alert(
      "Delete donation request",
      "Remove this request from the donor profile? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            const key = `delete-donor:${donarDocId}`;
            try {
              setActionKey(key);
              await deleteAdminDonationRequest(donarDocId);
              await loadDashboard();
              Alert.alert("Success", "Donation request removed");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete donation request");
            } finally {
              setActionKey(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
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
            Alert.alert("Error", "Could not log out. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (pageLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity style={styles.addBtn} onPress={handleInsertUser}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityLabel="Log out"
        >
          {loggingOut ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>

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

      <Text style={styles.sectionTitle}>
        <Ionicons name="people-outline" size={18} /> Users
      </Text>

      {users.map((user) => (
        <View key={user.id} style={[styles.userCard, user.status === "suspended" && styles.suspendedCard]}>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || "U"}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={[styles.statusBadge, user.status === "active" ? styles.activeBadge : styles.suspendedBadge]}>
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
              <Text style={styles.btnText}> {user.status === "active" ? "Suspend" : "Activate"}</Text>
            </AdminActionBtn>

            <TouchableOpacity style={styles.updateBtn} onPress={() => handleUpdateUser(user)}>
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.btnText}> Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>
        <Ionicons name="water-outline" size={18} /> Donor requests
      </Text>
      {/* <Text style={styles.sectionHint}>
        Blood requests users create via the app are stored on the Donar document. Listed below with the donor account.
      </Text> */}

      {donorRequests.length === 0 ? (
        <Text style={styles.emptyDonorRequests}>No donor-created requests yet.</Text>
      ) : (
        donorRequests.map((req) => (
          <View key={req.id} style={styles.userCard}>
            <View style={styles.donorMetaRow}>
              <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.donorMetaText}>
                Donor: {req.donorUserName} · {req.donorEmail}
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
              <TouchableOpacity style={styles.updateBtn} onPress={() => handleUpdateDonorRequest(req)}>
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

      <View style={{ height: 50 }} />

      <Modal visible={updateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Update User</Text>

            <TextInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} />
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Blood Group" value={formData.bloodGroup} onChangeText={(text) => setFormData({...formData, bloodGroup: text})} />
            <TextInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} />
            <TextInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(text) => setFormData({...formData, country: text})} />
            <TextInput style={styles.input} placeholder="Gender" value={formData.gender} onChangeText={(text) => setFormData({...formData, gender: text})} />
            <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={formData.dateOfBirth} onChangeText={(text) => setFormData({...formData, dateOfBirth: text})} />
            <TextInput style={styles.input} placeholder="Can Donate Blood (yes/no)" value={formData.canDonateBlood} onChangeText={(text) => setFormData({...formData, canDonateBlood: text})} />
            <TextInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(text) => setFormData({...formData, age: text})} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(text) => setFormData({...formData, about: text})} multiline />

            <AdminModalSaveBtn activeKey={actionKey} thisKey="save-user-update" onPress={saveUserUpdate} label="Save Changes" />

            <TouchableOpacity onPress={() => setUpdateModalVisible(false)} disabled={actionKey === "save-user-update"}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={insertModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            <TextInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} />
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} keyboardType="email-address" />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Mobile Number (03XXXXXXXXX)" value={formData.mobileNumber} onChangeText={(text) => setFormData({...formData, mobileNumber: text})} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Blood Group" value={formData.bloodGroup} onChangeText={(text) => setFormData({...formData, bloodGroup: text})} />
            <TextInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} />
            <TextInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(text) => setFormData({...formData, country: text})} />
            <TextInput style={styles.input} placeholder="Gender" value={formData.gender} onChangeText={(text) => setFormData({...formData, gender: text})} />
            <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={formData.dateOfBirth} onChangeText={(text) => setFormData({...formData, dateOfBirth: text})} />
            <TextInput style={styles.input} placeholder="Can Donate Blood (yes/no)" value={formData.canDonateBlood} onChangeText={(text) => setFormData({...formData, canDonateBlood: text})} />
            <TextInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(text) => setFormData({...formData, age: text})} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(text) => setFormData({...formData, about: text})} multiline />

            <AdminModalSaveBtn activeKey={actionKey} thisKey="save-user-create" onPress={saveNewUser} label="Add User" />

            <TouchableOpacity onPress={() => setInsertModalVisible(false)} disabled={actionKey === "save-user-create"}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={donorRequestModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Update donor request</Text>

            <TextInput
              style={styles.input}
              placeholder="Patient name"
              value={donorRequestForm.donarName}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, donarName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Blood group"
              value={donorRequestForm.bloodGroup}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, bloodGroup: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (units)"
              value={donorRequestForm.amount}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, amount: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={donorRequestForm.age}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, age: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Date"
              value={donorRequestForm.date}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, date: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Hospital name"
              value={donorRequestForm.hospitalName}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, hospitalName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Location / address"
              value={donorRequestForm.location}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, location: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Contact person name"
              value={donorRequestForm.contactPersonName}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, contactPersonName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile number"
              value={donorRequestForm.mobileNumber}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, mobileNumber: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={donorRequestForm.city}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, city: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Start time"
              value={donorRequestForm.startTime}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, startTime: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="End time"
              value={donorRequestForm.endTime}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, endTime: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Reason"
              value={donorRequestForm.reason}
              onChangeText={(text) => setDonorRequestForm({ ...donorRequestForm, reason: text })}
              multiline
            />

            <AdminModalSaveBtn
              activeKey={actionKey}
              thisKey="save-donor-request"
              onPress={saveDonorRequestUpdate}
              label="Save changes"
            />

            <TouchableOpacity
              onPress={() => {
                setDonorRequestModalVisible(false);
                setSelectedDonorRequest(null);
              }}
              disabled={actionKey === "save-donor-request"}
            >
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: SIZES.padding,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },

  addBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },

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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
    color: COLORS.text,
  },

  sectionHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    marginTop: -6,
    lineHeight: 18,
  },

  emptyDonorRequests: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },

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

  userCard: {
    backgroundColor: "#FFF5F5",
    padding: 16,
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

  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.text,
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

  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

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
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
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

  emergencyToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  toggleLabel: {
    fontSize: 14,
    color: COLORS.text,
  },

  toggleBtn: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },

  toggleActive: {
    backgroundColor: COLORS.primary,
  },

  toggleText: {
    color: "#fff",
    fontWeight: "600",
  },

  logoutBtn: {
    backgroundColor: "#FF3B30",
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});