import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, RecipeFormData, MealType } from '@/types/recipe';
import { mockRecipes } from '@/data/mock-recipes';
import * as RecipeService from '@/services/recipe-service';
import { Alert } from 'react-native';

export interface PlannedMeal {
  date: string; // Format: YYYY-MM-DD
  mealType: MealType;
  recipe: Recipe;
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormData) => Promise<boolean>;
  updateRecipe: (recipeId: string, recipe: RecipeFormData) => Promise<boolean>;
  deleteRecipe: (recipeId: string) => Promise<boolean>;
  likedRecipes: Recipe[];
  rejectedRecipes: Recipe[];
  likeRecipe: (recipeId: string) => Promise<void>;
  unlikeRecipe: (recipeId: string) => Promise<void>;
  rejectRecipe: (recipeId: string) => void;
  plannedMeals: PlannedMeal[];
  addPlannedMeal: (date: string, mealType: MealType, recipe: Recipe) => void;
  removePlannedMeal: (date: string, mealType: MealType) => void;
  getPlannedMealsForDate: (date: string) => PlannedMeal[];
  loading: boolean;
  refreshRecipes: () => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [rejectedRecipes, setRejectedRecipes] = useState<Recipe[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les recettes au démarrage
  useEffect(() => {
    loadRecipes();
    loadLikedRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    const { data, error } = await RecipeService.getUserRecipes();
    
    if (error) {
      console.error('Error loading recipes:', error);
      // En cas d'erreur, utiliser les recettes mock pour le développement
      setRecipes(mockRecipes);
    } else if (data) {
      setRecipes(data);
    }
    
    setLoading(false);
  };

  const loadLikedRecipes = async () => {
    const { data, error } = await RecipeService.getLikedRecipes();
    
    if (error) {
      console.error('Error loading liked recipes:', error);
    } else if (data) {
      setLikedRecipes(data);
    }
  };

  const refreshRecipes = async () => {
    await loadRecipes();
    await loadLikedRecipes();
  };

  const addRecipe = async (recipeData: RecipeFormData): Promise<boolean> => {
    try {
      const { data, error } = await RecipeService.createRecipe(recipeData);
      
      if (error || !data) {
        Alert.alert('Erreur', 'Impossible de créer la recette. Veuillez réessayer.');
        return false;
      }
      
      // Ajouter la recette au state local
      setRecipes((prev) => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Error in addRecipe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la recette.');
      return false;
    }
  };

  const updateRecipe = async (recipeId: string, recipeData: RecipeFormData): Promise<boolean> => {
    try {
      const oldRecipe = recipes.find(r => r.id === recipeId);
      const { data, error } = await RecipeService.updateRecipe(
        recipeId,
        recipeData,
        oldRecipe?.imageUrl
      );
      
      if (error || !data) {
        Alert.alert('Erreur', 'Impossible de modifier la recette. Veuillez réessayer.');
        return false;
      }
      
      // Mettre à jour la recette dans le state local
      setRecipes((prev) => prev.map(r => r.id === recipeId ? data : r));
      return true;
    } catch (error) {
      console.error('Error in updateRecipe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de la recette.');
      return false;
    }
  };

  const deleteRecipe = async (recipeId: string): Promise<boolean> => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      const { error } = await RecipeService.deleteRecipe(recipeId, recipe?.imageUrl);
      
      if (error) {
        Alert.alert('Erreur', 'Impossible de supprimer la recette. Veuillez réessayer.');
        return false;
      }
      
      // Supprimer la recette du state local
      setRecipes((prev) => prev.filter(r => r.id !== recipeId));
      setLikedRecipes((prev) => prev.filter(r => r.id !== recipeId));
      return true;
    } catch (error) {
      console.error('Error in deleteRecipe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de la recette.');
      return false;
    }
  };

  const likeRecipe = async (recipeId: string): Promise<void> => {
    try {
      // Vérifier si déjà liké
      if (likedRecipes.find((r) => r.id === recipeId)) {
        return;
      }

      const { error } = await RecipeService.likeRecipe(recipeId);
      
      if (error) {
        Alert.alert('Erreur', 'Impossible d\'ajouter aux favoris.');
        return;
      }
      
      // Ajouter au state local
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        setLikedRecipes((prev) => [...prev, recipe]);
      }
    } catch (error) {
      console.error('Error in likeRecipe:', error);
    }
  };

  const unlikeRecipe = async (recipeId: string): Promise<void> => {
    try {
      const { error } = await RecipeService.unlikeRecipe(recipeId);
      
      if (error) {
        Alert.alert('Erreur', 'Impossible de retirer des favoris.');
        return;
      }
      
      // Retirer du state local
      setLikedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (error) {
      console.error('Error in unlikeRecipe:', error);
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
        updateRecipe,
        deleteRecipe,
        likedRecipes,
        rejectedRecipes,
        likeRecipe,
        unlikeRecipe,
        rejectRecipe,
        plannedMeals,
        addPlannedMeal,
        removePlannedMeal,
        getPlannedMealsForDate,
        loading,
        refreshRecipes,
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
