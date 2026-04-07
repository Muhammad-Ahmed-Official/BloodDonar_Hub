import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useRouter } from "expo-router";

export default function ProfileDetails() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* RED HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
      </View>

      {/* PROFILE SECTION */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {/* Replace with <Image source={...} style={styles.avatar} /> */}
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={42} color="#ccc" />
          </View>
        </View>

        <Text style={styles.name}>Adin Ahmed</Text>
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodText}>A+ Blood</Text>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/inbox")} style={styles.chatBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
            <Text style={styles.chatBtnText}>Chat Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={16} color="#fff" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ABOUT CARD */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>ABOUT</Text>

        <AboutRow icon="person-outline" label="Age" value="30" />
        <AboutRow icon="male-outline" label="Gender" value="Male" />
        <AboutRow icon="location-outline" label="City" value="Karachi" />
        <AboutRow icon="call-outline" label="Mobile" value="+92 3343921210" />
        <AboutRow icon="mail-outline" label="Email" value="adin@gmail.com" isLast />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function AboutRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.aboutRow, !isLast && styles.aboutRowBorder]}>
      <View style={styles.aboutLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.aboutLabel}>{label}</Text>
      </View>
      <Text style={styles.aboutValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: SIZES.padding,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 10,
  },

  /* PROFILE SECTION */
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
    // ...SHADOW,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  bloodBadge: {
    backgroundColor: "#FDEAEA",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 18,
  },
  bloodText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  /* BUTTONS */
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  chatBtnText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  callBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* ABOUT CARD */
  aboutCard: {
    backgroundColor: "#fff",
    marginHorizontal: SIZES.padding,
    borderRadius: 14,
    padding: 16,
    ...SHADOW,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 12,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
  },
  aboutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  aboutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutLabel: {
    fontSize: 13,
    color: "#555",
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});