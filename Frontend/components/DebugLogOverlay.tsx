import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { subscribeToLogs, clearLogs } from "@/utils/debugLog";

export default function DebugLogOverlay() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => subscribeToLogs(setLogs), []);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {visible && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Push Notification Logs</Text>
            <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 8 }}>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No logs yet — waiting for push events...</Text>
            ) : (
              logs.map((entry, i) => (
                <Text key={i} style={styles.logEntry}>
                  {entry}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      )}
      <TouchableOpacity
        style={[styles.toggleBtn, visible && styles.toggleBtnActive]}
        onPress={() => setVisible((v) => !v)}
      >
        <Text style={styles.toggleText}>{visible ? "✕" : "LOG"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 80 : 100,
    right: 12,
    alignItems: "flex-end",
    zIndex: 9999,
  },
  panel: {
    width: 320,
    maxHeight: 320,
    backgroundColor: "rgba(0,0,0,0.88)",
    borderRadius: 10,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E53935",
  },
  panelTitle: {
    color: "#E53935",
    fontWeight: "bold",
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  clearText: {
    color: "#aaa",
    fontSize: 11,
  },
  scroll: {
    maxHeight: 260,
  },
  emptyText: {
    color: "#666",
    fontSize: 11,
    fontStyle: "italic",
  },
  logEntry: {
    color: "#00ff88",
    fontSize: 10,
    fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
    marginBottom: 4,
    lineHeight: 14,
  },
  toggleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: "#555",
  },
  toggleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
