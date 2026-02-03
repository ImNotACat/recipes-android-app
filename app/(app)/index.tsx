import { useState } from "react";
import { View, Text, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useSession } from "../../src/hooks/useSession";
import { Button } from "../../src/components/Button";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
          headerRight: () => (
            <Button
              title="Sign Out"
              variant="secondary"
              onPress={handleSignOut}
              isLoading={isSigningOut}
              className="py-2 px-4"
            />
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <ScrollView className="flex-1" contentContainerClassName="p-6">
          {/* Welcome Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              {user?.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  className="w-16 h-16 rounded-full mr-4"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mr-4">
                  <Text className="text-2xl">👤</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  Welcome back!
                </Text>
                <Text className="text-gray-500" numberOfLines={1}>
                  {user?.user_metadata?.full_name || user?.email || "User"}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
              <Text className="text-3xl mb-1">📖</Text>
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-sm text-gray-500">Saved Recipes</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
              <Text className="text-3xl mb-1">⭐</Text>
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-sm text-gray-500">Favorites</Text>
            </View>
          </View>

          {/* Getting Started Card */}
          <View className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              🎉 You're all set up!
            </Text>
            <Text className="text-gray-600 mb-4">
              Your authentication is working. You can now start building your
              recipe features:
            </Text>
            <View className="gap-2">
              <Text className="text-gray-700">• Add recipe browsing</Text>
              <Text className="text-gray-700">• Create recipe cards</Text>
              <Text className="text-gray-700">• Build search functionality</Text>
              <Text className="text-gray-700">• Save favorite recipes</Text>
            </View>
          </View>

          {/* Debug Info (helpful during development) */}
          <View className="mt-6 bg-gray-100 rounded-xl p-4">
            <Text className="text-xs font-mono text-gray-500 mb-2">
              Debug Info:
            </Text>
            <Text className="text-xs font-mono text-gray-400">
              User ID: {user?.id?.slice(0, 8)}...
            </Text>
            <Text className="text-xs font-mono text-gray-400">
              Provider: {user?.app_metadata?.provider || "unknown"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
