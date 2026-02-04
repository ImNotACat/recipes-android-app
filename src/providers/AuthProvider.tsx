import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import { queryClient } from "../lib/queryClient";
import { Platform } from "react-native";

// Required for OAuth to work properly on mobile
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Invalidate all queries when auth state changes
      // This ensures fresh data is fetched for the new user
      if (_event === "SIGNED_IN" || _event === "SIGNED_OUT") {
        queryClient.invalidateQueries();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Handle web and native flows separately.
      if (Platform.OS === "web") {
        // Use a simple web redirect flow: build a redirect URI to our app
        // and ask Supabase for the OAuth URL, then navigate there.
        const redirectUri = `${window.location.origin}/(auth)/callback`;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUri,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }

        return;
      }

      // Native (Expo) flow: Use WebBrowser auth session and handle tokens returned
      // via the auth session callback.
      // Use the app deep link for redirect handling on native
      const redirectUri = Linking.createURL("auth/callback");

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
          showInRecents: true,
        });

        if (result.type === "success" && result.url) {
          const url = result.url;

          // Try to extract tokens from hash fragment first
          if (url.includes("#")) {
            const hashFragment = url.split("#")[1];
            const hashParams = new URLSearchParams(hashFragment);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) throw sessionError;
              return;
            }
          }

          // Fallback: try query params or alternate parsing
          try {
            const urlObj = new URL(url);
            const accessToken = urlObj.searchParams.get("access_token");
            const refreshToken = urlObj.searchParams.get("refresh_token");

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          } catch (urlError) {
            const tokenMatch = url.match(/access_token=([^&]+)/);
            const refreshMatch = url.match(/refresh_token=([^&]+)/);

            if (tokenMatch && refreshMatch) {
              await supabase.auth.setSession({
                access_token: tokenMatch[1],
                refresh_token: refreshMatch[1],
              });
            }
          }
        } else if (result.type === "cancel" || result.type === "dismiss") {
          console.log("User cancelled or dismissed auth");
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all cached data on sign out
      queryClient.clear();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isLoading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
