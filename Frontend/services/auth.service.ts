import api from "./api";

function extractError(error: any, fallback: string): never {
  if (error?.response?.data?.message) throw new Error(error.response.data.message);
  if (error?.code === "ECONNABORTED") throw new Error("Server is slow to respond. Please try again.");
  if (error?.message === "Network Error") throw new Error("No internet connection. Check your network and try again.");
  throw new Error(fallback);
}

export const signUpUser = async (data: { userName: string, email: string; password: string }) => {
  try {
    const res = await api.post("auth/signup", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "Signup failed. Please try again.");
  }
};


export const verifyEmail = async (data: { otp: string }) => {
  try {
    const res = await api.post("auth/verify-email", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "Verification failed. Please try again.");
  }
};


export const resendOtp = async (data: { email: string }) => {
  try {
    const res = await api.post("auth/resend-otp", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "OTP resend failed. Please try again.");
  }
};


export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const res = await api.post("auth/login", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "Login failed. Please try again.");
  }
};


export const forgotPassword = async (data: { email: string }) => {
  try {
    const res = await api.post("auth/forgot-password", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "Forgot password request failed. Please try again.");
  }
};


export const updatePassword = async (data: { newPassword: string; otp: string }) => {
  try {
    const res = await api.post("auth/update-password", data);
    return res.data;
  } catch (error: any) {
    extractError(error, "Password update failed. Please try again.");
  }
};


export const logoutUser = async () => {
  try {
    const res = await api.post("auth/logout");
    return res.data;
  } catch {
    // fire-and-forget — local session is cleared regardless
  }
};