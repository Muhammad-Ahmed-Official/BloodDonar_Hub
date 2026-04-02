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
  const [cities, setCities] = useState<string[]>([]);

  const [showCity, setShowCity] = useState(false);
  const [showGroup, setShowGroup] = useState(false);

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country: "Pakistan" }),
    })
      .then((res) => res.json())
      .then((data) => setCities(data.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, marginBottom: 10 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>
          Almost done :) For set your profile, fill up the below information
        </Text>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="person-outline" size={28} color="red" />
        </View>

        <Text style={styles.section}>Personal Information</Text>

        {/* Name */}
        <Label title="Your Name" />
        <Input placeholder="User name" />

        {/* Phone */}
        <Label title="Mobile Number" />
        <Input placeholder="User name" keyboardType="phone-pad" />

        {/* Blood Group */}
        <Label title="Select Group" />
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowGroup(!showGroup)}
        >
          <Text style={styles.dropdownText}>
            {selectedGroup || "Select group"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
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
          <Text style={styles.dropdownText}>
            {selectedCity || "Select city"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {showCity && (
          <View style={[styles.listContainer, { maxHeight: 150 }]}>
            <FlatList
              data={cities.slice(0, 20)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setSelectedCity(item);
                    setShowCity(false);
                  }}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Button */}
        <Button
          title="Next"
          onPress={() => router.push("/(auth)/profile-setup/step2")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 5,
    paddingTop: 10
  },
  listContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 15,
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
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
});