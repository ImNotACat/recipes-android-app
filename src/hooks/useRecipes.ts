import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Recipe, Ingredient, Macros, calculateCalories } from "../types/recipe";

// Types for database rows
interface RecipeRow {
  id: string;
  user_id: string;
  name: string;
  instructions: string | null;
  image_url: string | null;
  tags: string[];
  carbs: number;
  protein: number;
  fat: number;
  calories: number | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
}

// Input type for creating a recipe
export interface CreateRecipeInput {
  name: string;
  instructions?: string;
  imageUri?: string | null;
  tags: string[];
  macros: Macros;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: Ingredient[];
}

// Transform database row to app Recipe type
function transformRecipe(row: RecipeRow, ingredients: IngredientRow[]): Recipe {
  const macros = {
    carbs: row.carbs,
    protein: row.protein,
    fat: row.fat,
  };
  
  return {
    id: row.id,
    name: row.name,
    description: row.instructions || "",
    imageUrl: row.image_url || undefined,
    tags: row.tags || [],
    macros: {
      ...macros,
      // Use stored calories or calculate from macros
      calories: row.calories ?? calculateCalories(macros),
    },
    servings: row.servings || undefined,
    prepTime: row.prep_time || undefined,
    cookTime: row.cook_time || undefined,
    ingredients: ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
    })),
  };
}

// Upload image to Supabase Storage
async function uploadImage(uri: string, userId: string): Promise<string | null> {
  try {
    // Get file extension from URI
    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("recipe-images")
      .upload(fileName, blob, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

// Fetch all recipes for the current user
export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async (): Promise<Recipe[]> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch recipes
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      // Fetch all ingredients for these recipes
      const recipeIds = recipes.map((r) => r.id);
      const { data: ingredients, error: ingredientsError } = await supabase
        .from("ingredients")
        .select("*")
        .in("recipe_id", recipeIds);

      if (ingredientsError) throw ingredientsError;

      // Group ingredients by recipe
      const ingredientsByRecipe = (ingredients || []).reduce((acc, ing) => {
        if (!acc[ing.recipe_id]) acc[ing.recipe_id] = [];
        acc[ing.recipe_id].push(ing);
        return acc;
      }, {} as Record<string, IngredientRow[]>);

      // Transform to app format
      return recipes.map((recipe) =>
        transformRecipe(recipe, ingredientsByRecipe[recipe.id] || [])
      );
    },
  });
}

// Fetch a single recipe by ID
export function useRecipe(id: string) {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: async (): Promise<Recipe | null> => {
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (recipeError) {
        if (recipeError.code === "PGRST116") return null; // Not found
        throw recipeError;
      }

      const { data: ingredients, error: ingredientsError } = await supabase
        .from("ingredients")
        .select("*")
        .eq("recipe_id", id);

      if (ingredientsError) throw ingredientsError;

      return transformRecipe(recipe, ingredients || []);
    },
    enabled: !!id,
  });
}

// Create a new recipe
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecipeInput): Promise<Recipe> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload image if provided
      let imageUrl: string | null = null;
      if (input.imageUri) {
        imageUrl = await uploadImage(input.imageUri, user.id);
      }

      // Calculate calories if not provided
      const calories = input.macros.calories ?? calculateCalories(input.macros);

      // Insert recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          name: input.name,
          instructions: input.instructions || null,
          image_url: imageUrl,
          tags: input.tags,
          carbs: input.macros.carbs,
          protein: input.macros.protein,
          fat: input.macros.fat,
          calories: calories,
          servings: input.servings || null,
          prep_time: input.prepTime || null,
          cook_time: input.cookTime || null,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Insert ingredients
      const ingredientsToInsert = input.ingredients
        .filter((ing) => ing.name.trim()) // Only save ingredients with names
        .map((ing) => ({
          recipe_id: recipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }));

      if (ingredientsToInsert.length > 0) {
        const { error: ingredientsError } = await supabase
          .from("ingredients")
          .insert(ingredientsToInsert);

        if (ingredientsError) throw ingredientsError;
      }

      return transformRecipe(recipe, ingredientsToInsert.map((ing, i) => ({
        ...ing,
        id: `temp-${i}`,
      })));
    },
    onSuccess: () => {
      // Invalidate recipes query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// Fetch all unique tags from user's recipes
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("tags")
        .eq("user_id", user.id);

      if (error) throw error;

      // Flatten all tags and get unique ones
      const allTags = recipes.flatMap((r) => r.tags || []);
      const uniqueTags = [...new Set(allTags)].sort();
      
      return uniqueTags;
    },
  });
}

// Delete a recipe
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string): Promise<void> => {
      // Ingredients are automatically deleted via CASCADE
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
