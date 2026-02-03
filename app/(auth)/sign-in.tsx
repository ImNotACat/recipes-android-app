import { useState } from "react";
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/providers/AuthProvider";
import { GoogleIcon } from "../../src/components/GoogleIcon";

export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
      Alert.alert(
        "Sign In Failed",
        "Unable to sign in with Google. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FF6B6B", "#EE4444", "#DC2626"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-8 justify-between py-12">
          {/* Top spacer */}
          <View />
          
          {/* App Name - Centered */}
          <View className="items-center">
            <Text 
              className="text-white"
              style={{ 
                fontFamily: 'Lobster_400Regular',
                fontSize: 52,
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              Plateful
            </Text>
            <Text className="text-white/70 text-base mt-2">
              Your family's recipes, together
            </Text>
          </View>

          {/* Bottom Section */}
          <View className="gap-4">
            {/* Google Sign In Button */}
            <TouchableOpacity
              className="bg-white flex-row items-center justify-center py-4 px-6 rounded-full shadow-lg"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#EA4335" />
              ) : (
                <>
                  <GoogleIcon size={22} />
                  <Text className="text-gray-700 font-semibold text-base ml-3">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-center text-sm text-white/60 leading-5 mt-4">
              By continuing, you agree to our{" "}
              <Text className="text-white/80 font-medium">Terms</Text>
              {" "}and{" "}
              <Text className="text-white/80 font-medium">Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
