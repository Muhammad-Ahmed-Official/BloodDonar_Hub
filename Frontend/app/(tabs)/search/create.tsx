import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { COLORS, SIZES } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { donarRequest, getAllUserPushTokens } from "@/services/user.service";
import { sendBloodRequestToAll } from "@/services/notifications";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

type ActivePicker = null | "date" | "start" | "end";

function makeTime(hours: number, minutes: number) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDateForApi(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeForApi(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [showCity, setShowCity] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  // Form fields state
  const [patientName, setPatientName] = useState("");
  const [amountOfBlood, setAmountOfBlood] = useState("");
  const [age, setAge] = useState("");
  const [neededDate, setNeededDate] = useState<Date | null>(null);
  const [startTimeDate, setStartTimeDate] = useState(() => makeTime(9, 0));
  const [endTimeDate, setEndTimeDate] = useState(() => makeTime(17, 0));
  const [hospitalName, setHospitalName] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactName, setContactName] = useState("");
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

  const handleSubmit = async () => {
    setFormError("");
    if (!patientName.trim()) {
      setFormError("Patient name is required");
      return;
    }
    if (!selectedGroup) {
      setFormError("Blood group is required");
      return;
    }
    if (!amountOfBlood.trim() || !age.trim() || !neededDate) {
      setFormError("Amount, age, and date are required");
      return;
    }
    const ageNum = parseInt(age.trim(), 10);
    if (Number.isNaN(ageNum) || ageNum < 1) {
      setFormError("Enter a valid age");
      return;
    }
    if (!hospitalName.trim() || !selectedCity || !location.trim()) {
      setFormError("Hospital, city, and location are required");
      return;
    }
    if (!contactPerson.trim() || !contactName.trim()) {
      setFormError("Contact person and mobile number are required");
      return;
    }
    if (!reason.trim()) {
      setFormError("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const newRequest = await donarRequest({
        donarName: patientName.trim(),
        bloodGroup: selectedGroup,
        amount: amountOfBlood.trim(),
        age: ageNum,
        date: formatDateForApi(neededDate),
        hospitalName: hospitalName.trim(),
        location: location.trim(),
        contactPersonName: contactPerson.trim(),
        mobileNumber: contactName.trim(),
        city: selectedCity,
        startTime: formatTimeForApi(startTimeDate),
        endTime: formatTimeForApi(endTimeDate),
        reason: reason.trim(),
      });

      // Notify all registered users about the new blood request
      const requestId: string = newRequest?._id ?? newRequest?.id ?? "";
      const tokens: string[] = await getAllUserPushTokens().catch(() => []);
      if (tokens.length && requestId) {
        sendBloodRequestToAll(tokens, requestId).catch(console.error);
      }

      router.back();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not submit request";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      setActivePicker(null);
      return;
    }
    if (!selected) return;

    if (activePicker === "date") setNeededDate(selected);
    else if (activePicker === "start") setStartTimeDate(selected);
    else if (activePicker === "end") setEndTimeDate(selected);

    if (Platform.OS === "android") {
      setActivePicker(null);
    }
  };

  const pickerValue =
    activePicker === "date"
      ? neededDate ?? new Date()
      : activePicker === "start"
        ? startTimeDate
        : activePicker === "end"
          ? endTimeDate
          : new Date();

  const pickerMode = activePicker === "date" ? "date" : "time";

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

        {/* Date needed */}
        <View style={styles.fieldGroup}>
          <Label title="Date blood is needed" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setActivePicker(activePicker === "date" ? null : "date")}
          >
            <Text style={[styles.dropdownText, !neededDate && styles.placeholderText]}>
              {neededDate ? formatDateForApi(neededDate) : "Select date"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#888" />
          </TouchableOpacity>
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

        {/* Timing — native time pickers */}
        <View style={styles.fieldGroup}>
          <Label title="Timing" />
          <View style={styles.timingRow}>
            <TouchableOpacity
              style={styles.timeBox}
              onPress={() => setActivePicker(activePicker === "start" ? null : "start")}
            >
              <View style={styles.timeBoxText}>
                <Text style={styles.timeLabel}>Start</Text>
                <Text style={styles.timeValue}>{formatTimeForApi(startTimeDate)}</Text>
              </View>
              <Ionicons name="time-outline" size={18} color="#888" />
            </TouchableOpacity>
            <Text style={styles.timingSeparator}>to</Text>
            <TouchableOpacity
              style={styles.timeBox}
              onPress={() => setActivePicker(activePicker === "end" ? null : "end")}
            >
              <View style={styles.timeBoxText}>
                <Text style={styles.timeLabel}>End</Text>
                <Text style={styles.timeValue}>{formatTimeForApi(endTimeDate)}</Text>
              </View>
              <Ionicons name="time-outline" size={18} color="#888" />
            </TouchableOpacity>
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

        {!!formError && (
          <Text style={{ color: "#E53935", fontSize: 13, marginBottom: 8 }}>{formError}</Text>
        )}

        {activePicker && (
          <View style={styles.pickerWrap}>
            {Platform.OS === "ios" && (
              <TouchableOpacity style={styles.pickerDone} onPress={() => setActivePicker(null)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            <DateTimePicker
              value={pickerValue}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onPickerChange}
            />
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          {submitting ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Button title="Submit Request" onPress={handleSubmit} />
          )}
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
  timeBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timeBoxText: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  timingSeparator: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  pickerWrap: {
    marginBottom: 8,
    alignItems: "stretch",
  },
  pickerDone: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickerDoneText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});