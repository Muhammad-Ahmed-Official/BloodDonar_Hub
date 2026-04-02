import AppProvider from '@/context/AppProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  const isLoggedIn = true;
  return (
    <AppProvider>
    <Stack 
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "white"}, animation: "slide_from_right", header: () => null,  navigationBarHidden: true }}>
      {!isLoggedIn ? (
        <Stack.Screen name="(auth)" />
      ) : null }
    </Stack>
    <StatusBar style="light" />
    </AppProvider>
  );
}
