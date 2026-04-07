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
      const fileName = avatarUri.split("/").pop() ?? "avatar.jpg";
      const ext      = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      // React Native requires this object shape for file uploads
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


export const getAllRequests = async (params?: { bloodGroup?: string; city?: string; page?: number }) => {
  try {
    const res = await api.get("user/requests", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch requests" };
  }
};


export const getDonors = async (params?: { bloodGroup?: string; city?: string; page?: number }) => {
  try {
    const res = await api.get("user/donors", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch donors" };
  }
};


export const getPosts = async (params?: { page?: number }) => {
  try {
    const res = await api.get("user/posts", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch posts" };
  }
};
