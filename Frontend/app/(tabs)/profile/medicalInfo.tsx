import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOW } from "@/constants/theme";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  medicalInfo as submitMedicalInfo,
  getMedicalInfo,
} from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";

const QUESTIONS = [
  { id: "q1", key: "diabetes",            text: "Do you have diabetes?" },
  { id: "q2", key: "headOrLungsProblem",  text: "Have you ever had problems with your heart or lungs?" },
  { id: "q3", key: "recentCovid",         text: "In the last 28 days do you have you had COVID-19?" },
  { id: "q4", key: "cancerHistory",       text: "Have you ever had cancer?" },
  { id: "q5", key: "hivAidsTest",         text: "Have you ever had a positive test for the HIV / AIDS virus?" },
  { id: "q6", key: "recentVaccination",   text: "In the last 3 months have you had a vaccination?" },
];

type Answers = Record<string, "yes" | "no" | null>;

export default function BecomeDonor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [answers, setAnswers] = useState<Answers>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null]))
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await getMedicalInfo();
        const existing = res?.data;
        if (existing?.diabetes) {
          setAnswers({
            q1: existing.diabetes           ?? null,
            q2: existing.headOrLungsProblem ?? null,
            q3: existing.recentCovid        ?? null,
            q4: existing.cancerHistory      ?? null,
            q5: existing.hivAidsTest        ?? null,
            q6: existing.recentVaccination  ?? null,
          });
          setAgreedToTerms(true);
          setHasExistingData(true);
        }
      } catch {
        // no existing record — blank form
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, []);

  const setAnswer = (id: string, val: "yes" | "no") =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  const allAnswered =
    Object.values(answers).every((v) => v !== null) && agreedToTerms;

  const bottomPadding = insets.bottom + 80;

  const handleNext = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      await submitMedicalInfo({
        diabetes:           answers.q1!,
        headOrLungsProblem: answers.q2!,
        recentCovid:        answers.q3!,
        cancerHistory:      answers.q4!,
        hivAidsTest:        answers.q5!,
        recentVaccination:  answers.q6!,
      });
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not save medical info";
      Alert.alert("Error", msg || t("medical.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("medical.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loadingExisting ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>{t("medical.questions")}</Text>
          <Text style={styles.pageSubtitle}>{t("medical.subtitle")}</Text>

          {/* QUESTIONS */}
          {QUESTIONS.map((q) => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{q.text}</Text>
              <View style={styles.radioRow}>
                <RadioOption
                  label={t("common.yes")}
                  selected={answers[q.id] === "yes"}
                  onPress={() => setAnswer(q.id, "yes")}
                />
                <RadioOption
                  label={t("common.no")}
                  selected={answers[q.id] === "no"}
                  onPress={() => setAnswer(q.id, "no")}
                />
              </View>
            </View>
          ))}

          {/* TERMS */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && (
                <Ionicons name="checkmark" size={13} color="#fff" />
              )}
            </View>
            <Text style={styles.termsText}>
              {t("medical.agreeText")}{" "}
              <Text style={styles.termsLink}>{t("medical.terms")}</Text>
            </Text>
          </TouchableOpacity>

          {/* CTA — only shown when no prior data exists */}
          {!hasExistingData && (
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.ctaBtn,
                (!allAnswered || submitting) && styles.ctaBtnDisabled,
              ]}
              disabled={!allAnswered || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaBtnText}>{t("medical.becomeDonor")}</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderColor: "#B8B8B8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
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

  /* TERMS */
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
