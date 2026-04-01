import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      
      <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
      
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

    </Tabs>
  );
}