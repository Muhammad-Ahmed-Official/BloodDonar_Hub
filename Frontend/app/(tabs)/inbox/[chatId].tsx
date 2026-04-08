import { View, Text, StyleSheet,
FlatList, TextInput, TouchableOpacity,
KeyboardAvoidingView, Platform, StatusBar, Linking,
ActivityIndicator,
Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLORS, SHADOW } from "../../../constants/theme";
import { getMessages, sendMessage as sendMessageApi } from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import { getPublicUserProfile } from "@/services/user.service";
import { connectRealtime } from "@/services/realtime";
import { useFocusEffect } from "@react-navigation/native";

type ApiUser = { _id?: string; userName?: string };
type ApiMessage = {
  _id: string;
  customId: string;
  sender: ApiUser | string;
  receiver: ApiUser | string;
  message: string;
  createdAt: string;
};

type UiMessage = {
  id: string;
  customId?: string;
  text: string;
  sender: "me" | "them";
  time: string;
  createdAt?: string;
  pending?: boolean;
};

type SocketPayload = {
  sender: string;
  receiver: string;
  message: string;
  customId?: string;
  createdAt?: string;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const receiverId = useMemo(() => (Array.isArray(chatId) ? chatId[0] : (chatId as string)), [chatId]);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [partner, setPartner] = useState<{ name: string; pic?: string; mobile?: string } | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);

  const emitSeen = useCallback(() => {
    if (!user?._id) return;
    const s = connectRealtime(String(user._id));
    if (!s || !receiverId || !user?._id) return;
    // Mark partner -> me messages as seen
    s.emit("seenMsg", { sender: String(receiverId), receiver: String(user._id) });
  }, [receiverId, user?._id]);

  useEffect(() => {
    if (!receiverId) {
      setError("Missing chat id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMessages(receiverId, { page: 1, limit: 100 });
        const raw = res?.data;
        const list: ApiMessage[] = Array.isArray(raw) ? raw : [];
        const myId = user?._id ? String(user._id) : "";
        const ui = list
          .map((m) => {
            const senderId =
              m.sender && typeof m.sender === "object" ? String(m.sender._id ?? "") : String(m.sender ?? "");
            const isMe = myId && senderId === myId;
            return {
              id: m._id,
              customId: m.customId,
              text: m.message,
              sender: isMe ? "me" : "them",
              time: formatTime(m.createdAt),
              createdAt: m.createdAt,
            } satisfies UiMessage;
          })
          .sort((a, b) => {
            const aa = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bb - aa;
          });
        if (!cancelled) setMessages(ui);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: string }).message)
            : "Could not load messages";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [receiverId, user?._id]);

  // When screen is focused, mark messages as seen
  useFocusEffect(
    useMemo(
      () => () => {
        emitSeen();
        return undefined;
      },
      [emitSeen]
    )
  );

  useEffect(() => {
    if (!receiverId) return;
    let cancelled = false;
    (async () => {
      setLoadingPartner(true);
      try {
        const res = await getPublicUserProfile(receiverId);
        const d = res?.data;
        const name = d?.user?.userName ?? "User";
        const pic = d?.userInfo?.pic ?? "";
        const mobile = d?.userInfo?.mobileNumber ?? "";
        if (!cancelled) setPartner({ name, pic, mobile });
      } catch {
        if (!cancelled) setPartner({ name: "User" });
      } finally {
        if (!cancelled) setLoadingPartner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [receiverId]);

  // Real-time receive
  useEffect(() => {
    if (!receiverId || !user?._id) return;
    const s = connectRealtime(String(user._id));
    if (!s) return;

    const onNewMessage = (payload: any) => {
      const p = payload as SocketPayload;
      // Only apply messages belonging to this open chat
      const me = String(user._id);
      const fromPartner = String(p.sender) === String(receiverId) && String(p.receiver) === me;
      if (!fromPartner) return;

      const createdAt = p.createdAt ?? new Date().toISOString();
      setMessages((prev) => [
        {
          id: `rt-${p.customId ?? createdAt}`,
          customId: p.customId,
          text: p.message,
          sender: "them",
          time: formatTime(createdAt),
          createdAt,
        },
        ...prev,
      ]);

      // instantly mark as seen if I'm currently in this chat
      emitSeen();
    };

    s.on("newMessage", onNewMessage);
    return () => {
      s.off("newMessage", onNewMessage);
    };
  }, [receiverId, user?._id]);

  const sendMessage = async () => {
    if (!receiverId) return;
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [
      {
        id: optimisticId,
        text,
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pending: true,
      },
      ...prev,
    ]);
    setInputText("");
    setSending(true);
    try {
      // REST send persists message; backend emits realtime event to receiver
      const res = await sendMessageApi({ receiverId, message: text });
      const m = res?.data as ApiMessage | undefined;
      if (m?._id) {
        setMessages((prev) =>
          prev.map((x) =>
            x.id === optimisticId
              ? {
                  id: m._id,
                  customId: m.customId,
                  text: m.message,
                  sender: "me",
                  time: formatTime(m.createdAt),
                  createdAt: m.createdAt,
                  pending: false,
                }
              : x
          )
        );
      } else {
        setMessages((prev) => prev.filter((x) => x.id !== optimisticId));
      }
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((x) => x.id !== optimisticId));
      const msg =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: string }).message)
          : "Could not send message";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    const raw = partner?.mobile?.replace(/\s/g, "") ?? "";
    if (!raw) return;
    Linking.openURL(`tel:${raw}`);
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
        <TouchableOpacity onPress={() => router.push("/(tabs)/inbox")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            {partner?.pic ? (
              <Image source={{ uri: partner.pic }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={22} color={COLORS.white} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {partner?.name ?? "Chat"}
            </Text>
            <Text style={styles.headerStatus}>
              {loadingPartner ? "Loading…" : " "}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={handleCall} disabled={!partner?.mobile}>
          <Ionicons name="call-outline" size={22} color={partner?.mobile ? COLORS.primary : "#bbb"} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={renderMessage}
            inverted
          />
        </>
      )}

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
            
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sending}>
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
    overflow: "hidden",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  errorText: {
    color: "#E53935",
    paddingHorizontal: 16,
    marginTop: 10,
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