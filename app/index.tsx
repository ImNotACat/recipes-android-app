import { Redirect } from "expo-router";

/**
 * Root index route - redirects to sign-in by default.
 * The root layout handles auth-based redirects.
 */
export default function Index() {
  // Root layout handles auth redirects, this is just a fallback
  return <Redirect href="/(auth)/sign-in" />;
}
