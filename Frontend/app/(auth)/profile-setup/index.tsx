import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { createProfile } from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileSetup1() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [showCity, setShowCity] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [selectGender, setSelectGender] = useState("");
  const [isYes, setIsYes] = useState("");
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showGender, setShowGender] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // fields not covered by dropdowns
  const [mobileNumber, setMobileNumber] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };


  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoadingCities(true);
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
      setLoadingCities(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
      let granted = existing.granted;

      if (!granted) {
        const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
        granted = requested.granted;

        if (!granted) {
          const message =
            "Photo access is needed to set your profile picture. You can enable it in Settings.";
          setError(message);
          Alert.alert("Photos permission", message, [
            { text: "Cancel", style: "cancel" },
            ...(requested.canAskAgain === false
              ? [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
              : []),
          ]);
          return;
        }
      }

      // Android: allowsEditing + crop UI often returns canceled or fails on many devices / gallery apps.
      // iOS: square crop is fine with allowsEditing.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: Platform.OS === "ios",
        ...(Platform.OS === "ios" ? { aspect: [1, 1] as [number, number] } : {}),
        quality: 0.85,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setAvatarUri(uri);
        setError("");
      } else {
        Alert.alert("Could not load photo", "Please try another image.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong opening the gallery.";
      console.warn("ImagePicker:", e);
      Alert.alert("Image picker", msg);
      setError(msg);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!mobileNumber.trim()) { setError("Mobile number is required"); return; }
    if (!/^03\d{9}$/.test(mobileNumber.trim())) { setError("Mobile number must be in format 03XXXXXXXXX"); return; }
    if (!selectedGroup)       { setError("Blood group is required"); return; }
    if (!selectedCity)        { setError("City is required"); return; }
    if (!selectGender)        { setError("Gender is required"); return; }
    if (!isYes)               { setError("Please specify if you want to donate blood"); return; }

    setLoading(true);
    try {
      await createProfile({
        mobileNumber: mobileNumber.trim(),
        bloodGroup: selectedGroup,
        city: selectedCity,
        dateOfBirth: date.toISOString(),
        gender: selectGender.toLowerCase() as "male" | "female" | "other",
        canDonateBlood: isYes.toLowerCase() as "yes" | "no",
        about: about.trim(),
      }, avatarUri ?? undefined);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err?.message || "Profile setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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

        {/* Avatar Picker */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={handlePickImage}
          activeOpacity={0.85}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={32} color={COLORS.primary} />
          )}
          <View style={styles.cameraBadge} pointerEvents="none">
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <Text style={styles.section}>Personal Information</Text>

        {/* Name — display only, taken from signup */}
        <Label title="Your Name" />
        <Input placeholder="Enter your full name" value={user?.userName ?? ""} editable={false} />

        {/* Phone */}
        <Label title="Mobile Number" />
        <Input
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          value={mobileNumber}
          maxLength={11}
          onChangeText={(t: string) => {
            const cleaned = t.replace(/\D/g, "").slice(0, 11);
            setMobileNumber(cleaned);
            setError("");
          }}
        />

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
            {loadingCities ? (
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

      <Label title="Date of Birth" />
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.dropdownText, !date && styles.placeholderText]}>
          {date ? date.toDateString() : "Select date"}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#888" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            if (Platform.OS === "android") {
              setShow(false);
            }
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}


        <View style={styles.ageContainer}>
          <Text style={styles.ageText}>
            Your age: <Text style={styles.ageValue}>{date ? calculateAge(date) : ""} years</Text>
          </Text>
        </View>

        {/* Gender Dropdown */}
        <Label title="Gender" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowGender(!showGender)}
        >
          <Text style={[styles.dropdownText, !selectGender && styles.placeholderText]}>
            {selectGender || "Select gender"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showGender && (
          <View style={styles.listContainer}>
            <FlatList
              data={["Male", "Female", "Other"]}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setSelectGender(item);
                    setShowGender(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {selectGender === item && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        

        {/* Donate Dropdown */}
        <Label title="I want to donate blood" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDonate(!showDonate)}
        >
          <Text style={[styles.dropdownText, !isYes && styles.placeholderText]}>
            {isYes || "Select option"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showDonate && (
          <View style={styles.listContainer}>
            <FlatList
              data={["Yes", "No"]}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setIsYes(item);
                    setShowDonate(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {isYes === item && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        

        {/* About */}
        <Label title="About yourself" />
        <Input
          placeholder="Tell us something about yourself"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={about}
          onChangeText={(t: string) => setAbout(t)}
        />

        {!!error && (
          <Text style={{ color: "#E53935", fontSize: 13, marginBottom: 8 }}>{error}</Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Saving..." : "Complete Setup"}
            onPress={handleSubmit}
            disabled={loading}
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flexGrow: 1,
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
    ageContainer: {
    marginBottom: 16,
    marginTop: -8,
  },
  ageText: {
    fontSize: 14,
    color: "#666",
  },
  ageValue: {
    fontWeight: "600",
    color: COLORS.primary,
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
    width: 86,
    height: 86,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 43,
    marginBottom: 20,
    marginTop: 10,
    position: "relative",
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
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