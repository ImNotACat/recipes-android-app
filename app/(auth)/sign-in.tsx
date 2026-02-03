import { useState } from "react";
import { View, Text, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/providers/AuthProvider";
import { Button } from "../../src/components/Button";
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">
        {/* Logo/Branding Section */}
        <View className="items-center mb-16">
          {/* App Icon */}
          <View className="w-24 h-24 bg-primary-500 rounded-3xl items-center justify-center mb-6 shadow-lg">
            <Text className="text-white text-5xl">🍳</Text>
          </View>
          
          {/* App Name - Script style like "Foodgo" */}
          <Text className="text-4xl font-bold text-gray-900 mb-2 italic">
            Recipes
          </Text>
          <Text className="text-base text-gray-400 text-center">
            Discover your favourite recipes!
          </Text>
        </View>

        {/* Sign In Section */}
        <View className="gap-4">
          <Button
            title="Continue with Google"
            variant="outline"
            size="lg"
            icon={<GoogleIcon size={22} />}
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
            fullWidth
          />
        </View>

        {/* Terms Section */}
        <View className="mt-10">
          <Text className="text-center text-sm text-gray-400 leading-5">
            By continuing, you agree to our{" "}
            <Text className="text-primary-500 font-medium">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-primary-500 font-medium">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
