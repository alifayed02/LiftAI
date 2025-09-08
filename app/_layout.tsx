import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerBackTitle: "",
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "white" },
      }}
    />
  );
}
