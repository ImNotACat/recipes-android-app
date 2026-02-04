import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useImportRecipe, ImportedRecipe } from "../../../src/hooks/useImportRecipe";
import { useCreateRecipe, useTags } from "../../../src/hooks/useRecipes";
import { useHousehold } from "../../../src/hooks/useHousehold";
import { Ingredient, calculateCalories } from "../../../src/types/recipe";
import ConfettiCannon from "react-native-confetti-cannon";
import { Dimensions } from "react-native";

export default function ImportRecipeScreen() {
  const router = useRouter();
  const importRecipe = useImportRecipe();
  const createRecipe = useCreateRecipe();
  const { data: existingTags = [] } = useTags();
  const { data: household } = useHousehold();

  // Import state
  const [url, setUrl] = useState("");
  const [importedData, setImportedData] = useState<ImportedRecipe | null>(null);

  // Form state (editable after import)
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: 0, unit: "" },
  ]);
  const [shareWithHousehold, setShareWithHousehold] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Populate form when import completes
  useEffect(() => {
    if (importedData) {
      setName(importedData.name);
      setSelectedTags(importedData.tags);
      setPrepTime(importedData.prepTime?.toString() || "");
      setCookTime(importedData.cookTime?.toString() || "");
      setServings(importedData.servings?.toString() || "");
      setInstructions(importedData.instructions);
      setImageUrl(importedData.imageUrl);
      setCarbs(importedData.macros.carbs.toString());
      setProtein(importedData.macros.protein.toString());
      setFat(importedData.macros.fat.toString());
      setCalories(importedData.macros.calories?.toString() || "");
      setIngredients(
        importedData.ingredients.length > 0
          ? importedData.ingredients
          : [{ name: "", amount: 0, unit: "" }]
      );
    }
  }, [importedData]);

  const handleImport = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a recipe URL");
      return;
    }

    // Basic URL validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Alert.alert("Error", "Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      const result = await importRecipe.mutateAsync(url.trim());
      setImportedData(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import recipe";
      Alert.alert("Import Failed", message);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTagInput("");
    }
  };

  const autoCalculateCalories = () => {
    const calculated = calculateCalories({
      carbs: parseFloat(carbs) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
    });
    setCalories(calculated.toString());
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: 0, unit: "" }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    if (field === "amount") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a recipe name");
      return;
    }

    try {
      await createRecipe.mutateAsync({
        name: name.trim(),
        instructions: instructions.trim() || undefined,
        imageUri: imageUrl, // This is already a URL from import
        tags: selectedTags,
        macros: {
          carbs: parseFloat(carbs) || 0,
          protein: parseFloat(protein) || 0,
          fat: parseFloat(fat) || 0,
          calories: calories ? parseInt(calories) : undefined,
        },
        servings: parseInt(servings) || undefined,
        prepTime: parseInt(prepTime) || undefined,
        cookTime: parseInt(cookTime) || undefined,
        ingredients: ingredients.filter((ing) => ing.name.trim()),
        householdId: shareWithHousehold && household ? household.id : null,
      });

      setShowSuccess(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        router.back();
      }, 2500);
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    }
  };

  // URL input screen
  if (!importedData) {
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-gray-500 text-base">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">Import Recipe</Text>
              <View className="w-12" />
            </View>

            <View className="flex-1 px-6 justify-center">
              {/* Icon */}
              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-4">
                  <Text className="text-4xl">🌐</Text>
                </View>
                <Text className="text-xl font-semibold text-gray-900 text-center">
                  Import from Website
                </Text>
                <Text className="text-gray-500 text-center mt-2 px-8">
                  Paste a recipe URL and we'll automatically extract the recipe details
                </Text>
              </View>

              {/* URL Input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">Recipe URL</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-4 text-gray-900 border border-gray-100"
                  placeholder="https://example.com/recipe"
                  value={url}
                  onChangeText={setUrl}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleImport}
                />
              </View>

              {/* Import Button */}
              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  importRecipe.isPending ? "bg-gray-200" : "bg-primary-500"
                }`}
                onPress={handleImport}
                disabled={importRecipe.isPending}
              >
                {importRecipe.isPending ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#EA4335" />
                    <Text className="text-gray-500 font-semibold ml-2">
                      Extracting recipe...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">Import Recipe</Text>
                )}
              </TouchableOpacity>

              {/* Supported sites hint */}
              <Text className="text-gray-400 text-sm text-center mt-6">
                Works with most recipe websites including AllRecipes, Food Network, Tasty, and more
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </>
    );
  }

  // Review & Edit screen (after import)
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setImportedData(null)}>
              <Text className="text-gray-500 text-base">Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Review Recipe</Text>
            <TouchableOpacity onPress={handleSave} disabled={createRecipe.isPending}>
              {createRecipe.isPending ? (
                <ActivityIndicator size="small" color="#EA4335" />
              ) : (
                <Text className="text-primary-500 text-base font-semibold">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-6 py-4">
            {/* Imported Badge */}
            <View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex-row items-center">
              <Text className="text-lg mr-2">✓</Text>
              <Text className="text-green-700 flex-1">
                Recipe imported! Review and edit the details below.
              </Text>
            </View>

            {/* Image Preview */}
            {imageUrl ? (
              <View className="mb-4">
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View className="w-full h-32 bg-gray-100 rounded-2xl items-center justify-center mb-4">
                <Text className="text-gray-400">No image found</Text>
              </View>
            )}

            {/* Recipe Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Recipe Name</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                placeholder="Recipe name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Tags */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Tags</Text>

              {selectedTags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      className="bg-primary-500 px-3 py-1.5 rounded-full flex-row items-center"
                      onPress={() => toggleTag(tag)}
                    >
                      <Text className="text-white text-sm font-medium">{tag}</Text>
                      <Text className="text-white ml-1.5 text-xs">✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {existingTags.length > 0 && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-400 mb-2">Tap to add:</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {existingTags
                      .filter((tag) => !selectedTags.includes(tag))
                      .map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200"
                          onPress={() => toggleTag(tag)}
                        >
                          <Text className="text-gray-600 text-sm">{tag}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}

              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="Add new tag..."
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  placeholderTextColor="#9CA3AF"
                  onSubmitEditing={addNewTag}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  className="bg-gray-200 w-10 h-10 rounded-xl items-center justify-center"
                  onPress={addNewTag}
                >
                  <Text className="text-gray-600 text-xl">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time & Servings Row */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Prep (min)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="10"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Cook (min)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="20"
                  value={cookTime}
                  onChangeText={setCookTime}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Servings</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="2"
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Macros */}
            <Text className="text-lg font-semibold text-gray-900 mb-3 mt-2">
              Macros (per serving)
            </Text>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Carbs (g)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="0"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Protein (g)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="0"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Fat (g)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="0"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Calories */}
            <View className="flex-row gap-3 mb-6 items-end">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Calories</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                  placeholder="0"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                className="bg-gray-200 px-4 py-3 rounded-xl"
                onPress={autoCalculateCalories}
              >
                <Text className="text-gray-700 font-medium">Calculate</Text>
              </TouchableOpacity>
            </View>

            {/* Ingredients */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">Ingredients</Text>
              <TouchableOpacity
                onPress={addIngredient}
                className="bg-primary-500 w-8 h-8 rounded-full items-center justify-center"
              >
                <Text className="text-white text-xl font-light">+</Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient, index) => (
              <View key={index} className="flex-row gap-2 mb-3 items-center">
                <View className="flex-[2]">
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                    placeholder="Ingredient"
                    value={ingredient.name}
                    onChangeText={(value) => updateIngredient(index, "name", value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                    placeholder="Amt"
                    value={ingredient.amount ? ingredient.amount.toString() : ""}
                    onChangeText={(value) => updateIngredient(index, "amount", value)}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                    placeholder="Unit"
                    value={ingredient.unit}
                    onChangeText={(value) => updateIngredient(index, "unit", value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    className="w-8 h-8 items-center justify-center"
                  >
                    <Text className="text-red-500 text-xl">×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Instructions */}
            <View className="mb-4 mt-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Instructions</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100 min-h-[150px]"
                placeholder="Enter cooking instructions..."
                value={instructions}
                onChangeText={setInstructions}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Share with Household Toggle */}
            {household && (
              <TouchableOpacity
                className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mt-4 border border-gray-100"
                onPress={() => setShareWithHousehold(!shareWithHousehold)}
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-lg mr-2">👨‍👩‍👧‍👦</Text>
                  <View>
                    <Text className="text-gray-900 font-medium">
                      Share with {household.name}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {shareWithHousehold
                        ? "Visible to household members"
                        : "Only visible to you"}
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-12 h-7 rounded-full ${
                    shareWithHousehold ? "bg-primary-500" : "bg-gray-300"
                  } justify-center px-1`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white ${
                      shareWithHousehold ? "self-end" : "self-start"
                    }`}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Bottom spacing */}
            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Overlay with Confetti */}
      {showSuccess && (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute inset-0 bg-white/95 items-center justify-center z-50"
        >
          <ConfettiCannon
            count={200}
            origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
            autoStart={true}
            fadeOut
            fallSpeed={2500}
            explosionSpeed={400}
            colors={[
              "#EA4335",
              "#FBBC05",
              "#34A853",
              "#4285F4",
              "#FF6B6B",
              "#FFB347",
              "#E91E63",
              "#9C27B0",
            ]}
          />
          <Text className="text-3xl font-bold text-gray-900">Recipe Imported!</Text>
        </Animated.View>
      )}
    </>
  );
}
