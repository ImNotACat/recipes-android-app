import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { MacroWheel } from "../../../src/components/MacroWheel";
import { RecipeImage } from "../../../src/components/RecipeImage";
import { useRecipe, useDeleteRecipe } from "../../../src/hooks/useRecipes";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Fetch recipe from database
  const { data: recipe, isLoading, error } = useRecipe(id || "");
  const deleteRecipe = useDeleteRecipe();
  
  // Multiplier state (1x, 2x, 3x, etc.)
  const [multiplier, setMultiplier] = useState<number>(1);
  
  // Keep screen awake state
  const [keepAwake, setKeepAwake] = useState(false);
  
  // Handle keep awake toggle
  useEffect(() => {
    if (keepAwake) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    
    // Cleanup when leaving the screen
    return () => {
      deactivateKeepAwake();
    };
  }, [keepAwake]);
  
  // Calculate scaled values
  const originalServings = recipe?.servings || 1;
  const scaledServings = originalServings * multiplier;
  
  // Helper to format scaled amounts nicely
  const formatAmount = (amount: number): string => {
    const scaled = amount * multiplier;
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
          <View className="px-6 py-6 bg-gray-50">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {recipe.name}
            </Text>
            
            {/* Servings, Multiplier & Keep Awake */}
            <View className="flex-row gap-3 mb-6">
              {/* Servings Display */}
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-md justify-center">
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-2">🍽️</Text>
                  <Text className="text-gray-700">
                    <Text className="font-bold text-gray-900 text-xl">{scaledServings}</Text>
                    <Text className="text-gray-400"> servings</Text>
                  </Text>
                </View>
                {multiplier > 1 && (
                  <Text className="text-xs text-gray-400 text-center mt-1">
                    (originally {originalServings})
                  </Text>
                )}
              </View>

              {/* Multiplier */}
              <View className="bg-white rounded-2xl p-4 shadow-md">
                <Text className="text-xs text-gray-400 mb-2 text-center">Multiply</Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="w-7 h-7 bg-gray-100 rounded-full items-center justify-center"
                    onPress={() => setMultiplier(Math.max(1, multiplier - 1))}
                  >
                    <Text className="text-gray-600 text-sm font-medium">−</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-bold text-primary-500 w-8 text-center">
                    {multiplier}x
                  </Text>
                  <TouchableOpacity
                    className="w-7 h-7 bg-gray-100 rounded-full items-center justify-center"
                    onPress={() => setMultiplier(multiplier + 1)}
                  >
                    <Text className="text-gray-600 text-sm font-medium">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Keep Screen On Toggle */}
              <TouchableOpacity 
                className={`bg-white rounded-2xl p-4 items-center justify-center shadow-md ${keepAwake ? 'border-2 border-primary-500' : ''}`}
                onPress={() => setKeepAwake(!keepAwake)}
              >
                <Text className="text-lg mb-1">{keepAwake ? '☀️' : '🌙'}</Text>
                <Text className={`text-xs font-medium ${keepAwake ? 'text-primary-500' : 'text-gray-400'}`}>
                  {keepAwake ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
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

            {/* Nutrition & Time Row */}
            <View className="flex-row gap-3 mb-6">
              {/* Macro Wheel - takes ~60% */}
              <View className="flex-[3] bg-white rounded-2xl p-4 shadow-md">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Nutrition <Text className="text-xs font-normal text-gray-400">(per serving)</Text>
                </Text>
                <MacroWheel
                  macros={recipe.macros}
                  size={100}
                  showLegend={true}
                />
              </View>

              {/* Prep/Cook Time - takes ~40% */}
              <View className="flex-[2] gap-3">
                {recipe.prepTime ? (
                  <View className="flex-1 bg-white rounded-xl p-3 items-center justify-center shadow-md">
                    <Text className="text-xl mb-1">⏱️</Text>
                    <Text className="text-gray-500 text-xs">Prep</Text>
                    <Text className="text-gray-900 font-semibold">
                      {recipe.prepTime}m
                    </Text>
                  </View>
                ) : null}
                {recipe.cookTime !== undefined && recipe.cookTime > 0 ? (
                  <View className="flex-1 bg-white rounded-xl p-3 items-center justify-center shadow-md">
                    <Text className="text-xl mb-1">🍳</Text>
                    <Text className="text-gray-500 text-xs">Cook</Text>
                    <Text className="text-gray-900 font-semibold">
                      {recipe.cookTime}m
                    </Text>
                  </View>
                ) : null}
                {!recipe.prepTime && (!recipe.cookTime || recipe.cookTime === 0) && (
                  <View className="flex-1 bg-white rounded-xl p-3 items-center justify-center shadow-md">
                    <Text className="text-xl mb-1">⏱️</Text>
                    <Text className="text-gray-400 text-xs">No time</Text>
                    <Text className="text-gray-400 font-semibold">—</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Ingredients */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Ingredients {multiplier !== 1 && <Text className="text-sm font-normal text-gray-400">({multiplier}x)</Text>}
              </Text>
              <View className="bg-white rounded-2xl overflow-hidden shadow-md">
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
                    <Text className={`${multiplier !== 1 ? "text-orange-600 font-medium" : "text-gray-500"}`}>
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
                <View className="bg-white rounded-2xl p-4 shadow-md">
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
