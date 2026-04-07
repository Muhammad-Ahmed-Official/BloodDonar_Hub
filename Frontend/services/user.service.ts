import api from "./api";

export const createProfile = async (data: { mobileNumber: string, bloodGroup: string, city: string, dateOfBirth: string, gender: string, canDonateBlood: string, about: string  }) => {
  try {
    const res = await api.post("auth/createProfile", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Profile creation failed" };
  }
};


export const medicalInfo = async (data: {diabetes: boolean, headOrLungsProblem: boolean, recentCovid: boolean, cancerHistory: boolean, hivAidsTest: boolean, recentVaccination: boolean }) => {
  try {
    const res = await api.post("auth/medicalInfo", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "medical Info failed" };
  }
};


export const donarRequest = async (data: { donarName: string, bloodGroup: string, amount: string, age: string, date: Date, hospitalName: string, location: string, contactPersonName: string, mobileNumber: string, city: string, startTime: string, endTime: string, reason: string, donateTo: string }) => {
  try {
    const res = await api.post("auth/donarRequest", data);
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || { message: "Donar Request failed" };
  }
};