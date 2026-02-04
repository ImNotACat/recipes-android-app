import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Ingredient, Macros } from "../types/recipe";

export interface ImportedRecipe {
  name: string;
  instructions: string;
  imageUrl?: string;
  tags: string[];
  ingredients: Ingredient[];
  macros: Macros;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
}

interface ImportRecipeResponse {
  recipe: ImportedRecipe;
}

interface ImportRecipeError {
  error: string;
}

export function useImportRecipe() {
  return useMutation({
    mutationFn: async (url: string): Promise<ImportedRecipe> => {
      // Get the Supabase URL from the client
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }

      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/import-recipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_API_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ImportRecipeError).error || "Failed to import recipe");
      }

      return (data as ImportRecipeResponse).recipe;
    },
  });
}
