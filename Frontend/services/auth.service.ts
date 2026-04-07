import api from "./api";

export const signUpUser = async (data: { userName: string, email: string; password: string }) => {
  try {
    const res = await api.post("auth/signup", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Signup failed" };
  }
};


export const verifyEmail = async (data: { otp: string }) => {
  try {
    const res = await api.post("auth/verify-email", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Verification failed" };
  }
};


export const resendOtp = async (data: { email: string }) => {
  try {
    const res = await api.post("auth/resend-otp", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "OTP resend failed" };
  }
};


export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const res = await api.post("auth/login", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Login failed" };
  }
};


export const forgotPassword = async (data: { email: string }) => {
  try {
    const res = await api.post("auth/forgot-password", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "forgot Password failed" };
  }
};


export const updatePassword = async (data: { newPassowrd: string, otp: string }) => {
  try {
    const res = await api.post("auth/update-password", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "forgot Password failed" };
  }
};