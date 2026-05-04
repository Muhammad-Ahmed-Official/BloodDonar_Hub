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

export const savePushToken = async (token: string) => {
  try {
    const res = await api.patch("user/push-token", { expoPushToken: token });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Failed to save push token" };
  }
};
