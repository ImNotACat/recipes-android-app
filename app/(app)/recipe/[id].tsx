import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { MacroWheel } from "../../../src/components/MacroWheel";
import { RecipeImage } from "../../../src/components/RecipeImage";
import { useRecipe, useDeleteRecipe } from "../../../src/hooks/useRecipes";
import { useTheme } from "../../../src/providers/ThemeProvider";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  
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
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <SafeAreaView 
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
        >
          <ActivityIndicator size="large" color={isDark ? "#EA7C69" : "#EA4335"} />
          <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF', marginTop: 12 }}>Loading recipe...</Text>
        </SafeAreaView>
      </>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView 
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
      >
        <Text className="text-4xl mb-3">😕</Text>
        <Text style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Recipe not found</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 rounded-full"
          style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
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
      <SafeAreaView 
        className="flex-1" 
        style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
        edges={["top"]}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header with back, edit, and delete buttons */}
          <View className="absolute top-4 left-4 right-4 z-10 flex-row justify-between">
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
              style={{ backgroundColor: isDark ? 'rgba(37,40,54,0.9)' : 'rgba(255,255,255,0.9)' }}
              onPress={() => router.back()}
            >
              <Text className="text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>←</Text>
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                style={{ backgroundColor: isDark ? 'rgba(37,40,54,0.9)' : 'rgba(255,255,255,0.9)' }}
                onPress={() => router.push(`/recipe/edit/${id}`)}
              >
                <Text className="text-lg">✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                style={{ backgroundColor: isDark ? 'rgba(37,40,54,0.9)' : 'rgba(255,255,255,0.9)' }}
                onPress={handleDelete}
                disabled={deleteRecipe.isPending}
              >
                {deleteRecipe.isPending ? (
                  <ActivityIndicator size="small" color={isDark ? "#EA7C69" : "#EA4335"} />
                ) : (
                  <Text className="text-lg">🗑️</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Recipe Image */}
          <RecipeImage imageUrl={recipe.imageUrl} size="large" isDark={isDark} />

          {/* Content */}
          <View 
            className="px-6 py-6"
            style={{ backgroundColor: isDark ? '#1F1D2B' : '#F9FAFB' }}
          >
            {/* Title */}
            <Text 
              className="text-2xl font-bold mb-2"
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            >
              {recipe.name}
            </Text>
            
            {/* Servings, Multiplier & Keep Awake */}
            <View className="flex-row gap-3 mb-6">
              {/* Servings Display */}
              <View 
                className="flex-1 rounded-2xl p-4 shadow-md justify-center"
                style={{ backgroundColor: isDark ? '#252836' : 'white' }}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-2">🍽️</Text>
                  <Text>
                    <Text 
                      className="font-bold text-xl"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >{scaledServings}</Text>
                    <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}> servings</Text>
                  </Text>
                </View>
                {multiplier > 1 && (
                  <Text 
                    className="text-xs text-center mt-1"
                    style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
                  >
                    (originally {originalServings})
                  </Text>
                )}
              </View>

              {/* Multiplier */}
              <View 
                className="rounded-2xl p-4 shadow-md"
                style={{ backgroundColor: isDark ? '#252836' : 'white' }}
              >
                <Text 
                  className="text-xs mb-2 text-center"
                  style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
                >Multiply</Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDark ? '#393C49' : '#F3F4F6' }}
                    onPress={() => setMultiplier(Math.max(1, multiplier - 1))}
                  >
                    <Text 
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#ABBBC2' : '#4B5563' }}
                    >−</Text>
                  </TouchableOpacity>
                  <Text 
                    className="text-lg font-bold w-8 text-center"
                    style={{ color: isDark ? '#EA7C69' : '#EA4335' }}
                  >
                    {multiplier}x
                  </Text>
                  <TouchableOpacity
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDark ? '#393C49' : '#F3F4F6' }}
                    onPress={() => setMultiplier(multiplier + 1)}
                  >
                    <Text 
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#ABBBC2' : '#4B5563' }}
                    >+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Keep Screen On Toggle */}
              <TouchableOpacity 
                className="rounded-2xl p-4 items-center justify-center shadow-md"
                style={{ 
                  backgroundColor: isDark ? '#252836' : 'white',
                  borderWidth: keepAwake ? 2 : 0,
                  borderColor: isDark ? '#EA7C69' : '#EA4335',
                }}
                onPress={() => setKeepAwake(!keepAwake)}
              >
                <Text className="text-lg mb-1">{keepAwake ? '☀️' : '🌙'}</Text>
                <Text 
                  className="text-xs font-medium"
                  style={{ color: keepAwake ? (isDark ? '#EA7C69' : '#EA4335') : (isDark ? '#ABBBC2' : '#9CA3AF') }}
                >
                  {keepAwake ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-6">
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  className="px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: isDark ? '#252836' : '#FEF2F2',
                    borderWidth: 1,
                    borderColor: isDark ? '#393C49' : '#FEE2E2',
                  }}
                >
                  <Text 
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#EA7C69' : '#EA4335' }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            {/* Nutrition & Time Row */}
            <View className="flex-row gap-3 mb-6">
              {/* Macro Wheel - takes ~60% */}
              <View 
                className="flex-[3] rounded-2xl p-4 shadow-md"
                style={{ backgroundColor: isDark ? '#252836' : 'white' }}
              >
                <Text 
                  className="text-base font-semibold mb-3"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                >
                  Nutrition <Text className="text-xs font-normal" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>(per serving)</Text>
                </Text>
                <MacroWheel
                  macros={recipe.macros}
                  size={100}
                  showLegend={true}
                  isDark={isDark}
                />
              </View>

              {/* Prep/Cook Time - takes ~40% */}
              <View className="flex-[2] gap-3">
                {recipe.prepTime ? (
                  <View 
                    className="flex-1 rounded-xl p-3 items-center justify-center shadow-md"
                    style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                  >
                    <Text className="text-xl mb-1">⏱️</Text>
                    <Text className="text-xs" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Prep</Text>
                    <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                      {recipe.prepTime}m
                    </Text>
                  </View>
                ) : null}
                {recipe.cookTime !== undefined && recipe.cookTime > 0 ? (
                  <View 
                    className="flex-1 rounded-xl p-3 items-center justify-center shadow-md"
                    style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                  >
                    <Text className="text-xl mb-1">🍳</Text>
                    <Text className="text-xs" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Cook</Text>
                    <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                      {recipe.cookTime}m
                    </Text>
                  </View>
                ) : null}
                {!recipe.prepTime && (!recipe.cookTime || recipe.cookTime === 0) && (
                  <View 
                    className="flex-1 rounded-xl p-3 items-center justify-center shadow-md"
                    style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                  >
                    <Text className="text-xl mb-1">⏱️</Text>
                    <Text className="text-xs" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>No time</Text>
                    <Text className="font-semibold" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>—</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Ingredients */}
            <View className="mb-6">
              <Text 
                className="text-lg font-semibold mb-3"
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              >
                Ingredients {multiplier !== 1 && <Text className="text-sm font-normal" style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}>({multiplier}x)</Text>}
              </Text>
              <View 
                className="rounded-2xl overflow-hidden shadow-md"
                style={{ backgroundColor: isDark ? '#252836' : 'white' }}
              >
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between px-4 py-3"
                    style={{ 
                      borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                      borderColor: isDark ? '#393C49' : '#F3F4F6',
                    }}
                  >
                    <Text className="flex-1" style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}>
                      {ingredient.name}
                    </Text>
                    <Text 
                      className={multiplier !== 1 ? "font-medium" : ""}
                      style={{ color: multiplier !== 1 ? '#F97316' : (isDark ? '#ABBBC2' : '#6B7280') }}
                    >
                      {formatAmount(ingredient.amount)} {ingredient.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Instructions */}
            {recipe.description && (
              <View className="mb-6">
                <Text 
                  className="text-lg font-semibold mb-3"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                >
                  Instructions
                </Text>
                <View 
                  className="rounded-2xl p-4 shadow-md"
                  style={{ backgroundColor: isDark ? '#252836' : 'white' }}
                >
                  <Text 
                    className="leading-6"
                    style={{ color: isDark ? '#ABBBC2' : '#374151' }}
                  >
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
