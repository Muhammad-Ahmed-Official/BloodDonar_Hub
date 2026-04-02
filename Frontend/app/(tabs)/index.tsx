import { FlatList, Text } from "react-native";
import BloodBadge from "@/components/common/BloodBadge";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

const dummyData = [
  { id: "1", blood: "A+", name: "Ahmed" },
  { id: "2", blood: "B+", name: "Ali" },
];

export default function HomeScreen() {
  return (
    <FlatList
      data={dummyData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Card>
          <BloodBadge group={item.blood} />
          <Text>{item.name}</Text>
          <Button title="Donate" onPress={() => {}} />
        </Card>
      )}
    />
  );
}