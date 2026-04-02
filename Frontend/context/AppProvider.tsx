// import { AuthProvider } from "./AuthContext";

export default function AppProvider({ children }: any) {
  return (
    <>
      {children}
    </>
    // <AuthProvider>
    //   {children}
    // </AuthProvider>
  );
}