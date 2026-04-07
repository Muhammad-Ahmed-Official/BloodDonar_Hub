import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

// ─── Token ───────────────────────────────────────────────────────────────────

export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const saveUser = async (user: object): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getSavedUser = async (): Promise<any | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const removeUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

// ─── Clear everything (logout) ───────────────────────────────────────────────

export const clearSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
