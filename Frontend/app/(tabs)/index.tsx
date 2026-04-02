import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "../../constants/theme";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { useState } from "react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HomeScreen() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Full width with bottom rounded corners */}
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={COLORS.white} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerName}>User Name</Text>
              <Text style={styles.headerSub}>Donate Blood | also good for the donor's body</Text>
            </View>
          </View>
        </View>

        {/* Content with padding */}
        <View style={styles.contentInner}>
          {/* Search + Filter */}
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Search Location</Text>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          </View>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowGroup(!showGroup)}
          >
            <Text style={styles.dropdownText}>
              {selectedGroup || "Select group"}
            </Text>
            <Ionicons name="water-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {showGroup && (
            <View style={styles.listContainer}>
              <FlatList
                data={bloodGroups}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroup(false);
                    }}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <Button title="Submit" onPress={() => {}} />

          <View style={styles.bannerContainer}>
            <Image
              source={require("../../assets/projectImages/banner1.png")}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          {/* Activity As */}
          <Text style={styles.sectionTitle}>Activity As</Text>
          
          <View style={styles.activityRow}>
            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/infused_blood.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Blood Donor</Text>
                <Text style={styles.activityCount}>120 Post</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/blood_recepent.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Blood Recepent</Text>
                <Text style={styles.activityCount}>120 Post</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/drop.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Create Post</Text>
                <Text style={styles.activityCount}>It's Easy! 3 Step</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <Image
                source={require("../../assets/projectImages/blood_transfusion.png")}
                style={styles.activityImage}
                resizeMode="contain"
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Blood Given</Text>
                <Text style={styles.activityCount}>It's Easy! 1 Step</Text>
              </View>
            </View>
          </View>

          {/* Donation Requests */}
          <Text style={styles.sectionTitle}>Donation Request</Text>

          <Card
            bloodGroup="A+"
            patientName="Ali Khan"
            city="Karachi"
            hospital="Aga Khan Hospital"
            date="15 Dec 2025"
            address="National Stadium Rd, Karachi"
            isEmergency={true}
          />

          <Card
            bloodGroup="O-"
            patientName="Ahmed Raza"
            city="Lahore"
            hospital="Shaukat Khanum"
            date="20 Dec 2025"
            address="Johar Town, Lahore"
            isEmergency={false}
          />

          <Card
            bloodGroup="B+"
            patientName="Hamza"
            city="Islamabad"
            hospital="Shaukat Khanum"
            date="25 Jan 2025"
            address="Johar Town, Lahore"
            isEmergency={false}
          />

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flexGrow: 1,
  },
  contentInner: {
    padding: SIZES.padding,
  },

  imageContainer: {
    flex: 1.1,              
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  bannerContainer: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 15,
  },

  bannerImage: {
    width: "100%",
    height: "100%",
  },

  listContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },

  dropdown: {
    backgroundColor: "#FFE8E8",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dropdownText: {
    color: "#777",
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },

  // Header - Full width with bottom rounded corners
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: SIZES.padding,
    width: "100%",
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerName: { 
    color: COLORS.white, 
    fontWeight: "bold", 
    fontSize: 16 
  },
  headerSub: { 
    color: "rgba(255,255,255,0.8)", 
    fontSize: 11, 
    marginTop: 3,
    maxWidth: 260,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchPlaceholder: { 
    flex: 1, 
    marginLeft: 8, 
    color: "#aaa", 
    fontSize: 14 
  },
  selectBlood: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectBloodText: { 
    flex: 1, 
    color: "#aaa", 
    fontSize: 14  
  },

  // Banner
  banner: {
    backgroundColor: "#FFF5F5",
    borderRadius: SIZES.radius,
    padding: 16,
    marginTop: 14,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: COLORS.text 
  },
  bannerIllustration: { 
    opacity: 0.7 
  },
  dots: { 
    flexDirection: "row", 
    marginTop: 8 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: "#ddd", 
    marginRight: 4 
  },
  dotActive: { 
    backgroundColor: COLORS.primary, 
    width: 16 
  },

  // Activity
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: COLORS.text, 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  activityRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 10, 
    marginBottom: 18 
  },
  activityCard: {
    flexDirection: "row",  
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 12,
    flex: 1,
    minWidth: "45%",
    ...SHADOW,
  },
  activityImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "bold",
  },
  activityCount: {
    fontSize: 12,
    color: COLORS.black,
  },
});