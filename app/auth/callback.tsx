import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter, useLocalSearchParams, useGlobalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../src/lib/supabase";

/**
 * OAuth callback handler route.
 * This catches the redirect from Supabase OAuth and extracts the tokens.
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL
        const url = await Linking.getInitialURL();
        console.log("Callback route received URL:", url);

        if (url) {
          // Extract tokens from the URL hash fragment
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // Check hash fragment (most common for Supabase)
          if (url.includes("#")) {
            const hashFragment = url.split("#")[1];
            const hashParams = new URLSearchParams(hashFragment);
            accessToken = hashParams.get("access_token");
            refreshToken = hashParams.get("refresh_token");
          }

          // Fallback: check query params
          if (!accessToken) {
            const tokenMatch = url.match(/access_token=([^&#]+)/);
            const refreshMatch = url.match(/refresh_token=([^&#]+)/);
            accessToken = tokenMatch ? tokenMatch[1] : null;
            refreshToken = refreshMatch ? refreshMatch[1] : null;
          }

          console.log("Tokens found:", !!accessToken, !!refreshToken);

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session:", error);
            } else {
              console.log("Session set successfully from callback route!");
            }
          }
        }

        // Redirect to home after processing
        router.replace("/(app)");
      } catch (error) {
        console.error("Error in auth callback:", error);
        router.replace("/(auth)/sign-in");
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
      <ActivityIndicator size="large" color="#ef4444" />
      <Text style={{ marginTop: 16, color: "#666" }}>Completing sign in...</Text>
    </View>
  );
}
