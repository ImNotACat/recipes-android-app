import { Stack } from "expo-router";

/**
 * Layout for authenticated app routes.
 * Root layout handles auth redirects.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#1f2937",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    />
  );
}
