import Card from "@/components/common/Card";
import { FlatList, Text } from "react-native";

const chats = [
  { id: "1", name: "Ali" },
  { id: "2", name: "Usman" },
];

export default function InboxScreen() {
  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card>
          <Text>{item.name}</Text>
        </Card>
      )}
    />
  );
}