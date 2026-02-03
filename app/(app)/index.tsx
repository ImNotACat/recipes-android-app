import { useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, Modal, Pressable, Image, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useSession } from "../../src/hooks/useSession";
import { MacroBar } from "../../src/components/MacroBar";
import { RecipeImage } from "../../src/components/RecipeImage";
import { useRecipes, useTags } from "../../src/hooks/useRecipes";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Fetch recipes and tags from database
  const { data: recipes, isLoading, error, refetch, isRefetching } = useRecipes();
  const { data: tags = [] } = useTags();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter recipes by search and selected tag
  const filteredRecipes = recipes?.filter((recipe) => {
    // Tag filter
    if (selectedTag && !recipe.tags.includes(selectedTag)) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesName = recipe.name.toLowerCase().includes(query);
      const matchesTags = recipe.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesIngredients = recipe.ingredients.some((ing) => 
        ing.name.toLowerCase().includes(query)
      );
      return matchesName || matchesTags || matchesIngredients;
    }
    
    return true;
  });

  const handleSignOut = async () => {
    setShowProfileMenu(false);
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

  const handleSettings = () => {
    setShowProfileMenu(false);
    // TODO: Navigate to settings screen
    Alert.alert("Settings", "Settings page coming soon!");
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView 
          className="flex-1" 
          contentContainerClassName="pb-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={["#EA4335"]}
              tintColor="#EA4335"
            />
          }
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-gray-900 italic">
                  Recipes
                </Text>
                <Text className="text-gray-400 mt-1">
                  Hello, {firstName}!
                </Text>
              </View>
              
              {/* Profile Avatar */}
              <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    source={{ uri: user.user_metadata.avatar_url }}
                    className="w-12 h-12 rounded-2xl"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-2xl bg-primary-100 items-center justify-center">
                    <Text className="text-lg">👤</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Profile Menu Modal */}
            <Modal
              visible={showProfileMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowProfileMenu(false)}
            >
              <Pressable 
                className="flex-1 bg-black/30"
                onPress={() => setShowProfileMenu(false)}
              >
                <View className="absolute right-6 top-16 bg-white rounded-2xl shadow-lg overflow-hidden min-w-[180px]">
                  {/* User Info */}
                  <View className="p-4 border-b border-gray-100">
                    <Text className="font-semibold text-gray-900" numberOfLines={1}>
                      {user?.user_metadata?.full_name || "User"}
                    </Text>
                    <Text className="text-sm text-gray-400" numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>
                  
                  {/* Menu Items */}
                  <TouchableOpacity 
                    className="flex-row items-center px-4 py-3 active:bg-gray-50"
                    onPress={handleSettings}
                  >
                    <Text className="text-lg mr-3">⚙️</Text>
                    <Text className="text-gray-700">Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="flex-row items-center px-4 py-3 active:bg-gray-50 border-t border-gray-100"
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <Text className="text-lg mr-3">🚪</Text>
                    <Text className="text-primary-500">
                      {isSigningOut ? "Signing out..." : "Log out"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* Search Bar & Add Button */}
            <View className="mt-6 flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center bg-gray-50 rounded-full px-4 py-3 border border-gray-100">
                <Text className="text-gray-400 mr-2">🔍</Text>
                <TextInput
                  className="flex-1 text-gray-900"
                  placeholder="Search recipes..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Text className="text-gray-400 text-lg">✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center"
                onPress={() => router.push("/recipe/add")}
              >
                <Text className="text-white text-2xl font-light">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Pills */}
          {tags.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="px-6 mb-6"
              contentContainerClassName="gap-3"
            >
              <TouchableOpacity 
                className={`px-5 py-2 rounded-full ${
                  selectedTag === null 
                    ? "bg-primary-500" 
                    : "bg-gray-50 border border-gray-200"
                }`}
                onPress={() => setSelectedTag(null)}
              >
                <Text className={`font-medium ${
                  selectedTag === null ? "text-white" : "text-gray-700"
                }`}>All</Text>
              </TouchableOpacity>
              {tags.map((tag) => (
                <TouchableOpacity 
                  key={tag}
                  className={`px-5 py-2 rounded-full ${
                    selectedTag === tag 
                      ? "bg-primary-500" 
                      : "bg-gray-50 border border-gray-200"
                  }`}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text className={`font-medium ${
                    selectedTag === tag ? "text-white" : "text-gray-700"
                  }`}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Recipe Cards */}
          <View className="px-6">
            {isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#EA4335" />
                <Text className="text-gray-400 mt-3">Loading recipes...</Text>
              </View>
            ) : error ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">😕</Text>
                <Text className="text-gray-500">Failed to load recipes</Text>
                <Text className="text-gray-400 text-sm mt-1">Please try again later</Text>
              </View>
            ) : filteredRecipes && filteredRecipes.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {filteredRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    className="w-[48%] bg-white rounded-2xl mb-4 border border-gray-100 overflow-hidden active:opacity-80"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <RecipeImage imageUrl={recipe.imageUrl} size="small" />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-900">{recipe.name}</Text>
                      <Text className="text-gray-400 text-sm mb-2">
                        {recipe.tags[0] || "Uncategorized"}
                      </Text>
                      <MacroBar 
                        macros={recipe.macros}
                        height={4}
                        labelPosition="below"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-5xl mb-3">🍽️</Text>
                {searchQuery.trim() ? (
                  <>
                    <Text className="text-gray-900 font-semibold text-lg">No results for "{searchQuery}"</Text>
                    <Text className="text-gray-400 text-center mt-1">
                      Try a different search term
                    </Text>
                  </>
                ) : selectedTag ? (
                  <>
                    <Text className="text-gray-900 font-semibold text-lg">No "{selectedTag}" recipes</Text>
                    <Text className="text-gray-400 text-center mt-1">
                      Try selecting a different tag or add a new recipe!
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-gray-900 font-semibold text-lg">No recipes yet</Text>
                    <Text className="text-gray-400 text-center mt-1">
                      Tap the + button to add your first recipe!
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
