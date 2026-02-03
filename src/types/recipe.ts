export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Macros {
  carbs: number;   // grams
  protein: number; // grams
  fat: number;     // grams
  calories?: number;
}

// Helper to calculate calories from macros (4 cal/g carbs, 4 cal/g protein, 9 cal/g fat)
export function calculateCalories(macros: { carbs: number; protein: number; fat: number }): number {
  return Math.round((macros.carbs * 4) + (macros.protein * 4) + (macros.fat * 9));
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  ingredients: Ingredient[];
  macros: Macros;
  servings?: number;
  prepTime?: number;  // minutes
  cookTime?: number;  // minutes
}

// Sample data for development
export const sampleRecipes: Recipe[] = [
  {
    id: "1",
    name: "Scrambled Eggs",
    description: "Fluffy scrambled eggs cooked to perfection. A classic breakfast dish that's quick to make and packed with protein. Season with salt and pepper, and serve with toast for a complete meal.",
    imageUrl: undefined,
    tags: ["Breakfast", "Quick", "High Protein"],
    ingredients: [
      { name: "Eggs", amount: 3, unit: "large" },
      { name: "Butter", amount: 1, unit: "tbsp" },
      { name: "Milk", amount: 2, unit: "tbsp" },
      { name: "Salt", amount: 0.25, unit: "tsp" },
      { name: "Black Pepper", amount: 0.125, unit: "tsp" },
    ],
    macros: {
      carbs: 2,
      protein: 13,
      fat: 11,
    },
    servings: 1,
    prepTime: 2,
    cookTime: 5,
  },
  {
    id: "2",
    name: "Fresh Salad",
    description: "A refreshing garden salad with mixed greens, cherry tomatoes, cucumber, and a light vinaigrette dressing. Perfect as a healthy side dish or light lunch.",
    imageUrl: undefined,
    tags: ["Lunch", "Healthy", "Vegetarian", "Low Carb"],
    ingredients: [
      { name: "Mixed Greens", amount: 100, unit: "g" },
      { name: "Cherry Tomatoes", amount: 8, unit: "pieces" },
      { name: "Cucumber", amount: 0.5, unit: "medium" },
      { name: "Red Onion", amount: 0.25, unit: "small" },
      { name: "Olive Oil", amount: 1, unit: "tbsp" },
      { name: "Balsamic Vinegar", amount: 1, unit: "tsp" },
    ],
    macros: {
      carbs: 12,
      protein: 4,
      fat: 8,
    },
    servings: 2,
    prepTime: 10,
    cookTime: 0,
  },
];
