import api from "./api";

export const createProfile = async (
  data: {
    mobileNumber: string;
    bloodGroup: string;
    city: string;
    dateOfBirth: string;
    gender: string;
    canDonateBlood: "yes" | "no";
    about?: string;
  },
  avatarUri?: string          // optional local file URI from image picker
) => {
  try {
    // Always use FormData — backend route uses multer which handles both
    // file uploads and regular fields from multipart/form-data
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        formData.append(key, value as string);
      }
    });

    if (avatarUri) {
      const rawName  = avatarUri.split("/").pop() ?? "avatar.jpg";
      const hasDot   = rawName.includes(".");
      // Android content:// URIs often have no extension — fall back to "jpg"
      const ext      = hasDot ? rawName.split(".").pop()!.toLowerCase() : "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const fileName = hasDot ? rawName : `avatar.${ext}`;
      formData.append("avatar", { uri: avatarUri, name: fileName, type: mimeType } as any);
    }

    const res = await api.post("user/createProfile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Profile creation failed" };
  }
};


export const getProfile = async () => {
  try {
    const res = await api.get("user/profile");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch profile" };
  }
};


export const updateProfile = async (data: Partial<{
  mobileNumber: string;
  bloodGroup: string;
  city: string;
  dateOfBirth: string;
  gender: string;
  canDonateBlood: "yes" | "no";
  about: string;
  country: string;
}>) => {
  try {
    const res = await api.put("user/profile", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Profile update failed" };
  }
};

export const changeNumber = async (mobileNumber: string) => {
  try {
    const res = await api.put("user/changeNumber", { mobileNumber });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Mobile number update failed" };
  }
};


export const medicalInfo = async (data: {
  diabetes: "yes" | "no";
  headOrLungsProblem: "yes" | "no";
  recentCovid: "yes" | "no";
  cancerHistory: "yes" | "no";
  hivAidsTest: "yes" | "no";
  recentVaccination: "yes" | "no";
}) => {
  try {
    const res = await api.post("user/medicalInfo", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Medical info submission failed" };
  }
};


export const donarRequest = async (data: {
  donarName: string;
  bloodGroup: string;
  amount: string;
  age: number;
  date: string;
  hospitalName: string;
  location: string;
  contactPersonName: string;
  mobileNumber: string;
  city: string;
  startTime: string;
  endTime: string;
  reason: string;
  donateTo?: string;
}) => {
  try {
    const res = await api.post("user/donarRequest", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Donation request failed" };
  }
};


export const getAllRequests = async (params?: {
  bloodGroup?: string;
  city?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const res = await api.get("user/requests", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch requests" };
  }
};

export const deleteRequest = async (requestId: string) => {
  try {
    const res = await api.delete(`user/requests/${requestId}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete request" };
  }
};

export const getMedicalInfo = async () => {
  try {
    const res = await api.get("user/medicalInfo");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch medical info" };
  }
};

export const getRequestById = async (id: string) => {
  try {
    const res = await api.get(`user/requests/${id}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch request" };
  }
};

export const getPublicUserProfile = async (userId: string) => {
  try {
    const res = await api.get(`user/public/${userId}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to load profile" };
  }
};


export const getDonors = async (params?: {
  bloodGroup?: string;
  city?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const res = await api.get("user/donors", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch donors" };
  }
};

/** Returns all registered Expo push tokens from the backend */
export const getAllUserPushTokens = async (): Promise<string[]> => {
  // TODO: replace with real endpoint — e.g. GET /users/push-tokens
  // const res = await api.get("users/push-tokens");
  // return res.data.tokens;
  return [];
};
