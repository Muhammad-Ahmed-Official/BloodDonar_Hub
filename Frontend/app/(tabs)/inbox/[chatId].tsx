import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { COLORS, SHADOW } from "../../../constants/theme";

const INITIAL_MESSAGES = [
  { id: "1", text: "Is this possible you can come?", sender: "them", time: "11:01 AM" },
  { id: "2", text: "Hi yes for sure where are you right now?", sender: "me", time: "9:30 AM" },
  { id: "3", text: "Yes see you there, be ready", sender: "me", time: "2:15 PM" },
];

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState(INITIAL_MESSAGES.reverse());
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [newMessage, ...prev]);
    setInputText("");
  };

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  const renderMessage = ({ item } : any) => {
    const isMe = item.sender === "me";
    
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.bubble,
          isMe ? styles.myBubble : styles.theirBubble
        ]}>
          <Text style={[
            styles.bubbleText,
            isMe && styles.myBubbleText
          ]}>
            {item.text}
          </Text>
          <View style={styles.timeContainer}>
            <Text style={[
              styles.timeText,
              isMe && styles.myTimeText
            ]}>
              {item.time}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={COLORS.white} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>Hassnain Ali</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        renderItem={renderMessage}
      />

      {/* Input Area - Only Send Icon */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message"
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerText: {
    justifyContent: "center",
  },

  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  headerStatus: {
    fontSize: 12,
    color: "#25D366",
    marginTop: 2,
  },

  callBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },

  messageContainer: {
    marginBottom: 12,
  },

  myMessageContainer: {
    alignItems: "flex-end",
  },

  theirMessageContainer: {
    alignItems: "flex-start",
  },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },

  theirBubble: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    ...SHADOW,
  },

  myBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },

  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.text,
  },

  myBubbleText: {
    color: COLORS.white,
  },

  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },

  timeText: {
    fontSize: 10,
    color: "#999",
  },

  myTimeText: {
    color: "rgba(255,255,255,0.7)",
  },

  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8F8F8",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...SHADOW,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 100,
  },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});