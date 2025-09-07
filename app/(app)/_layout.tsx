import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "",               // hide title
        headerBackTitle: "", // hide back text on iOS
        headerStyle: {
          backgroundColor: "white",    // match your screen background
        },
        headerShadowVisible: false,    // remove bottom border line
      }}
    />
  );
}
