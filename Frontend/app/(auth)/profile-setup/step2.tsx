import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";


export default function ProfileSetup2() {
  const router = useRouter();
  const [selectGender, setSelectGender] = useState("");
  const [isYes, setIsYes] = useState("");
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>
          It’s optional. You can fill it later.
        </Text>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="medkit-outline" size={28} color="red" />
        </View>

        <Text style={styles.section}>Basic Information</Text>

        {/* DOB */}
        <Label title="Date of Birth" />
           <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShow(true)}
            >
              <Text style={styles.dropdownText}>
                {date ? date.toDateString() : "Select date"}
              </Text>
            </TouchableOpacity>

            {show && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") {
                    setShow(false); // close only on Android
                  }

                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
        <Text style={{ marginBottom: 10 }}>
          Your age - {date ? calculateAge(date) : ""}
        </Text>

        {/* Gender Dropdown */}
        <Label title="Gender" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowGender(!showGender)}
        >
          <Text style={styles.dropdownText}>
            {selectGender || "Select gender"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showGender && (
          <View style={styles.listContainer}>
            <FlatList
              data={["Male", "Female"]}
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
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Donate Dropdown */}
        <Label title="I Want to donate blood" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDonate(!showDonate)}
        >
          <Text style={styles.dropdownText}>
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
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* About */}
        <Label title="About yourself" />
        <Input placeholder="Type about yourself" multiline numberOfLines={4} />

        {/* Button */}
        <Button title="Next" onPress={() => router.replace("/(tabs)")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.white,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 5,
    paddingTop: 10
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 20,
  },
  iconContainer: {
    alignSelf: "center",
    backgroundColor: "#ffe6e6",
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
  },
  section: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 15,
  },
  dropdown: {
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
  listContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
});