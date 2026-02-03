import { Stack } from "expo-router";

/**
 * Layout for authentication routes.
 * Root layout handles auth redirects.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    />
  );
}
