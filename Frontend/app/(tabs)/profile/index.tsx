import ListItem from "@/components/common/ListItem";
import ProfileHeader from "@/components/common/ProfileHeader";
import { View } from "react-native";


export default function ProfileScreen() {
  return (
    <View>
      <ProfileHeader name="Ahmed" />

      <ListItem title="Settings" />
      <ListItem title="Language" />
      <ListItem title="Privacy Policy" />
      <ListItem title="Logout" />
    </View>
  );
}