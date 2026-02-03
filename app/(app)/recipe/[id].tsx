import { useState, useEffect } from "react";
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
  
  // Scaling state
  const [scaledServings, setScaledServings] = useState<number>(1);
  
  // Initialize scaled servings when recipe loads
  useEffect(() => {
    if (recipe?.servings) {
      setScaledServings(recipe.servings);
    }
  }, [recipe?.servings]);
  
  // Calculate scale factor
  const originalServings = recipe?.servings || 1;
  const scaleFactor = scaledServings / originalServings;
  
  // Helper to format scaled amounts nicely
  const formatAmount = (amount: number): string => {
    const scaled = amount * scaleFactor;
    if (scaled === Math.floor(scaled)) {
      return scaled.toString();
    }
    return scaled.toFixed(1).replace(/\.0$/, '');
  };

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
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {recipe.name}
            </Text>
            
            {/* Servings Adjuster */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">🍽️</Text>
                <Text className="text-gray-700 font-medium">Servings</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="w-8 h-8 bg-white rounded-full items-center justify-center border border-gray-200"
                  onPress={() => setScaledServings(Math.max(1, scaledServings - 1))}
                >
                  <Text className="text-gray-600 text-lg font-medium">−</Text>
                </TouchableOpacity>
                <Text className="text-xl font-semibold text-gray-900 w-8 text-center">
                  {scaledServings}
                </Text>
                <TouchableOpacity
                  className="w-8 h-8 bg-white rounded-full items-center justify-center border border-gray-200"
                  onPress={() => setScaledServings(scaledServings + 1)}
                >
                  <Text className="text-gray-600 text-lg font-medium">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Scale indicator */}
            {scaleFactor !== 1 && (
              <View className="flex-row items-center justify-center mb-4">
                <View className="bg-orange-100 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 text-sm">
                    Scaled from {originalServings} to {scaledServings} servings ({scaleFactor.toFixed(1)}x)
                  </Text>
                </View>
              </View>
            )}

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
                Nutrition Facts <Text className="text-sm font-normal text-gray-400">(per serving)</Text>
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
                Ingredients {scaleFactor !== 1 && <Text className="text-sm font-normal text-gray-400">(scaled)</Text>}
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
                    <Text className={`${scaleFactor !== 1 ? "text-orange-600 font-medium" : "text-gray-500"}`}>
                      {formatAmount(ingredient.amount)} {ingredient.unit}
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
