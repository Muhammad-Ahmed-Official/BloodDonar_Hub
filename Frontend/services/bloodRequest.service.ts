import api from "./api";

export interface CreateBloodRequestData {
  patientName: string;
  bloodGroup: string;
  requiredUnits: number;
  location: string;
  city: string;
  hospitalName: string;
  contactInfo: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  donationDate: string;           // ISO date string e.g. "2026-05-10"
  donationWindow: {
    startTime: string;            // "HH:mm"  e.g. "09:00"
    endTime: string;              // "HH:mm"  e.g. "12:00"
  };
  age?: number;
  reason?: string;
}

export const createBloodRequest = async (data: CreateBloodRequestData) => {
  try {
    const res = await api.post("bloodRequest", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to create blood request" };
  }
};

export const getMyRequests = async () => {
  try {
    const res = await api.get("bloodRequest/my-requests");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch your requests" };
  }
};

export const getMyAssignments = async () => {
  try {
    const res = await api.get("bloodRequest/my-assignments");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch your assignments" };
  }
};

export const respondToRequest = async (
  requestId: string,
  action: "accept" | "reject"
) => {
  try {
    const res = await api.patch(`bloodRequest/${requestId}/respond`, { action });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to respond to request" };
  }
};

export const confirmDonation = async (requestId: string, confirmed: boolean) => {
  try {
    const res = await api.patch(`bloodRequest/${requestId}/confirm`, { confirmed });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to confirm donation" };
  }
};

export const getAssignedBloodRequests = async () => {
  try {
    const res = await api.get("bloodRequest/assigned");
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch assigned requests" };
  }
};

export const getBloodRequestFeed = async (params?: { bloodGroup?: string; city?: string }) => {
  try {
    const res = await api.get("bloodRequest/feed", { params });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch blood request feed" };
  }
};

export const deleteBloodRequest = async (id: string) => {
  try {
    const res = await api.delete(`bloodRequest/${id}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to delete blood request" };
  }
};

export const getBloodRequestById = async (id: string) => {
  try {
    const res = await api.get(`bloodRequest/${id}`);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to fetch blood request" };
  }
};

export const checkActiveRequest = async (): Promise<{
  hasActive: boolean;
  expiresAt: string | null;
  patientName: string | null;
}> => {
  try {
    const res = await api.get("bloodRequest/check-active");
    return res.data?.data ?? { hasActive: false, expiresAt: null, patientName: null };
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to check active request" };
  }
};

export const receiverRespondToDonor = async (
  requestId: string,
  donorId: string,
  action: "accept" | "reject"
) => {
  try {
    const res = await api.patch(`bloodRequest/${requestId}/receiver-respond`, {
      donorId,
      action,
    });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to respond to donor" };
  }
};

export const markDonationDone = async (requestId: string, donorId: string) => {
  try {
    const res = await api.patch(`bloodRequest/${requestId}/mark-done`, { donorId });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to mark donation as done" };
  }
};

export const savePushToken = async (token: string) => {
  try {
    const res = await api.patch("user/push-token", { expoPushToken: token });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to save push token" };
  }
};
