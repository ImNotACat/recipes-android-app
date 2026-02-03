import { useState, useEffect, useRef } from "react";
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
  Modal,
  Pressable,
  Animated,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import ConfettiCannon from "react-native-confetti-cannon";
import { Ingredient, calculateCalories } from "../../../../src/types/recipe";
import { useRecipe, useUpdateRecipe, useTags } from "../../../../src/hooks/useRecipes";
import { useHousehold } from "../../../../src/hooks/useHousehold";

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading: isLoadingRecipe } = useRecipe(id || "");
  const updateRecipe = useUpdateRecipe();
  const { data: existingTags = [] } = useTags();
  const { data: household } = useHousehold();
  
  // Form state
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [instructions, setInstructions] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: 0, unit: "" }
  ]);
  const [shareWithHousehold, setShareWithHousehold] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load recipe data into form
  useEffect(() => {
    if (recipe && !isInitialized) {
      setName(recipe.name);
      setSelectedTags(recipe.tags);
      setPrepTime(recipe.prepTime?.toString() || "");
      setCookTime(recipe.cookTime?.toString() || "");
      setServings(recipe.servings?.toString() || "");
      setInstructions(recipe.description || "");
      setImage(recipe.imageUrl || null);
      setCarbs(recipe.macros.carbs.toString());
      setProtein(recipe.macros.protein.toString());
      setFat(recipe.macros.fat.toString());
      setCalories(recipe.macros.calories?.toString() || "");
      setIngredients(
        recipe.ingredients.length > 0 
          ? recipe.ingredients 
          : [{ name: "", amount: 0, unit: "" }]
      );
      setShareWithHousehold(!!recipe.householdId);
      setIsInitialized(true);
    }
  }, [recipe, isInitialized]);

  const pickImage = async () => {
    setShowImageModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    setShowImageModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setShowImageModal(false);
    setImage(null);
  };

  const showImageOptions = () => {
    setShowImageModal(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
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

    if (!id) return;

    try {
      await updateRecipe.mutateAsync({
        id,
        input: {
          name: name.trim(),
          instructions: instructions.trim() || undefined,
          imageUri: image,
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
        },
      });

      // Show success animation with confetti
      setShowSuccess(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Navigate back after delay
      setTimeout(() => {
        router.back();
      }, 2500);
    } catch (error) {
      console.error("Error updating recipe:", error);
      Alert.alert("Error", "Failed to update recipe. Please try again.");
    }
  };

  if (isLoadingRecipe) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EA4335" />
        <Text className="text-gray-400 mt-3">Loading recipe...</Text>
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
      
      {/* Image Options Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowImageModal(false)}
        >
          <Pressable 
            className="bg-white rounded-t-3xl px-6 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-lg font-semibold text-gray-900 text-center mb-4">Change Photo</Text>
            
            <TouchableOpacity
              className="bg-gray-50 rounded-xl py-4 px-4 mb-3 flex-row items-center"
              onPress={takePhoto}
            >
              <Text className="text-2xl mr-3">📸</Text>
              <Text className="text-gray-900 font-medium">Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-gray-50 rounded-xl py-4 px-4 mb-3 flex-row items-center"
              onPress={pickImage}
            >
              <Text className="text-2xl mr-3">🖼️</Text>
              <Text className="text-gray-900 font-medium">Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-red-50 rounded-xl py-4 px-4 mb-3 flex-row items-center"
              onPress={removePhoto}
            >
              <Text className="text-2xl mr-3">🗑️</Text>
              <Text className="text-red-600 font-medium">Remove Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="py-4 px-4"
              onPress={() => setShowImageModal(false)}
            >
              <Text className="text-gray-500 font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
            <Text className="text-lg font-semibold text-gray-900">Edit Recipe</Text>
            <TouchableOpacity 
              onPress={handleSave}
              disabled={updateRecipe.isPending}
            >
              {updateRecipe.isPending ? (
                <ActivityIndicator size="small" color="#EA4335" />
              ) : (
                <Text className="text-primary-500 text-base font-semibold">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-6 py-4">
            {/* Image Picker */}
            <TouchableOpacity 
              onPress={showImageOptions}
              className="mb-4"
            >
              {image ? (
                <View className="relative">
                  <Image 
                    source={{ uri: image }} 
                    className="w-full h-48 rounded-2xl"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 right-2 bg-black/50 rounded-full px-3 py-1">
                    <Text className="text-white text-sm">Change</Text>
                  </View>
                </View>
              ) : (
                <View className="w-full h-48 bg-gray-100 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300">
                  <Text className="text-4xl mb-2">📷</Text>
                  <Text className="text-gray-500 font-medium">Add Photo</Text>
                  <Text className="text-gray-400 text-sm">Tap to upload</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Recipe Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Recipe Name</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-100"
                placeholder="e.g. Chicken Stir Fry"
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
              
              {existingTags.filter((tag) => !selectedTags.includes(tag)).length > 0 && (
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
            <Text className="text-lg font-semibold text-gray-900 mb-3 mt-2">Macros (per serving)</Text>
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
            {household && recipe?.isOwner && (
              <TouchableOpacity 
                className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mt-4 border border-gray-100"
                onPress={() => setShareWithHousehold(!shareWithHousehold)}
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-lg mr-2">👨‍👩‍👧‍👦</Text>
                  <View>
                    <Text className="text-gray-900 font-medium">Share with {household.name}</Text>
                    <Text className="text-gray-400 text-sm">
                      {shareWithHousehold ? "Visible to household members" : "Only visible to you"}
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-7 rounded-full ${shareWithHousehold ? 'bg-primary-500' : 'bg-gray-300'} justify-center px-1`}>
                  <View className={`w-5 h-5 rounded-full bg-white ${shareWithHousehold ? 'self-end' : 'self-start'}`} />
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
            colors={['#EA4335', '#FBBC05', '#34A853', '#4285F4', '#FF6B6B', '#FFB347', '#E91E63', '#9C27B0']}
          />
          <Text className="text-3xl font-bold text-gray-900">Recipe Updated!</Text>
        </Animated.View>
      )}
    </>
  );
}
