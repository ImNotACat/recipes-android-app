import { useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, Modal, Pressable, Image, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useSession } from "../../src/hooks/useSession";
import { MacroBar } from "../../src/components/MacroBar";
import { RecipeImage } from "../../src/components/RecipeImage";
import { SharedIcon } from "../../src/components/SharedIcon";
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCalorieRanges, setSelectedCalorieRanges] = useState<number[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // Calorie range options
  const calorieRanges = [200, 300, 400, 500, 600, 700];

  const toggleCalorieRange = (range: number) => {
    setSelectedCalorieRanges((prev) =>
      prev.includes(range)
        ? prev.filter((r) => r !== range)
        : [...prev, range]
    );
  };

  // Check if recipe calories fall within any selected range (±50 calories)
  const isInCalorieRange = (calories: number | undefined): boolean => {
    if (selectedCalorieRanges.length === 0) return true;
    if (!calories) return false;
    
    return selectedCalorieRanges.some((range) => 
      calories >= range - 50 && calories <= range + 50
    );
  };

  // Filter recipes by search, selected tags, and calorie range
  const filteredRecipes = recipes?.filter((recipe) => {
    // Tag filter - recipe must have at least one of the selected tags
    if (selectedTags.length > 0) {
      const hasMatchingTag = selectedTags.some((selectedTag) =>
        recipe.tags.some((recipeTag) => recipeTag.toLowerCase() === selectedTag.toLowerCase())
      );
      if (!hasMatchingTag) return false;
    }

    // Calorie range filter
    if (!isInCalorieRange(recipe.macros.calories)) {
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
    router.push("/settings");
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
                <Text 
                  className="text-primary-500"
                  style={{ fontFamily: 'Lobster_400Regular', fontSize: 32 }}
                >
                  Plateful
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

          {/* Main Category Pills (fixed) */}
          <View className="px-6 mb-3">
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity 
                className={`px-3 py-2 rounded-full ${
                  selectedTags.length === 0 
                    ? "bg-primary-500" 
                    : "bg-gray-50 border border-gray-200"
                }`}
                onPress={clearAllTags}
              >
                <Text className={`text-sm font-medium ${
                  selectedTags.length === 0 ? "text-white" : "text-gray-700"
                }`}>All</Text>
              </TouchableOpacity>
              {["Breakfast", "Lunch", "Snack", "Dinner", "GF"].map((category) => {
                const isSelected = selectedTags.some((t) => t.toLowerCase() === category.toLowerCase());
                return (
                  <TouchableOpacity 
                    key={category}
                    className={`px-3 py-2 rounded-full ${
                      isSelected 
                        ? "bg-primary-500" 
                        : "bg-gray-50 border border-gray-200"
                    }`}
                    onPress={() => toggleTag(category)}
                  >
                    <Text className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-700"
                    }`}>{category}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Other Tags (scrollable) */}
          {(() => {
            const mainCategories = ["Breakfast", "Lunch", "Snack", "Dinner", "GF"];
            const otherTags = tags.filter((tag) => 
              !mainCategories.some((cat) => cat.toLowerCase() === tag.toLowerCase())
            );
            
            if (otherTags.length === 0) return null;
            
            return (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="px-6 mb-3"
                contentContainerClassName="gap-2"
              >
                {otherTags.map((tag) => {
                  const isSelected = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
                  return (
                    <TouchableOpacity 
                      key={tag}
                      className={`px-4 py-1.5 rounded-full ${
                        isSelected 
                          ? "bg-primary-500" 
                          : "bg-gray-50 border border-gray-200"
                      }`}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            );
          })()}

          {/* Calorie Range Filter Pills */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-6 mb-6"
            contentContainerClassName="gap-2"
          >
            {calorieRanges.map((range) => (
              <TouchableOpacity 
                key={range}
                className={`px-4 py-1.5 rounded-full ${
                  selectedCalorieRanges.includes(range) 
                    ? "bg-orange-500" 
                    : "bg-gray-50 border border-gray-200"
                }`}
                onPress={() => toggleCalorieRange(range)}
              >
                <Text className={`text-sm font-medium ${
                  selectedCalorieRanges.includes(range) ? "text-white" : "text-gray-600"
                }`}>{range} cal</Text>
              </TouchableOpacity>
            ))}
            {selectedCalorieRanges.length > 0 && (
              <TouchableOpacity 
                className="px-3 py-1.5"
                onPress={() => setSelectedCalorieRanges([])}
              >
                <Text className="text-gray-400 text-sm">Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

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
                    className="w-[48%] bg-white rounded-2xl mb-4 shadow-md overflow-hidden active:opacity-80"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <View className="relative">
                      <RecipeImage imageUrl={recipe.imageUrl} size="small" />
                      {(recipe.prepTime || recipe.cookTime) && (
                        <View className="absolute top-2 left-2 bg-white/80 rounded-full px-2 py-1 flex-row items-center">
                          <Text className="text-gray-600 text-xs">⏱️</Text>
                          <Text className="text-gray-700 text-xs font-medium ml-0.5">
                            {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                          </Text>
                        </View>
                      )}
                      {recipe.householdId && (
                        <View className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md">
                          <SharedIcon size={14} color="#EA4335" />
                        </View>
                      )}
                    </View>
                    <View className="p-3">
                      <Text className="font-semibold text-gray-900">{recipe.name}</Text>
                      {recipe.tags.length > 0 ? (
                        <View className="flex-row flex-wrap gap-1 mb-2 mt-1">
                          {recipe.tags.map((tag, index) => (
                            <View 
                              key={index}
                              className="bg-gray-100 px-2 py-0.5 rounded-full"
                            >
                              <Text className="text-gray-500 text-xs">{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-gray-400 text-sm mb-2">Uncategorized</Text>
                      )}
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
                ) : selectedTags.length > 0 || selectedCalorieRanges.length > 0 ? (
                  <>
                    <Text className="text-gray-900 font-semibold text-lg">No matching recipes</Text>
                    <Text className="text-gray-400 text-center mt-1 px-8">
                      {selectedTags.length > 0 && selectedCalorieRanges.length > 0
                        ? `No recipes matching selected tags and calorie range`
                        : selectedTags.length > 0
                        ? `No recipes found with selected tags`
                        : "No recipes in the selected calorie range"}
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
