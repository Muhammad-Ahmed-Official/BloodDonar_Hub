import api from "./api";

export const getConversations = async () => {
  try {
    const res = await api.get("chat/conversations");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch conversations" };
  }
};

export const getMessages = async (receiverId: string, params?: { page?: number; limit?: number }) => {
  try {
    const res = await api.get(`chat/messages/${receiverId}`, { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch messages" };
  }
};

export const sendMessage = async (data: { receiverId: string; message: string; customId?: string }) => {
  try {
    const res = await api.post("chat/messages", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to send message" };
  }
};

export const deleteMessage = async (customId: string) => {
  try {
    const res = await api.delete(`chat/messages/${customId}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete message" };
  }
};

export const editMessage = async (customId: string, message: string) => {
  try {
    const res = await api.patch(`chat/messages/${customId}`, { message });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to edit message" };
  }
};

export const searchUsers = async (q: string) => {
  try {
    const res = await api.get("chat/users/search", { params: { q } });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to search users" };
  }
};
