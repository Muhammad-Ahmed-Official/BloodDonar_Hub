import AppProvider from '@/context/AppProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
    {/* <AppProvider> */}
      <Stack 
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "white"}, animation: "slide_from_right", header: () => null,  navigationBarHidden: true }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name='(admin)'/>
      </Stack>
      <StatusBar style="light" />
    {/* </AppProvider> */}
    </>
  );
}
