import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileSetup1() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [showCity, setShowCity] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: "Pakistan" }),
      });
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const sortedCities = data.data.sort();
        setCities(sortedCities);
      } else {
        setCities([
          "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
          "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
          "Hyderabad", "Abbottabad", "Bahawalpur", "Sargodha", "Sukkur",
        ]);
      }
    } catch (err) {
      console.log(err);
      setCities([
        "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
        "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>
          Almost done :) For set your profile, fill up the below information
        </Text>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="person-outline" size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.section}>Personal Information</Text>

        {/* Name */}
        <Label title="Your Name" />
        <Input placeholder="Enter your full name" />

        {/* Phone */}
        <Label title="Mobile Number" />
        <Input placeholder="Enter mobile number" keyboardType="phone-pad" />

        {/* Blood Group */}
        <Label title="Select Group" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowGroup(!showGroup)}
        >
          <Text style={[styles.dropdownText, !selectedGroup && styles.placeholderText]}>
            {selectedGroup || "Select blood group"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showGroup && (
          <View style={styles.listContainer}>
            {bloodGroups.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.option}
                onPress={() => {
                  setSelectedGroup(item);
                  setShowGroup(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
                {selectedGroup === item && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Country */}
        <Label title="Country" />
        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>Pakistan</Text>
        </View>

        {/* City */}
        <Label title="City" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowCity(!showCity)}
        >
          <Text style={[styles.dropdownText, !selectedCity && styles.placeholderText]}>
            {selectedCity || "Select city"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showCity && (
          <View style={[styles.listContainer, { maxHeight: 250 }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading cities...</Text>
              </View>
            ) : (
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 250 }}>
                {cities.map((item, index) => (
                  <TouchableOpacity
                    key={`${item}-${index}`}
                    style={styles.option}
                    onPress={() => {
                      setSelectedCity(item);
                      setShowCity(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                    {selectedCity === item && (
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            onPress={() => router.push("/(auth)/profile-setup/step2")}
          />
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
    lineHeight: 20,
  },
  iconContainer: {
    alignSelf: "center",
    backgroundColor: "#FFE5E5",
    padding: 18,
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 10,
  },
  section: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.text,
  },
  listContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  dropdownText: {
    color: COLORS.text,
    fontSize: 14,
  },
  placeholderText: {
    color: "#999",
  },
  option: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
});