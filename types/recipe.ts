export type MealType = 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation' | 'repas-complet' | 'tous';

export interface Recipe {
  id: string;
  userId: string; // ID de l'utilisateur propriétaire de la recette
  title: string;
  description: string;
  mealType: MealType;
  isSimple: boolean; // Recette simple (seulement image + titre + notes)
  notes?: string; // Notes optionnelles (surtout pour recettes simples)
  ingredients: Ingredient[];
  equipment?: string[]; // Accessoires/équipements requis (optionnel)
  steps: string[];
  prepTime: number; // en minutes
  cookTime: number; // en minutes
  servings: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  category: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export type RecipeFormData = Omit<Recipe, 'id' | 'userId' | 'createdAt'>;
