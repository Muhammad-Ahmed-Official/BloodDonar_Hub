import { AuthProvider } from "./AuthContext";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
