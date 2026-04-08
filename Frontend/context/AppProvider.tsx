import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
