import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{  }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
