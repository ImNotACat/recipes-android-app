import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MacroWheel } from "../../../src/components/MacroWheel";
import { RecipeImage } from "../../../src/components/RecipeImage";
import { useRecipe, useDeleteRecipe } from "../../../src/hooks/useRecipes";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Fetch recipe from database
  const { data: recipe, isLoading, error } = useRecipe(id || "");
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = () => {
    if (!recipe) return;
    
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(recipe.id);
              router.back();
            } catch (err) {
              console.error("Error deleting recipe:", err);
              Alert.alert("Error", "Failed to delete recipe. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EA4335" />
        <Text className="text-gray-400 mt-3">Loading recipe...</Text>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-4xl mb-3">😕</Text>
        <Text className="text-gray-500">Recipe not found</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-primary-500 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header with back, edit, and delete buttons */}
          <View className="absolute top-4 left-4 right-4 z-10 flex-row justify-between">
            <TouchableOpacity
              className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
              onPress={() => router.back()}
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
                onPress={() => router.push(`/recipe/edit/${id}`)}
              >
                <Text className="text-lg">✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
                onPress={handleDelete}
                disabled={deleteRecipe.isPending}
              >
                {deleteRecipe.isPending ? (
                  <ActivityIndicator size="small" color="#EA4335" />
                ) : (
                  <Text className="text-lg">🗑️</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Recipe Image */}
          <RecipeImage imageUrl={recipe.imageUrl} size="large" />

          {/* Content */}
          <View className="px-6 py-6">
            {/* Title & Servings */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-bold text-gray-900 flex-1">
                {recipe.name}
              </Text>
              {recipe.servings && (
                <View className="flex-row items-center ml-3">
                  <Text className="text-lg mr-1">🍽️</Text>
                  <Text className="text-gray-500">{recipe.servings} servings</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-6">
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-primary-50 px-3 py-1 rounded-full border border-primary-100"
                >
                  <Text className="text-primary-500 text-sm font-medium">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            {/* Macro Wheel */}
            <View className="bg-gray-50 rounded-2xl p-5 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Nutrition Facts
              </Text>
              <MacroWheel
                macros={recipe.macros}
                size={120}
                showLegend={true}
              />
            </View>

            {/* Prep/Cook Time if available */}
            {(recipe.prepTime || recipe.cookTime) && (
              <View className="flex-row gap-4 mb-6">
                {recipe.prepTime && (
                  <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
                    <Text className="text-2xl mb-1">⏱️</Text>
                    <Text className="text-gray-500 text-sm">Prep Time</Text>
                    <Text className="text-gray-900 font-semibold">
                      {recipe.prepTime} min
                    </Text>
                  </View>
                )}
                {recipe.cookTime !== undefined && recipe.cookTime > 0 && (
                  <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
                    <Text className="text-2xl mb-1">🍳</Text>
                    <Text className="text-gray-500 text-sm">Cook Time</Text>
                    <Text className="text-gray-900 font-semibold">
                      {recipe.cookTime} min
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Ingredients */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Ingredients
              </Text>
              <View className="bg-gray-50 rounded-2xl overflow-hidden">
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      index < recipe.ingredients.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <Text className="text-gray-800 flex-1">
                      {ingredient.name}
                    </Text>
                    <Text className="text-gray-500">
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Instructions */}
            {recipe.description && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Instructions
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4">
                  <Text className="text-gray-700 leading-6">
                    {recipe.description}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
