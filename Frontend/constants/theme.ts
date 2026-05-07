import { Platform } from 'react-native';

export const COLORS = {
  primary: "#FD1313",
  white: "#ffffff",
  black: "#000000",
  gray: "#F5F5F5",
  lightGray: "#E5E5E5",
  text: "#333333",
};

export const SIZES = {
  padding: 10,
  radius: 12,
};

export const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
};

// "System" resolves to SF Pro on iOS; "Roboto" is the Android default.
export const FONT_FAMILY = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const PAKISTAN_CITIES = [
  "Abbottabad", "Bahawalpur", "Chiniot", "Dera Ghazi Khan", "Dera Ismail Khan",
  "Faisalabad", "Gujranwala", "Gujrat", "Hyderabad", "Islamabad",
  "Jhang", "Karachi", "Kasur", "Lahore", "Larkana",
  "Mardan", "Mingora", "Mirpur", "Multan", "Muzaffarabad",
  "Nawabshah", "Okara", "Peshawar", "Quetta", "Rahim Yar Khan",
  "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
  "Sukkur", "Wah Cantt",
];
