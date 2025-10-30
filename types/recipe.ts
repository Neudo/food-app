export type MealType = 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation' | 'repas-complet' | 'tous';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
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

export type RecipeFormData = Omit<Recipe, 'id' | 'createdAt'>;
