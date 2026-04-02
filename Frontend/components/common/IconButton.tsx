import { TouchableOpacity } from "react-native";

export default function IconButton({ icon, onPress } : any) {
  return (
    <TouchableOpacity onPress={onPress}>
      {icon}
    </TouchableOpacity>
  );
}