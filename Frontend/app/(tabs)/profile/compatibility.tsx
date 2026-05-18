import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "@/constants/theme";

const DONATE_TO   = ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"];
const ACCEPT_FROM = ["O-",  "O+",  "B-", "B+", "A-", "A+", "AB-","AB+"];

const MATRIX: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1, 0, 0],
  [1, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 0, 0, 0, 0],
  [1, 0, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
];

// Updated table data with full text
const TABLE_DATA = [
  { type: "A+",  canGive: "A+, AB+",           canReceive: "A+, A-, O+, O-" },
  { type: "A-",  canGive: "A+, A-, AB+, AB-",  canReceive: "A-, O-" },
  { type: "B+",  canGive: "B+, AB+",            canReceive: "B+, B-, O+, O-" },
  { type: "B-",  canGive: "B+, B-, AB+, AB-",  canReceive: "B-, O-" },
  { type: "AB+", canGive: "AB+",                canReceive: "All Blood Types" },
  { type: "AB-", canGive: "AB+, AB-",           canReceive: "AB-, A-, B-, O-" },
  { type: "O+",  canGive: "O+, A+, B+, AB+",   canReceive: "O+, O-" },
  { type: "O-",  canGive: "All Blood Types",    canReceive: "O-" },
];

const { width: screenW } = Dimensions.get("window");

// Grid sizing adjustments
const CARD_PADDING   = 15;
const SCREEN_PADDING = SIZES.padding * 2;
const LABEL_COL_W    = 36;
const LABEL_GAP      = 10;
const ROW_LABEL_W    = 39;
const GRID_W         = screenW - SCREEN_PADDING - LABEL_COL_W - LABEL_GAP - CARD_PADDING * 4;
const TOTAL_COLUMNS = ACCEPT_FROM.length; // 8
const CELL_SIZE = Math.floor((GRID_W - ROW_LABEL_W) / TOTAL_COLUMNS);
const COL_HDR_H      = 32;

export default function CompatibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compatibility</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView 
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 } // Add bottom padding for tab bar
        ]} 
        showsVerticalScrollIndicator={false}
        horizontal={false}
      >
        {/* ── GRID CARD ── */}
        <View style={styles.card}>
          <Text style={styles.acceptLabel}>Accept From</Text>

          <View style={styles.gridOuter}>
            {/* Rotated "Donate To" label */}
            <View style={[styles.donateLabelBox, { width: LABEL_COL_W }]}>
              <Text style={styles.donateLabel}>Donate To</Text>
            </View>

            {/* Horizontal scroll for grid on small screens */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.grid]}>
                {/* Column headers */}
                <View style={styles.gridRow}>
                  <View style={[styles.cornerCell, { width: ROW_LABEL_W, height: COL_HDR_H }]} />
                  {ACCEPT_FROM.map((type) => (
                    <View key={type} style={[styles.colHeaderCell, { width: CELL_SIZE, height: COL_HDR_H }]}>
                      <Text style={styles.colHeaderText}>{type}</Text>
                    </View>
                  ))}
                </View>

                {/* Data rows */}
                {DONATE_TO.map((donateType, rowIdx) => (
                  <View
                    key={donateType}
                    style={[
                      styles.gridRow,
                      { backgroundColor: rowIdx % 2 === 0 ? "#fff" : "#F6F6F6" },
                    ]}
                  >
                    <View style={[styles.rowLabelCell, { width: ROW_LABEL_W, height: CELL_SIZE }]}>
                      <Text style={styles.rowLabelText}>{donateType}</Text>
                    </View>

                    {ACCEPT_FROM.map((_, colIdx) => (
                      <View
                        key={colIdx}
                        style={[
                          styles.cell,
                          { flex: 1, aspectRatio: 1 },
                          colIdx % 2 !== 0 && styles.cellAlt,
                        ]}
                      >
                        {MATRIX[rowIdx][colIdx] === 1 && (
                          <Image
                            source={require("../../../assets/projectImages/drop2.png")}
                            style={{ width: CELL_SIZE * 0.52, height: CELL_SIZE * 0.52 }}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* ── TABLE CARD (Updated with better layout) ── */}
        <View style={styles.tableCard}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.c1]}>Blood Type</Text>
            <Text style={[styles.thText, styles.c2]}>Can Give to</Text>
            <Text style={[styles.thText, styles.c3]}>Can Receive from</Text>
          </View>

          {/* Data rows */}
          {TABLE_DATA.map((row, idx) => (
            <View key={row.type}>
              <View style={styles.tableRow}>
                <Text style={[styles.tdType, styles.c1]}>{row.type}</Text>
                <Text style={[styles.tdCell, styles.c2]}>{row.canGive}</Text>
                <Text style={[styles.tdCell, styles.c3]}>{row.canReceive}</Text>
              </View>
              {idx < TABLE_DATA.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Extra bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  scroll: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },

  /* ── GRID CARD ── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: CARD_PADDING,
    marginBottom: 16,
  },
  acceptLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  gridOuter: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  donateLabelBox: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: LABEL_GAP,
    height: 280,
  },
  donateLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    letterSpacing: 0.3,
    transform: [{ rotate: "-90deg" }],
    width: 72,
    textAlign: "center",
  },

  /* Grid */
  grid: {
    borderWidth: 1,
    borderColor: "#DEDEDE",
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start"
  },
  gridRow: { 
    flexDirection: "row" 
  },
  cornerCell: {
    backgroundColor: "#EFEFEF",
    borderRightWidth: 1,
    borderRightColor: "#DEDEDE",
    borderBottomWidth: 1,
    borderBottomColor: "#DEDEDE",
  },
  colHeaderCell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
    borderRightWidth: 1,
    borderRightColor: "#DEDEDE",
    borderBottomWidth: 1,
    borderBottomColor: "#DEDEDE",
  },
  colHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  rowLabelCell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
    borderRightWidth: 1,
    borderRightColor: "#DEDEDE",
    borderBottomWidth: 1,
    borderBottomColor: "#DEDEDE",
  },
  rowLabelText: {
fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#EBEBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  cellAlt: {
    backgroundColor: "#F2F2F2",
  },

  /* ── TABLE CARD (Updated) ── */
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FFF0F0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  thText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 50,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#FADADD",
    marginHorizontal: 0,
  },
  c1: { 
    flex: 0.9,
    width: 90,
  },
  c2: { 
    flex: 1.4,
    paddingRight: 8,
  },
  c3: { 
    flex: 1.7,
    paddingRight: 8,
  },
  tdType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  tdCell: {
    fontSize: 11,
    color: "#444",
    lineHeight: 18,
    flexWrap: "wrap",
    flexShrink: 1,
  },
});