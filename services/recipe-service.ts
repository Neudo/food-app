import { supabase } from '@/lib/supabase';
import { Recipe, RecipeFormData } from '@/types/recipe';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

/**
 * Service pour gérer les recettes avec Supabase
 * Toutes les opérations CRUD + upload d'images
 */

// =====================================================
// TYPES POUR LA BASE DE DONNÉES
// =====================================================

interface DatabaseRecipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  meal_type: string;
  is_simple: boolean;
  notes?: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  category: string;
  ingredients: any[];
  equipment?: any[];
  steps: any[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONVERSION DATABASE <-> APP
// =====================================================

/**
 * Convertir une recette de la DB vers le format de l'app
 */
function mapDatabaseRecipeToRecipe(dbRecipe: DatabaseRecipe): Recipe {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: dbRecipe.description,
    mealType: dbRecipe.meal_type as any,
    isSimple: dbRecipe.is_simple,
    notes: dbRecipe.notes,
    imageUrl: dbRecipe.image_url,
    ingredients: dbRecipe.ingredients || [],
    equipment: dbRecipe.equipment,
    steps: dbRecipe.steps || [],
    prepTime: dbRecipe.prep_time,
    cookTime: dbRecipe.cook_time,
    servings: dbRecipe.servings,
    difficulty: dbRecipe.difficulty as any,
    category: dbRecipe.category,
    createdAt: new Date(dbRecipe.created_at),
  };
}

/**
 * Convertir une recette de l'app vers le format DB
 */
function mapRecipeToDatabase(recipe: RecipeFormData, userId: string, imageUrl?: string) {
  return {
    user_id: userId,
    title: recipe.title,
    description: recipe.description,
    meal_type: recipe.mealType,
    is_simple: recipe.isSimple,
    notes: recipe.notes,
    image_url: imageUrl || recipe.imageUrl,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    category: recipe.category,
    ingredients: recipe.ingredients,
    equipment: recipe.equipment || [],
    steps: recipe.steps,
  };
}

// =====================================================
// GESTION DES IMAGES
// =====================================================

/**
 * Upload une image vers Supabase Storage
 * @param uri - URI locale de l'image
 * @param recipeId - ID de la recette (pour le nom du fichier)
 * @returns URL publique de l'image ou null si erreur
 */
export async function uploadRecipeImage(uri: string, recipeId: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    // Lire le fichier en base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Déterminer l'extension du fichier
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${recipeId}_${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    // Déterminer le content type
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadRecipeImage:', error);
    return null;
  }
}

/**
 * Supprimer une image de Supabase Storage
 * @param imageUrl - URL complète de l'image
 */
export async function deleteRecipeImage(imageUrl: string): Promise<boolean> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = imageUrl.split('/recipe-images/');
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('recipe-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRecipeImage:', error);
    return false;
  }
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Créer une nouvelle recette
 */
export async function createRecipe(recipeData: RecipeFormData): Promise<{ data: Recipe | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Générer un ID temporaire pour la recette
    const tempId = `temp-${Date.now()}`;

    // Upload de l'image si présente
    let imageUrl: string | undefined;
    if (recipeData.imageUrl && recipeData.imageUrl.startsWith('file://')) {
      imageUrl = await uploadRecipeImage(recipeData.imageUrl, tempId) || undefined;
    }

    // Préparer les données pour la DB
    const dbRecipe = mapRecipeToDatabase(recipeData, user.id, imageUrl);

    // Insérer dans la base de données
    const { data, error } = await supabase
      .from('recipes')
      .insert([dbRecipe])
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe:', error);
      // Si erreur, supprimer l'image uploadée
      if (imageUrl) {
        await deleteRecipeImage(imageUrl);
      }
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseRecipeToRecipe(data), error: null };
  } catch (error) {
    console.error('Error in createRecipe:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Récupérer toutes les recettes de l'utilisateur
 */
export async function getUserRecipes(): Promise<{ data: Recipe[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return { data: null, error: new Error(error.message) };
    }

    const recipes = data.map(mapDatabaseRecipeToRecipe);
    return { data: recipes, error: null };
  } catch (error) {
    console.error('Error in getUserRecipes:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Récupérer une recette par son ID
 */
export async function getRecipeById(recipeId: string): Promise<{ data: Recipe | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseRecipeToRecipe(data), error: null };
  } catch (error) {
    console.error('Error in getRecipeById:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mettre à jour une recette
 */
export async function updateRecipe(
  recipeId: string,
  recipeData: RecipeFormData,
  oldImageUrl?: string
): Promise<{ data: Recipe | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Gérer l'upload de la nouvelle image
    let imageUrl: string | undefined;
    if (recipeData.imageUrl && recipeData.imageUrl.startsWith('file://')) {
      // Upload nouvelle image
      imageUrl = await uploadRecipeImage(recipeData.imageUrl, recipeId) || undefined;
      
      // Supprimer l'ancienne image si elle existe
      if (oldImageUrl && imageUrl) {
        await deleteRecipeImage(oldImageUrl);
      }
    } else {
      // Garder l'ancienne URL si pas de nouvelle image
      imageUrl = recipeData.imageUrl;
    }

    // Préparer les données pour la DB
    const dbRecipe = mapRecipeToDatabase(recipeData, user.id, imageUrl);

    // Mettre à jour dans la base de données
    const { data, error } = await supabase
      .from('recipes')
      .update(dbRecipe)
      .eq('id', recipeId)
      .eq('user_id', user.id) // Sécurité: vérifier que c'est bien la recette de l'utilisateur
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseRecipeToRecipe(data), error: null };
  } catch (error) {
    console.error('Error in updateRecipe:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Supprimer une recette
 */
export async function deleteRecipe(recipeId: string, imageUrl?: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Supprimer l'image si elle existe
    if (imageUrl) {
      await deleteRecipeImage(imageUrl);
    }

    // Supprimer la recette de la DB
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id); // Sécurité: vérifier que c'est bien la recette de l'utilisateur

    if (error) {
      console.error('Error deleting recipe:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteRecipe:', error);
    return { error: error as Error };
  }
}

// =====================================================
// GESTION DES FAVORIS
// =====================================================

/**
 * Récupérer les recettes likées par l'utilisateur
 */
export async function getLikedRecipes(): Promise<{ data: Recipe[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('liked_recipes')
      .select(`
        recipe_id,
        recipes (*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching liked recipes:', error);
      return { data: null, error: new Error(error.message) };
    }

    const recipes = data
      .map((item: any) => item.recipes)
      .filter(Boolean)
      .map(mapDatabaseRecipeToRecipe);

    return { data: recipes, error: null };
  } catch (error) {
    console.error('Error in getLikedRecipes:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Liker une recette
 */
export async function likeRecipe(recipeId: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('liked_recipes')
      .insert([{ user_id: user.id, recipe_id: recipeId }]);

    if (error) {
      console.error('Error liking recipe:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in likeRecipe:', error);
    return { error: error as Error };
  }
}

/**
 * Unliker une recette
 */
export async function unlikeRecipe(recipeId: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('liked_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('Error unliking recipe:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in unlikeRecipe:', error);
    return { error: error as Error };
  }
}

/**
 * Vérifier si une recette est likée
 */
export async function isRecipeLiked(recipeId: string): Promise<{ data: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: false, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('liked_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if recipe is liked:', error);
      return { data: false, error: new Error(error.message) };
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error in isRecipeLiked:', error);
    return { data: false, error: error as Error };
  }
}
