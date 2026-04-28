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

export const PAKISTAN_CITIES = [
  "Abbottabad", "Bahawalpur", "Chiniot", "Dera Ghazi Khan", "Dera Ismail Khan",
  "Faisalabad", "Gujranwala", "Gujrat", "Hyderabad", "Islamabad",
  "Jhang", "Karachi", "Kasur", "Lahore", "Larkana",
  "Mardan", "Mingora", "Mirpur", "Multan", "Muzaffarabad",
  "Nawabshah", "Okara", "Peshawar", "Quetta", "Rahim Yar Khan",
  "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
  "Sukkur", "Wah Cantt",
];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
