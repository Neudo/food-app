import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, RecipeFormData, MealType } from '@/types/recipe';
import { mockRecipes } from '@/data/mock-recipes';

export interface PlannedMeal {
  date: string; // Format: YYYY-MM-DD
  mealType: MealType;
  recipe: Recipe;
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormData) => void;
  likedRecipes: Recipe[];
  rejectedRecipes: Recipe[];
  likeRecipe: (recipeId: string) => void;
  rejectRecipe: (recipeId: string) => void;
  plannedMeals: PlannedMeal[];
  addPlannedMeal: (date: string, mealType: MealType, recipe: Recipe) => void;
  removePlannedMeal: (date: string, mealType: MealType) => void;
  getPlannedMealsForDate: (date: string) => PlannedMeal[];
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  // Initialiser avec les recettes mock pour le développement
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [rejectedRecipes, setRejectedRecipes] = useState<Recipe[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);

  const addRecipe = (recipeData: RecipeFormData) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setRecipes((prev) => [newRecipe, ...prev]);
  };

  const likeRecipe = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe && !likedRecipes.find((r) => r.id === recipeId)) {
      setLikedRecipes((prev) => [...prev, recipe]);
    }
  };

  const rejectRecipe = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe && !rejectedRecipes.find((r) => r.id === recipeId)) {
      setRejectedRecipes((prev) => [...prev, recipe]);
    }
  };

  const addPlannedMeal = (date: string, mealType: MealType, recipe: Recipe) => {
    setPlannedMeals((prev) => {
      // Supprimer l'ancien repas s'il existe pour cette date et ce type
      const filtered = prev.filter(
        (meal) => !(meal.date === date && meal.mealType === mealType)
      );
      return [...filtered, { date, mealType, recipe }];
    });
  };

  const removePlannedMeal = (date: string, mealType: MealType) => {
    setPlannedMeals((prev) =>
      prev.filter((meal) => !(meal.date === date && meal.mealType === mealType))
    );
  };

  const getPlannedMealsForDate = (date: string): PlannedMeal[] => {
    return plannedMeals.filter((meal) => meal.date === date);
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        likedRecipes,
        rejectedRecipes,
        likeRecipe,
        rejectRecipe,
        plannedMeals,
        addPlannedMeal,
        removePlannedMeal,
        getPlannedMealsForDate,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}
