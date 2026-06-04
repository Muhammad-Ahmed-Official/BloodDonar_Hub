import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES, PAKISTAN_CITIES } from "../../../constants/theme";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { createBloodRequest, checkActiveRequest } from "@/services/bloodRequest.service";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
const URGENCY_LEVELS = [
  { value: "low",      label: "Low",      color: "#4CAF50" },
  { value: "medium",   label: "Medium",   color: "#FF9800" },
  { value: "high",     label: "High",     color: "#F44336" },
  { value: "critical", label: "Critical", color: "#9C27B0" },
] as const;

type UrgencyLevel = "low" | "medium" | "high" | "critical";
type ActivePicker = null | "date" | "start" | "end";

function makeTime(hours: number, minutes: number) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Display format (used in the UI labels — user-friendly)
function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTimeDisplay(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

// API format — ISO date and HH:mm required by the backend
function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>("medium");
  const [showUrgency, setShowUrgency] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCity, setShowCity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  // Form fields state
  const [patientName, setPatientName] = useState("");
  const [amountOfBlood, setAmountOfBlood] = useState("");
  const [age, setAge] = useState("");
  const [neededDate, setNeededDate] = useState<Date>(new Date());
  const [startTimeDate, setStartTimeDate] = useState(() => makeTime(9, 0));
  const [endTimeDate, setEndTimeDate] = useState(() => makeTime(17, 0));
  const [hospitalName, setHospitalName] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactName, setContactName] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    setFormError("");

    if (!patientName.trim()) { setFormError("Patient name is required"); return; }
    if (!selectedGroup)       { setFormError("Blood group is required"); return; }

    const unitsNum = parseInt(amountOfBlood.trim(), 10);
    if (Number.isNaN(unitsNum) || unitsNum < 1) {
      setFormError("Enter a valid number of units (e.g., 2)");
      return;
    }

    const ageNum = age.trim() ? parseInt(age.trim(), 10) : undefined;
    if (age.trim() && (Number.isNaN(ageNum!) || ageNum! < 1)) {
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

    setSubmitting(true);
    try {
      // Duplicate request guard — block if user already has an unexpired active request
      const activeCheck = await checkActiveRequest();
      if (activeCheck.hasActive) {
        const expiry = activeCheck.expiresAt
          ? new Date(activeCheck.expiresAt).toLocaleString()
          : "the scheduled time";
        setFormError(
          `You already have an active donation request${activeCheck.patientName ? ` for ${activeCheck.patientName}` : ""}. ` +
          `You cannot create another until your current request expires (${expiry}).`
        );
        setSubmitting(false);
        return;
      }
      // Build expiresAt using local-time constructor so the device timezone is applied.
      // new Date(y, m, d, h, min) uses LOCAL time → .toISOString() gives correct UTC.
      const localExpiresAt = new Date(
        neededDate.getFullYear(),
        neededDate.getMonth(),
        neededDate.getDate(),
        endTimeDate.getHours(),
        endTimeDate.getMinutes(),
        0, 0
      );

      await createBloodRequest({
        patientName:  patientName.trim(),
        bloodGroup:   selectedGroup,
        requiredUnits: unitsNum,
        location:     location.trim(),
        city:         selectedCity,
        hospitalName: hospitalName.trim(),
        contactInfo:  `${contactPerson.trim()}: ${contactName.trim()}`,
        urgencyLevel,
        donationDate: formatDateISO(neededDate),
        donationWindow: {
          startTime: formatHHMM(startTimeDate),
          endTime:   formatHHMM(endTimeDate),
        },
        expiresAt: localExpiresAt.toISOString(),
        ...(ageNum !== undefined && { age: ageNum }),
        ...(reason.trim() && { reason: reason.trim() }),
      });

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
      ? neededDate
      : activePicker === "start"
        ? startTimeDate
        : activePicker === "end"
          ? endTimeDate
          : new Date();

  const pickerMode = activePicker === "date" ? "date" : "time";

  return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Request</Text>
          <View style={styles.backBtn} />
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

        {/* Urgency Level */}
        <View style={styles.fieldGroup}>
          <Label title="Urgency Level" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowUrgency(!showUrgency)}
          >
            <Text style={styles.dropdownText}>
              {URGENCY_LEVELS.find((u) => u.value === urgencyLevel)?.label ?? "Select urgency"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#888" />
          </TouchableOpacity>
          {showUrgency && (
            <View style={styles.listContainer}>
              {URGENCY_LEVELS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.option}
                  onPress={() => { setUrgencyLevel(item.value); setShowUrgency(false); }}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: item.color }]} />
                  <Text style={styles.optionText}>{item.label}</Text>
                  {urgencyLevel === item.value && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Amount of blood request */}
        <View style={styles.fieldGroup}>
          <Label title="Amount of Blood Request (units)" />
          <Input
            placeholder="Enter number of units (e.g., 2)"
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
            <Text style={styles.dropdownText}>
              {formatDateDisplay(neededDate)}
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
            onPress={() => { setShowCity(!showCity); setCitySearch(""); }}
          >
            <Text style={[styles.dropdownText, !selectedCity && styles.placeholderText]}>
              {selectedCity || "Select city"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#888" />
          </TouchableOpacity>

          {showCity && (
            <View style={[styles.listContainer, { maxHeight: 300 }]}>
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search city..."
                placeholderTextColor="#B0B0B0"
                value={citySearch}
                onChangeText={setCitySearch}
                autoCorrect={false}
              />
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 240 }}>
                {PAKISTAN_CITIES.filter((c) =>
                  c.toLowerCase().includes(citySearch.toLowerCase())
                ).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setSelectedCity(item);
                      setShowCity(false);
                      setCitySearch("");
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
            onChangeText={(text:any) => {
              const onlyText = text.replace(/[^a-zA-Z\s]/g, "");
              setContactPerson(onlyText);
            }}
            keyboardType="default"
          />
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Label title="Mobile Number" />
          <Input 
            placeholder="Enter mobile number" 
            placeholderTextColor="#B0B0B0"
            keyboardType="numeric"
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
                <Text style={styles.timeValue}>{formatTimeDisplay(startTimeDate)}</Text>
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
                <Text style={styles.timeValue}>{formatTimeDisplay(endTimeDate)}</Text>
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

        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: COLORS.white},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: "#B8B8B8",
  },
  backBtn: {
    width: 24,
    marginLeft: -12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  
  content: { 
    padding: SIZES.padding 
  },
  
  fieldGroup: {
    marginBottom: 8,
  },

  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#B8B8B8",
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
    borderColor: "#B8B8B8",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },
  citySearchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#B8B8B8",
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FAFAFA",
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

  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    borderColor: "#B8B8B8",
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