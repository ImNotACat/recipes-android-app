import { useState } from "react";
import { View, Text, Alert } from "react-native";
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
      <View className="flex-1 px-6 justify-center">
        {/* Logo/Branding Section */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-4xl">🍳</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            RecipesApp
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Discover and save your favorite recipes
          </Text>
        </View>

        {/* Sign In Section */}
        <View className="gap-4">
          <Button
            title="Continue with Google"
            variant="outline"
            icon={<GoogleIcon size={20} />}
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
          />
        </View>

        {/* Terms Section */}
        <View className="mt-8">
          <Text className="text-center text-sm text-gray-400">
            By continuing, you agree to our{" "}
            <Text className="text-primary-500">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-primary-500">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
