import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import Card from "@/components/common/Card";
import { router } from "expo-router";

interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  bloodGroup: string;
  city: string;
  country: string;
  gender: string;
  age: string;
  about: string;
  status: "active" | "suspended";
}

interface Post {
  id: number;
  bloodGroup: string;
  patientName: string;
  city: string;
  hospital: string;
  date: string;
  address: string;
  isEmergency: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Ali Khan",
      email: "ali@gmail.com",
      bloodGroup: "A+",
      city: "Karachi",
      country: "Pakistan",
      gender: "Male",
      age: "25",
      about: "Regular blood donor",
      status: "active",
    },
    {
      id: 2,
      name: "Sara Ahmed",
      email: "sara@gmail.com",
      bloodGroup: "B+",
      city: "Lahore",
      country: "Pakistan",
      gender: "Female",
      age: "28",
      about: "First time donor",
      status: "active",
    },
  ]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      bloodGroup: "A+",
      patientName: "Ali Khan",
      city: "Karachi",
      hospital: "Aga Khan Hospital",
      date: "15 Dec 2025",
      address: "National Stadium Rd, Karachi",
      isEmergency: true,
    },
    {
      id: 2,
      bloodGroup: "O-",
      patientName: "Fatima Zahra",
      city: "Islamabad",
      hospital: "Shifa International",
      date: "20 Dec 2025",
      address: "Sector H-8, Islamabad",
      isEmergency: false,
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [insertModalVisible, setInsertModalVisible] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states for user update/insert
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bloodGroup: "",
    city: "",
    country: "",
    gender: "",
    age: "",
    about: "",
  });

  // Form states for post
  const [postFormData, setPostFormData] = useState({
    bloodGroup: "",
    patientName: "",
    city: "",
    hospital: "",
    date: "",
    address: "",
    isEmergency: false,
  });

  const handleUpdateUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      bloodGroup: user.bloodGroup,
      city: user.city,
      country: user.country,
      gender: user.gender,
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
      bloodGroup: "",
      city: "",
      country: "",
      gender: "",
      age: "",
      about: "",
    });
    setInsertModalVisible(true);
  };

  const handleUpdatePost = (post: Post) => {
    setSelectedPost(post);
    setPostFormData({
      bloodGroup: post.bloodGroup,
      patientName: post.patientName,
      city: post.city,
      hospital: post.hospital,
      date: post.date,
      address: post.address,
      isEmergency: post.isEmergency,
    });
    setPostModalVisible(true);
  };

  const saveUserUpdate = () => {
    if (selectedUser) {
      const updatedUsers = users.map((user) =>
        user.id === selectedUser.id ? { ...user, ...formData } : user
      );
      setUsers(updatedUsers);
      setUpdateModalVisible(false);
      Alert.alert("Success", "User updated successfully");
    }
  };

  const saveNewUser = () => {
    if (!formData.password) {
      Alert.alert("Error", "Please enter password");
      return;
    }
    const newUser: User = {
      id: users.length + 1,
      ...formData,
      status: "active",
    };
    setUsers([...users, newUser]);
    setInsertModalVisible(false);
    Alert.alert("Success", "User added successfully");
    setFormData({
      name: "",
      email: "",
      password: "",
      bloodGroup: "",
      city: "",
      country: "",
      gender: "",
      age: "",
      about: "",
    });
  };

  const suspendUser = (userId: number) => {
    Alert.alert(
      "Suspend User",
      "Are you sure you want to suspend this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          onPress: () => {
            const updatedUsers = users.map((user) =>
              user.id === userId ? { ...user, status: "suspended" } : user
            );
            setUsers(updatedUsers);
            Alert.alert("Success", "User suspended successfully");
          },
          style: "destructive",
        },
      ]
    );
  };

  const deletePost = (postId: number) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedPosts = posts.filter((post) => post.id !== postId);
            setPosts(updatedPosts);
            Alert.alert("Success", "Post deleted successfully");
          },
          style: "destructive",
        },
      ]
    );
  };

  const savePostUpdate = () => {
    if (selectedPost) {
      const updatedPosts = posts.map((post) =>
        post.id === selectedPost.id ? { ...post, ...postFormData } : post
      );
      setPosts(updatedPosts);
      setPostModalVisible(false);
      Alert.alert("Success", "Post updated successfully");
    }
  };

  const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {router.push("/(auth)/login")},
      },
    ]
  );
};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity style={styles.addBtn} onPress={handleInsertUser}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Ionicons name="people" size={24} color={COLORS.primary} style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>Total Posts</Text>
          <Ionicons name="document-text" size={24} color={COLORS.primary} style={styles.statIcon} />
        </View>
      </View>

      {/* USERS SECTION */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="people-outline" size={18} /> Users
      </Text>

      {users.map((user) => (
        <View key={user.id} style={[styles.userCard, user.status === "suspended" && styles.suspendedCard]}>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
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

          {/* ACTIONS */}
          <View style={styles.btnRow}>
            {user.status === "active" && (
              <TouchableOpacity style={styles.suspendBtn} onPress={() => suspendUser(user.id)}>
                <Ionicons name="ban-outline" size={14} color="#fff" />
                <Text style={styles.btnText}> Suspend</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.updateBtn} onPress={() => handleUpdateUser(user)}>
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.btnText}> Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* POSTS SECTION */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="document-text-outline" size={18} /> Posts
      </Text>

      {posts.map((post) => (
        <View key={post.id} style={styles.postCardWrapper}>
          <View style={styles.postHeader}>
          </View>
          
          <Card
            isShow={false}
            bloodGroup={post.bloodGroup}
            patientName={post.patientName}
            city={post.city}
            hospital={post.hospital}
            date={post.date}
            address={post.address}
            isEmergency={post.isEmergency}
          />

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.updateBtn} onPress={() => handleUpdatePost(post)}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.btnText}> Update</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePost(post.id)}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.btnText}> Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 50 }} />

      {/* UPDATE USER MODAL */}
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
            <TextInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(text) => setFormData({...formData, age: text})} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(text) => setFormData({...formData, about: text})} multiline />
            
            <TouchableOpacity style={styles.saveBtn} onPress={saveUserUpdate}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* INSERT USER MODAL WITH PASSWORD */}
      <Modal visible={insertModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>
            
            <TextInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} />
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} keyboardType="email-address" />
            
            {/* Password Field */}
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
            
            <TextInput style={styles.input} placeholder="Blood Group" value={formData.bloodGroup} onChangeText={(text) => setFormData({...formData, bloodGroup: text})} />
            <TextInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} />
            <TextInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(text) => setFormData({...formData, country: text})} />
            <TextInput style={styles.input} placeholder="Gender" value={formData.gender} onChangeText={(text) => setFormData({...formData, gender: text})} />
            <TextInput style={styles.input} placeholder="Age" value={formData.age} onChangeText={(text) => setFormData({...formData, age: text})} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="About" value={formData.about} onChangeText={(text) => setFormData({...formData, about: text})} multiline />
            
            <TouchableOpacity style={styles.saveBtn} onPress={saveNewUser}>
              <Text style={styles.saveText}>Add User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setInsertModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* UPDATE POST MODAL */}
      <Modal visible={postModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Post</Text>
            
            <TextInput style={styles.input} placeholder="Blood Group" value={postFormData.bloodGroup} onChangeText={(text) => setPostFormData({...postFormData, bloodGroup: text})} />
            <TextInput style={styles.input} placeholder="Patient Name" value={postFormData.patientName} onChangeText={(text) => setPostFormData({...postFormData, patientName: text})} />
            <TextInput style={styles.input} placeholder="City" value={postFormData.city} onChangeText={(text) => setPostFormData({...postFormData, city: text})} />
            <TextInput style={styles.input} placeholder="Hospital" value={postFormData.hospital} onChangeText={(text) => setPostFormData({...postFormData, hospital: text})} />
            <TextInput style={styles.input} placeholder="Date" value={postFormData.date} onChangeText={(text) => setPostFormData({...postFormData, date: text})} />
            <TextInput style={styles.input} placeholder="Address" value={postFormData.address} onChangeText={(text) => setPostFormData({...postFormData, address: text})} multiline />
            
            <View style={styles.emergencyToggle}>
              <Text style={styles.toggleLabel}>Emergency Request</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, postFormData.isEmergency && styles.toggleActive]} 
                onPress={() => setPostFormData({...postFormData, isEmergency: !postFormData.isEmergency})}
              >
                <Text style={styles.toggleText}>{postFormData.isEmergency ? "Yes" : "No"}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={savePostUpdate}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setPostModalVisible(false)}>
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

  /* STATS */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
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

  /* SECTION */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
    color: COLORS.text,
  },

  /* USER CARD */
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

  /* BUTTONS */
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

  /* POSTS */
  postCardWrapper: {
    marginBottom: 15,
  },

  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  postType: {
    flexDirection: "row",
  },

  postDate: {
    fontSize: 11,
    color: "#666",
  },

  emergencyBadge: {
    flexDirection: "row",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
  },

  emergencyText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },

  normalBadge: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
  },

  normalText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },

  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

  /* MODAL */
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