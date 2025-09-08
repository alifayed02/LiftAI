import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "",               // hide title
        headerBackTitle: "", // hide back text on iOS
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerShadowVisible: false,    // remove bottom border line
        contentStyle: {
          backgroundColor: "white",
          paddingTop: Platform.OS === "ios" ? 30 : 24,
        },
      }}
    />
  );
}
