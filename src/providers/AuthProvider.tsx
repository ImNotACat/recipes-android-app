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
      // For Expo Go, we need special handling
      // Use the Supabase project URL as the redirect, then extract tokens
      const redirectUri = Linking.createURL("auth/callback");
      
      console.log("Redirect URI:", redirectUri);

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
        console.log("Opening auth URL...");
        
        // Open the auth URL in an auth session
        // The second parameter tells the browser what URL pattern to listen for
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
          {
            showInRecents: true,
          }
        );

        console.log("Auth result type:", result.type);

        if (result.type === "success" && result.url) {
          const url = result.url;
          console.log("Callback URL received:", url);
          
          // Try to extract tokens from hash fragment first (most common for Supabase)
          if (url.includes("#")) {
            const hashFragment = url.split("#")[1];
            const hashParams = new URLSearchParams(hashFragment);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            console.log("Found tokens in hash:", !!accessToken, !!refreshToken);

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) {
                console.error("Session error:", sessionError);
                throw sessionError;
              }
              console.log("Session set successfully!");
              return;
            }
          }
          
          // Fallback: try query params
          try {
            const urlObj = new URL(url);
            const accessToken = urlObj.searchParams.get("access_token");
            const refreshToken = urlObj.searchParams.get("refresh_token");

            if (accessToken && refreshToken) {
              console.log("Found tokens in query params");
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          } catch (urlError) {
            console.log("Could not parse URL as standard URL, trying alternate parsing");
            // Handle exp:// URLs which may not parse as standard URLs
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
