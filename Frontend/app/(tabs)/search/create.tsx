import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { COLORS, SIZES } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

export default function CreateRequestScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [showCity, setShowCity] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form fields state
  const [patientName, setPatientName] = useState("");
  const [amountOfBlood, setAmountOfBlood] = useState("");
  const [age, setAge] = useState("");
  const [date, setDate] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactName, setContactName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

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
        // Fallback cities
        setCities([
          "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
          "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
          "Hyderabad", "Abbottabad", "Bahawalpur", "Sargodha", "Sukkur",
          "Mirpur", "Muzaffarabad", "Gilgit", "Skardu", "Mardan"
        ]);
      }
    } catch (err) {
      console.log(err);
      setCities([
        "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
        "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    console.log({
      patientName,
      selectedGroup,
      amountOfBlood,
      age,
      date,
      hospitalName,
      selectedCity,
      location,
      contactPerson,
      contactName,
      startTime,
      endTime,
      reason,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient Name */}
        <View style={styles.fieldGroup}>
          <Label title="Patient Name" />
          <Input 
            placeholder="Enter patient name" 
            placeholderTextColor="#B0B0B0"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        {/* Select Group */}
        <View style={styles.fieldGroup}>
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
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 250 }}>
                {BLOOD_GROUPS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setSelectedGroup(item);
                      setShowGroup(false);
                    }}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="water" size={16} color={COLORS.primary} />
                    </View>
                    <Text style={styles.optionText}>{item}</Text>
                    {selectedGroup === item && (
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Amount of blood request */}
        <View style={styles.fieldGroup}>
          <Label title="Amount of Blood Request" />
          <Input 
            placeholder="Enter amount (e.g., 2 units)" 
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
            value={amountOfBlood}
            onChangeText={setAmountOfBlood}
          />
        </View>

        {/* Age */}
        <View style={styles.fieldGroup}>
          <Label title="Age" />
          <Input 
            placeholder="Enter patient age" 
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Label title="Date" />
          <Input 
            placeholder="Enter required date (e.g., 15 Dec 2025)" 
            placeholderTextColor="#B0B0B0"
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Hospital Name */}
        <View style={styles.fieldGroup}>
          <Label title="Hospital Name" />
          <Input 
            placeholder="Enter hospital name" 
            placeholderTextColor="#B0B0B0"
            value={hospitalName}
            onChangeText={setHospitalName}
          />
        </View>

        {/* City */}
        <View style={styles.fieldGroup}>
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
            </View>
          )}
        </View>

        {/* Location / Address */}
        <View style={styles.fieldGroup}>
          <Label title="Location / Address" />
          <Input 
            placeholder="Enter complete address" 
            placeholderTextColor="#B0B0B0"
            value={location}
            onChangeText={setLocation}
            multiline
          />
        </View>

        {/* Contact Person */}
        <View style={styles.fieldGroup}>
          <Label title="Contact Person" />
          <Input 
            placeholder="Enter contact person name" 
            placeholderTextColor="#B0B0B0"
            value={contactPerson}
            onChangeText={setContactPerson}
          />
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Label title="Mobile Number" />
          <Input 
            placeholder="Enter mobile number" 
            placeholderTextColor="#B0B0B0"
            keyboardType="phone-pad"
            value={contactName}
            onChangeText={setContactName}
          />
        </View>

        {/* Timing */}
        <View style={styles.fieldGroup}>
          <Label title="Timing" />
          <View style={styles.timingRow}>
            <View style={styles.timingInput}>
              <Input 
                placeholder="Start Time" 
                placeholderTextColor="#B0B0B0"
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <Text style={styles.timingSeparator}>to</Text>
            <View style={styles.timingInput}>
              <Input 
                placeholder="End Time" 
                placeholderTextColor="#B0B0B0"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>
        </View>

        {/* Why do you need blood */}
        <View style={styles.fieldGroup}>
          <Label title="Why do you need blood?" />
          <Input 
            placeholder="Please describe the reason (e.g., surgery, accident, medical condition)" 
            placeholderTextColor="#B0B0B0"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <Button title="Submit Request" onPress={handleSubmit} />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F8F8" 
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
    borderBottomColor: "#f0f0f0",
  },
  
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: COLORS.text 
  },
  
  content: { 
    padding: SIZES.padding 
  },
  
  fieldGroup: {
    marginBottom: 20,
  },
  
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  
  placeholderText: {
    color: "#999",
  },
  
  listContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },
  
  option: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  
  optionIcon: {
    marginRight: 10,
  },
  
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  
  timingInput: {
    flex: 1,
  },
  
  timingSeparator: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
});