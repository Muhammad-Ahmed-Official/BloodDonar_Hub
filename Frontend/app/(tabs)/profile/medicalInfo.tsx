import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { medicalInfo as submitMedicalInfo } from "@/services/user.service";

const QUESTIONS = [
  { id: "q1", text: "Do you have diabetes?" },
  { id: "q2", text: "Have you ever had problems with your heart or lungs?" },
  { id: "q3", text: "In the last 28 days do you have you had COVID-19?" },
  { id: "q4", text: "Have you ever had cancer?" },
  {
    id: "q5",
    text: "Have you ever had a positive test for the HIV / AIDS virus?",
  },
  {
    id: "q6",
    text: "In the last 3 months have you had a vaccination?",
  },
];

type Answers = Record<string, "yes" | "no" | null>;

export default function BecomeDonor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [answers, setAnswers] = useState<Answers>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null]))
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (id: string, val: "yes" | "no") => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const allAnswered = Object.values(answers).every((v) => v !== null) && agreedToTerms;

  // Extra bottom padding: tab bar (~60px) + safe area inset + breathing room
  const bottomPadding = insets.bottom + 80;

  const handleNext = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      await submitMedicalInfo({
        diabetes: answers.q1!,
        headOrLungsProblem: answers.q2!,
        recentCovid: answers.q3!,
        cancerHistory: answers.q4!,
        hivAidsTest: answers.q5!,
        recentVaccination: answers.q6!,
      });
      router.push("/(tabs)/search/create");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not save medical info";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Info</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Questions</Text>
        <Text style={styles.pageSubtitle}>
          Fill up the following questionnaire and become a donor
        </Text>

        {/* QUESTIONS */}
        {QUESTIONS.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>{q.text}</Text>
            <View style={styles.radioRow}>
              <RadioOption
                label="Yes"
                selected={answers[q.id] === "yes"}
                onPress={() => setAnswer(q.id, "yes")}
              />
              <RadioOption
                label="No"
                selected={answers[q.id] === "no"}
                onPress={() => setAnswer(q.id, "no")}
              />
            </View>
          </View>
        ))}

        {/* TERMS — toggleable checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreedToTerms((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && (
              <Ionicons name="checkmark" size={13} color="#fff" />
            )}
          </View>
          <Text style={styles.termsText}>
            By clicking, you agree to our{" "}
            <Text style={styles.termsLink}>terms and condition</Text>
          </Text>
        </TouchableOpacity>

        {/* CTA BUTTON */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.ctaBtn, (!allAnswered || submitting) && styles.ctaBtnDisabled]}
          disabled={!allAnswered || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaBtnText}>Become a donor</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.radioOption}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#1A1A1A",
  },

  scrollContent: {
    padding: SIZES.padding,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 18,
  },

  /* QUESTION CARD */
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOW,
  },
  questionText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 10,
    lineHeight: 18,
  },
  radioRow: {
    flexDirection: "row",
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 13,
    color: "#555",
  },
  radioLabelSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  /* TERMS — custom toggleable checkbox */
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    fontSize: 12,
    color: "#888",
    flex: 1,
    flexWrap: "wrap",
  },
  termsLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },

  /* CTA */
  ctaBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});