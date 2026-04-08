import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const privacyData = [
    {
      id: 1,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim adminim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in"
    },
    {
      id: 2,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim adminim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in"
    },
    {
      id: 3,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim adminim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in"
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("privacy.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View>

          <View style={styles.updateInfo}>
            <AntDesign name="clock-circle" size={18} color={COLORS.primary} />
            <Text style={styles.updateText}>{t("privacy.lastUpdate")} </Text>
            <Text style={styles.updateTextBold}>20 june 2025</Text>
          </View>
          
          <View style={styles.contentWrapper}>
            {privacyData.map((item, index) => (
              <View key={item.id} style={styles.privacyItem}>
                <View style={styles.bulletPoint}>
                  <View style={styles.bulletDot} />
                </View>
                <Text style={styles.privacyText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: SIZES.padding,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFEBEB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },

  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
  },

  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  updateText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#888",
  },

  updateTextBold: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  contentWrapper: {
    padding: 20,
  },

  privacyItem: {
    flexDirection: "row",
    marginBottom: 20,
  },

  bulletPoint: {
    width: 24,
    paddingTop: 4,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#555",
    textAlign: "left",
  },
});