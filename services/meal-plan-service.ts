import { supabase } from '@/lib/supabase';
import { MealType } from '@/types/recipe';

/**
 * Service pour gérer les meal plans avec Supabase
 */

// =====================================================
// TYPES POUR LA BASE DE DONNÉES
// =====================================================

interface DatabaseMealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: MealType;
  created_at: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  recipeId: string;
  plannedDate: string;
  mealType: MealType;
  createdAt: Date;
}

// =====================================================
// FONCTIONS DE CONVERSION
// =====================================================

function mapDatabaseMealPlanToMealPlan(dbMealPlan: DatabaseMealPlan): MealPlan {
  return {
    id: dbMealPlan.id,
    userId: dbMealPlan.user_id,
    recipeId: dbMealPlan.recipe_id,
    plannedDate: dbMealPlan.planned_date,
    mealType: dbMealPlan.meal_type,
    createdAt: new Date(dbMealPlan.created_at),
  };
}

// =====================================================
// CRUD MEAL PLANS
// =====================================================

/**
 * Créer un meal plan
 */
export async function createMealPlan(
  recipeId: string,
  plannedDate: string,
  mealType: MealType
): Promise<{ data: MealPlan | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .insert([{
        user_id: user.id,
        recipe_id: recipeId,
        planned_date: plannedDate,
        meal_type: mealType,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating meal plan:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseMealPlanToMealPlan(data), error: null };
  } catch (error) {
    console.error('Error in createMealPlan:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Récupérer tous les meal plans de l'utilisateur et de son foyer
 */
export async function getUserMealPlans(): Promise<{ data: MealPlan[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Ne pas filtrer par user_id - laisser les policies RLS gérer l'accès
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .order('planned_date', { ascending: true });

    if (error) {
      console.error('Error fetching meal plans:', error);
      return { data: null, error: new Error(error.message) };
    }

    const mealPlans = data.map(mapDatabaseMealPlanToMealPlan);
    return { data: mealPlans, error: null };
  } catch (error) {
    console.error('Error in getUserMealPlans:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Récupérer les meal plans pour une date spécifique
 */
export async function getMealPlansForDate(
  date: string
): Promise<{ data: MealPlan[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('planned_date', date)
      .order('meal_type', { ascending: true });

    if (error) {
      console.error('Error fetching meal plans for date:', error);
      return { data: null, error: new Error(error.message) };
    }

    const mealPlans = data.map(mapDatabaseMealPlanToMealPlan);
    return { data: mealPlans, error: null };
  } catch (error) {
    console.error('Error in getMealPlansForDate:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Supprimer un meal plan
 */
export async function deleteMealPlan(mealPlanId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteMealPlan:', error);
    return { error: error as Error };
  }
}

/**
 * Supprimer tous les meal plans d'une date spécifique
 */
export async function deleteMealPlansForDate(date: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('planned_date', date)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting meal plans for date:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteMealPlansForDate:', error);
    return { error: error as Error };
  }
}
