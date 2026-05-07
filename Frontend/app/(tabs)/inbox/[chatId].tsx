import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Linking, ActivityIndicator, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLORS, SHADOW, SIZES } from "../../../constants/theme";
import { getMessages, sendMessage as sendMessageApi } from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import { getPublicUserProfile, getProfile } from "@/services/user.service";
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
    const d = new Date(iso);
    const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${date}  ${time}`;
  } catch {
    return "";
  }
}

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const { user, socket } = useAuth();
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
  const [myPic, setMyPic] = useState<string | null>(null);

  const emitSeen = useCallback(() => {
    if (!socket || !receiverId || !user?._id) return;
    socket.emit("seenMsg", { sender: String(receiverId), receiver: String(user._id) });
  }, [socket, receiverId, user?._id]);

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

  // Fetch own profile pic once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getProfile();
        const pic = res?.data?.userInfo?.pic ?? null;
        if (!cancelled) setMyPic(pic);
      } catch {
        // no-op — avatar just stays null
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Real-time receive — re-runs whenever the socket instance changes
  useEffect(() => {
    if (!socket || !receiverId || !user?._id) return;

    const onNewMessage = (payload: any) => {
      const p = payload as SocketPayload;
      const me = String(user._id);
      const fromPartner = String(p.sender) === String(receiverId) && String(p.receiver) === me;
      if (!fromPartner) return;

      const createdAt = p.createdAt ?? new Date().toISOString();
      setMessages((prev) => {
        const exists = prev.some((m) => {
          if (p.customId && m.customId) return m.customId === p.customId;
          return (
            m.sender === "them" &&
            m.text === p.message &&
            Math.abs(new Date(m.createdAt ?? 0).getTime() - new Date(createdAt).getTime()) < 1500
          );
        });
        if (exists) return prev;
        return [
          {
            id: `rt-${p.customId ?? createdAt}`,
            customId: p.customId,
            text: p.message,
            sender: "them",
            time: formatTime(createdAt),
            createdAt,
          },
          ...prev,
        ];
      });

      emitSeen();
    };

    socket.on("newMessage", onNewMessage);
    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [socket, receiverId, user?._id]);

  const sendMessage = async () => {
    if (!receiverId) return;
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const optimisticId = `local-${Date.now()}`;
    const customId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMessages((prev) => [
      {
        id: optimisticId,
        text,
        sender: "me",
        time: formatTime(new Date().toISOString()),
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
    const pic  = isMe ? myPic : partner?.pic;

    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            {pic ? (
              <Image source={{ uri: pic }} style={styles.msgAvatarImg} />
            ) : (
              <Ionicons name="person" size={16} color="#999" />
            )}
          </View>
        )}

        <View style={styles.msgContent}>
          <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
            {item.time}
          </Text>
        </View>

        {isMe && (
          <View style={styles.msgAvatar}>
            {pic ? (
              <Image source={{ uri: pic }} style={styles.msgAvatarImg} />
            ) : (
              <Ionicons name="person" size={16} color="#999" />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
<View style={styles.header}>
  <TouchableOpacity
    onPress={() => router.push("/(tabs)/inbox")}
    style={styles.backBtn}
  >
    <Ionicons
      name="chevron-back"
      size={24}
      color={COLORS.text}
    />
  </TouchableOpacity>

  <View style={styles.headerInfo}>
    <View style={styles.avatar}>
      {partner?.pic ? (
        <Image
          source={{ uri: partner.pic }}
          style={styles.avatarImg}
        />
      ) : (
        <Ionicons
          name="person"
          size={22}
          color={COLORS.white}
        />
      )}
    </View>

    <View style={styles.headerText}>
      <Text
  style={styles.headerName}
  numberOfLines={1}
>
  {(partner?.name ?? "Chat")
    .charAt(0)
    .toUpperCase() + (partner?.name ?? "Chat").slice(1)}
</Text>

      {/* {!!loadingPartner && (
        <Text style={styles.headerStatus}>
          Loading...
        </Text>
      )} */}
    </View>
  </View>

  <TouchableOpacity
    style={styles.callBtn}
    onPress={handleCall}
    disabled={!partner?.mobile}
  >
    <Ionicons
      name="call-outline"
      size={22}
      color={partner?.mobile ? COLORS.primary : "#bbb"}
    />
  </TouchableOpacity>
</View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, marginTop: 24 }} />
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
              style={{ flex: 1 }}
            />
          </>
        )}

        {/* Input Area */}
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
              <FontAwesome6 name="arrow-right" size={20} color={COLORS.white} />
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
    backgroundColor: COLORS.white,
  },

header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  paddingHorizontal: SIZES.padding,
  paddingTop: 18,
  paddingBottom: 18,

  backgroundColor: COLORS.white,

  borderBottomWidth: 1,
  borderColor: "#B8B8B8",
},

backBtn: {
  width: 42,
  height: 42,

  justifyContent: "center",
  alignItems: "center",
},

headerInfo: {
  flex: 1,

  flexDirection: "row",
  alignItems: "center",

  marginHorizontal: 10,
},

avatar: {
  width: 44,
  height: 44,
  borderRadius: 22,

  backgroundColor: "#ccc",

  justifyContent: "center",
  alignItems: "center",

  overflow: "hidden",

  marginRight: 12,
},

headerText: {
  // flex: 1,
  fontSize: 30,
  justifyContent: "center",
},

avatarImg: {
  width: "100%",
  height: "100%",
},


headerName: {
  fontSize: 16,
  fontWeight: "700",
  color: COLORS.text,
  lineHeight: 20,
},

headerStatus: {
  fontSize: 12,
  color: "#25D366",

  marginTop: 2,

  lineHeight: 16,
},

callBtn: {
  width: 42,
  height: 42,

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

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },

  myRow: {
    justifyContent: "flex-end",
  },

  theirRow: {
    justifyContent: "flex-start",
  },

  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
    marginBottom: 19,
  },

  msgAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  msgContent: {
    maxWidth: "75%",
  },

  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },

  theirBubble: {
    backgroundColor: "#F5F5F8",
    borderTopLeftRadius: 4,
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

  timeText: {
    fontSize: 10,
    marginTop: 6,
    marginHorizontal: 4,
  },

  myTime: {
    alignSelf: "flex-end",
  },

  theirTime: {
    alignSelf: "flex-start",
  },

  inputContainer: {
    // paddingHorizontal: 16,
    // paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F8",
    // borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
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