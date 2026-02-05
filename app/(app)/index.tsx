import { useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, Modal, Pressable, Image, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useSession } from "../../src/hooks/useSession";
import { useTheme } from "../../src/providers/ThemeProvider";
import { MacroBar } from "../../src/components/MacroBar";
import { RecipeImage } from "../../src/components/RecipeImage";
import { SharedIcon } from "../../src/components/SharedIcon";
import { useRecipes, useTags } from "../../src/hooks/useRecipes";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useSession();
  const { isDark, theme, setTheme } = useTheme();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Fetch recipes and tags from database
  const { data: recipes, isLoading, error, refetch, isRefetching } = useRecipes();
  const { data: tags = [] } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCalorieRanges, setSelectedCalorieRanges] = useState<number[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

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
      <SafeAreaView 
        className="flex-1"
        style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerClassName="pb-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[isDark ? "#EA7C69" : "#EA4335"]}
              tintColor={isDark ? "#EA7C69" : "#EA4335"}
            />
          }
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text 
                  style={{ 
                    fontFamily: 'Lobster_400Regular', 
                    fontSize: 32,
                    color: isDark ? '#EA7C69' : '#EA4335'
                  }}
                >
                  Plateful
                </Text>
                <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF', marginTop: 4 }}>
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
                className="flex-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onPress={() => setShowProfileMenu(false)}
              >
                <View 
                  className="absolute right-6 top-16 rounded-2xl shadow-lg overflow-hidden min-w-[180px]"
                  style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                >
                  {/* User Info */}
                  <View 
                    className="p-4"
                    style={{ borderBottomWidth: 1, borderColor: isDark ? '#393C49' : '#F3F4F6' }}
                  >
                    <Text 
                      className="font-semibold" 
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                      numberOfLines={1}
                    >
                      {user?.user_metadata?.full_name || "User"}
                    </Text>
                    <Text 
                      className="text-sm" 
                      style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
                      numberOfLines={1}
                    >
                      {user?.email}
                    </Text>
                  </View>
                  
                  {/* Menu Items */}
                  <TouchableOpacity 
                    className="flex-row items-center px-4 py-3"
                    style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                    onPress={handleSettings}
                  >
                    <Text className="text-lg mr-3">⚙️</Text>
                    <Text style={{ color: isDark ? '#ABBBC2' : '#374151' }}>Settings</Text>
                  </TouchableOpacity>
                  
                  {/* Dark Mode Toggle */}
                  <TouchableOpacity
                    className="flex-row items-center justify-between px-4 py-3"
                    style={{ 
                      backgroundColor: isDark ? '#252836' : 'white',
                      borderTopWidth: 1, 
                      borderColor: isDark ? '#393C49' : '#F3F4F6' 
                    }}
                    activeOpacity={0.8}
                    onPress={() => setTheme(isDark ? 'light' : 'dark')}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-3">{isDark ? '🌙' : '☀️'}</Text>
                      <Text style={{ color: isDark ? '#ABBBC2' : '#374151' }}>Dark Mode</Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: isDark ? '#EA7C69' : '#F3F4F6',
                      }}
                    >
                      <Text 
                        className="text-xs font-medium"
                        style={{ color: isDark ? '#FFFFFF' : '#6B7280' }}
                      >
                        {isDark ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="flex-row items-center px-4 py-3"
                    style={{ 
                      backgroundColor: isDark ? '#252836' : 'white',
                      borderTopWidth: 1, 
                      borderColor: isDark ? '#393C49' : '#F3F4F6' 
                    }}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <Text className="text-lg mr-3">🚪</Text>
                    <Text style={{ color: isDark ? '#EA7C69' : '#EA4335' }}>
                      {isSigningOut ? "Signing out..." : "Log out"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* Search Bar & Add Button */}
            <View className="mt-6 flex-row items-center gap-3">
              <View 
                className="flex-1 flex-row items-center rounded-full px-4 py-3"
                style={{ 
                  backgroundColor: isDark ? '#252836' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#393C49' : '#F3F4F6'
                }}
              >
                <Text className="mr-2" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>🔍</Text>
                <TextInput
                  className="flex-1"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                  placeholder="Search recipes..."
                  placeholderTextColor={isDark ? '#ABBBC2' : '#9CA3AF'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Text className="text-lg" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
                onPress={() => setShowAddMenu(true)}
              >
                <Text className="text-white text-2xl font-light">+</Text>
              </TouchableOpacity>
            </View>

            {/* Add Recipe Menu Modal */}
            <Modal
              visible={showAddMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowAddMenu(false)}
            >
              <Pressable 
                className="flex-1 justify-end"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onPress={() => setShowAddMenu(false)}
              >
                <Pressable 
                  onPress={(e) => e.stopPropagation()}
                >
                  <View 
                    className="rounded-t-3xl px-6 pb-8 pt-4"
                    style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                  >
                    <View 
                      className="w-12 h-1 rounded-full self-center mb-4"
                      style={{ backgroundColor: isDark ? '#393C49' : '#D1D5DB' }}
                    />
                    <Text 
                      className="text-lg font-semibold text-center mb-4"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >
                      Add Recipe
                    </Text>
                    
                    <TouchableOpacity
                      className="rounded-xl py-4 px-4 mb-3 flex-row items-center"
                      style={{ backgroundColor: isDark ? '#1F1D2B' : '#F9FAFB' }}
                      onPress={() => {
                        setShowAddMenu(false);
                        router.push("/recipe/add");
                      }}
                    >
                      <Text className="text-2xl mr-3">✏️</Text>
                      <View>
                        <Text 
                          className="font-medium"
                          style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                        >
                          Add Manually
                        </Text>
                        <Text 
                          className="text-sm"
                          style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}
                        >
                          Enter recipe details yourself
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="rounded-xl py-4 px-4 mb-3 flex-row items-center"
                      style={{ backgroundColor: isDark ? '#1F1D2B' : '#F9FAFB' }}
                      onPress={() => {
                        setShowAddMenu(false);
                        router.push("/recipe/import");
                      }}
                    >
                      <Text className="text-2xl mr-3">🌐</Text>
                      <View>
                        <Text 
                          className="font-medium"
                          style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                        >
                          Import from URL
                        </Text>
                        <Text 
                          className="text-sm"
                          style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}
                        >
                          Paste a recipe link to auto-fill
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="py-4 px-4"
                      onPress={() => setShowAddMenu(false)}
                    >
                      <Text 
                        className="font-medium text-center"
                        style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          </View>

          {/* Main Category Pills (fixed) */}
          <View className="px-6 mb-3">
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity 
                className="px-3 py-2 rounded-full"
                style={{
                  backgroundColor: selectedTags.length === 0 
                    ? (isDark ? '#EA7C69' : '#EA4335')
                    : (isDark ? '#252836' : '#F9FAFB'),
                  borderWidth: selectedTags.length === 0 ? 0 : 1,
                  borderColor: isDark ? '#393C49' : '#E5E7EB',
                }}
                onPress={clearAllTags}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ 
                    color: selectedTags.length === 0 
                      ? '#FFFFFF' 
                      : (isDark ? '#ABBBC2' : '#374151')
                  }}
                >All</Text>
              </TouchableOpacity>
              {["Breakfast", "Lunch", "Snack", "Dinner", "GF"].map((category) => {
                const isSelected = selectedTags.some((t) => t.toLowerCase() === category.toLowerCase());
                return (
                  <TouchableOpacity 
                    key={category}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: isSelected 
                        ? (isDark ? '#EA7C69' : '#EA4335')
                        : (isDark ? '#252836' : '#F9FAFB'),
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: isDark ? '#393C49' : '#E5E7EB',
                    }}
                    onPress={() => toggleTag(category)}
                  >
                    <Text 
                      className="text-sm font-medium"
                      style={{ 
                        color: isSelected 
                          ? '#FFFFFF' 
                          : (isDark ? '#ABBBC2' : '#374151')
                      }}
                    >{category}</Text>
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
                      className="px-4 py-1.5 rounded-full"
                      style={{
                        backgroundColor: isSelected 
                          ? (isDark ? '#EA7C69' : '#EA4335')
                          : (isDark ? '#252836' : '#F9FAFB'),
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isDark ? '#393C49' : '#E5E7EB',
                      }}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text 
                        className="text-sm font-medium"
                        style={{ 
                          color: isSelected 
                            ? '#FFFFFF' 
                            : (isDark ? '#ABBBC2' : '#374151')
                        }}
                      >{tag}</Text>
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
            {calorieRanges.map((range) => {
              const isSelected = selectedCalorieRanges.includes(range);
              return (
                <TouchableOpacity 
                  key={range}
                  className="px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected 
                      ? '#F97316'
                      : (isDark ? '#252836' : '#F9FAFB'),
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: isDark ? '#393C49' : '#E5E7EB',
                  }}
                  onPress={() => toggleCalorieRange(range)}
                >
                  <Text 
                    className="text-sm font-medium"
                    style={{ 
                      color: isSelected 
                        ? '#FFFFFF' 
                        : (isDark ? '#ABBBC2' : '#4B5563')
                    }}
                  >{range} cal</Text>
                </TouchableOpacity>
              );
            })}
            {selectedCalorieRanges.length > 0 && (
              <TouchableOpacity 
                className="px-3 py-1.5"
                onPress={() => setSelectedCalorieRanges([])}
              >
                <Text className="text-sm" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Recipe Cards */}
          <View className="w-full">
            <View className="px-6">
              <View className="w-full mx-auto max-w-5xl">
                {isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color={isDark ? "#EA7C69" : "#EA4335"} />
                <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF', marginTop: 12 }}>Loading recipes...</Text>
              </View>
            ) : error ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">😕</Text>
                <Text style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Failed to load recipes</Text>
                <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }} className="text-sm mt-1">Please try again later</Text>
              </View>
            ) : filteredRecipes && filteredRecipes.length > 0 ? (
                  <View className="flex-row flex-wrap justify-between">
                    {filteredRecipes.map((recipe) => (
                      <TouchableOpacity
                        key={recipe.id}
                        className="w-[48%] md:w-[32%] lg:w-[23%] rounded-2xl mb-4 overflow-hidden active:opacity-80"
                    style={{ 
                      backgroundColor: isDark ? '#252836' : 'white',
                      shadowColor: isDark ? '#000' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <View className="relative">
                      <RecipeImage imageUrl={recipe.imageUrl} size="small" isDark={isDark} />
                      {(recipe.prepTime || recipe.cookTime) && (
                        <View 
                          className="absolute top-2 left-2 rounded-full px-2 py-1 flex-row items-center"
                          style={{ backgroundColor: isDark ? 'rgba(37,40,54,0.9)' : 'rgba(255,255,255,0.8)' }}
                        >
                          <Text style={{ color: isDark ? '#ABBBC2' : '#4B5563' }} className="text-xs">⏱️</Text>
                          <Text 
                            className="text-xs font-medium ml-0.5"
                            style={{ color: isDark ? '#FFFFFF' : '#374151' }}
                          >
                            {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                          </Text>
                        </View>
                      )}
                      {recipe.householdId && (
                        <View 
                          className="absolute top-2 right-2 rounded-full p-1.5"
                          style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                        >
                          <SharedIcon size={14} color={isDark ? "#EA7C69" : "#EA4335"} />
                        </View>
                      )}
                    </View>
                    <View className="p-3">
                      <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{recipe.name}</Text>
                      {recipe.tags.length > 0 ? (
                        <View className="flex-row flex-wrap gap-1 mb-2 mt-1">
                          {recipe.tags.map((tag, index) => (
                            <View 
                              key={index}
                              className="px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: isDark ? '#393C49' : '#F3F4F6' }}
                            >
                              <Text className="text-xs" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-sm mb-2" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>Uncategorized</Text>
                      )}
                      <MacroBar 
                        macros={recipe.macros}
                        height={4}
                        labelPosition="below"
                        isDark={isDark}
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
                    <Text className="font-semibold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>No results for "{searchQuery}"</Text>
                    <Text className="text-center mt-1" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>
                      Try a different search term
                    </Text>
                  </>
                ) : selectedTags.length > 0 || selectedCalorieRanges.length > 0 ? (
                  <>
                    <Text className="font-semibold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>No matching recipes</Text>
                    <Text className="text-center mt-1 px-8" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>
                      {selectedTags.length > 0 && selectedCalorieRanges.length > 0
                        ? `No recipes matching selected tags and calorie range`
                        : selectedTags.length > 0
                        ? `No recipes found with selected tags`
                        : "No recipes in the selected calorie range"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-semibold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>No recipes yet</Text>
                    <Text className="text-center mt-1" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>
                      Tap the + button to add your first recipe!
                    </Text>
                  </>
                )}
              </View>
            )}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
