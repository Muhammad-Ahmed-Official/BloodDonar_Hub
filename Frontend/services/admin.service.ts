import api from "./api";

export const getAdminStats = async () => {
  try {
    const res = await api.get("admin/stats");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch admin stats" };
  }
};

export const getAdminUsers = async (params?: { page?: number; limit?: number; search?: string }) => {
  try {
    const res = await api.get("admin/users", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch users" };
  }
};

export const getAdminDonors = async (params?: { page?: number; limit?: number; bloodGroup?: string; city?: string }) => {
  try {
    const res = await api.get("admin/donors", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch donors" };
  }
};

export const getAdminRequests = async (params?: { page?: number; limit?: number; bloodGroup?: string; city?: string }) => {
  try {
    const res = await api.get("admin/requests", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch requests" };
  }
};

export const updateAdminDonationRequest = async (
  id: string,
  data: {
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
  }
) => {
  try {
    const res = await api.patch(`admin/requests/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update donation request" };
  }
};

export const deleteAdminDonationRequest = async (id: string) => {
  try {
    const res = await api.delete(`admin/requests/${id}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete donation request" };
  }
};

export const blockOrUnblockUser = async (id: string) => {
  try {
    const res = await api.patch(`admin/user/${id}/block`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update user status" };
  }
};

export const createAdminBloodRequest = async (data: {
  patientName: string;
  bloodGroup: string;
  location: string;
  urgencyLevel: string;
  requiredUnits: number;
  contactInfo: string;
}) => {
  try {
    const res = await api.post("admin/blood-request", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create blood request" };
  }
};

export const createAdminUser = async (data: {
  userName: string;
  email: string;
  password: string;
  mobileNumber?: string;
  bloodGroup?: string;
  city?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  canDonateBlood?: "yes" | "no";
  country?: string;
  about?: string;
  role?: "user" | "admin";
}) => {
  try {
    const res = await api.post("admin/users", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create user" };
  }
};

export const updateAdminUser = async (
  id: string,
  data: {
    userName?: string;
    email?: string;
    mobileNumber?: string;
    bloodGroup?: string;
    city?: string;
    country?: string;
    gender?: string;
    dateOfBirth?: string;
    canDonateBlood?: "yes" | "no";
    age?: string;
    about?: string;
  }
) => {
  try {
    const res = await api.patch(`admin/users/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update user" };
  }
};

export const toggleSuspendAdminUser = async (id: string) => {
  try {
    const res = await api.patch(`admin/users/${id}/suspend`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to suspend user" };
  }
};

export const getAdminPosts = async (params?: { page?: number; limit?: number }) => {
  try {
    const res = await api.get("admin/posts", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch posts" };
  }
};

export const updateAdminPost = async (
  id: string,
  data: {
    bloodGroup?: string;
    patientName?: string;
    city?: string;
    hospital?: string;
    date?: string;
    address?: string;
    isEmergency?: boolean;
  }
) => {
  try {
    const res = await api.put(`admin/posts/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to update post" };
  }
};

export const deleteAdminPost = async (id: string) => {
  try {
    const res = await api.delete(`admin/posts/${id}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete post" };
  }
};

export const createAdminPost = async (data: {
  bloodGroup: string;
  patientName: string;
  city: string;
  hospital: string;
  date: string;
  address: string;
  isEmergency?: boolean;
}) => {
  try {
    const res = await api.post("admin/posts", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create post" };
  }
};
