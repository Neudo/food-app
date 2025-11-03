import { supabase } from '@/lib/supabase';

/**
 * Service pour gérer les préférences utilisateur
 */

// =====================================================
// TYPES
// =====================================================

export interface UserSettings {
  id: string;
  userId: string;
  showBreakfast: boolean;
  showLunch: boolean;
  showDinner: boolean;
  showSnack: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseUserSettings {
  id: string;
  user_id: string;
  show_breakfast: boolean;
  show_lunch: boolean;
  show_dinner: boolean;
  show_snack: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONVERSION DATABASE <-> APP
// =====================================================

function mapDatabaseSettingsToSettings(dbSettings: DatabaseUserSettings): UserSettings {
  return {
    id: dbSettings.id,
    userId: dbSettings.user_id,
    showBreakfast: dbSettings.show_breakfast,
    showLunch: dbSettings.show_lunch,
    showDinner: dbSettings.show_dinner,
    showSnack: dbSettings.show_snack,
    createdAt: new Date(dbSettings.created_at),
    updatedAt: new Date(dbSettings.updated_at),
  };
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Récupérer les préférences de l'utilisateur
 * Crée des préférences par défaut si elles n'existent pas
 */
export async function getUserSettings(): Promise<{ data: UserSettings | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Essayer de récupérer les préférences existantes
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Si les préférences n'existent pas, les créer avec les valeurs par défaut
      if (error.code === 'PGRST116') {
        return await createDefaultSettings();
      }
      console.error('Error fetching user settings:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseSettingsToSettings(data), error: null };
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Créer les préférences par défaut pour un nouvel utilisateur
 */
async function createDefaultSettings(): Promise<{ data: UserSettings | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const defaultSettings = {
      user_id: user.id,
      show_breakfast: true,
      show_lunch: true,
      show_dinner: true,
      show_snack: true,
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert([defaultSettings])
      .select()
      .single();

    if (error) {
      console.error('Error creating default settings:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseSettingsToSettings(data), error: null };
  } catch (error) {
    console.error('Error in createDefaultSettings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mettre à jour les préférences utilisateur
 */
export async function updateUserSettings(
  settings: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<{ data: UserSettings | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Convertir les noms de propriétés en snake_case
    const dbSettings: any = {};
    if (settings.showBreakfast !== undefined) dbSettings.show_breakfast = settings.showBreakfast;
    if (settings.showLunch !== undefined) dbSettings.show_lunch = settings.showLunch;
    if (settings.showDinner !== undefined) dbSettings.show_dinner = settings.showDinner;
    if (settings.showSnack !== undefined) dbSettings.show_snack = settings.showSnack;

    const { data, error } = await supabase
      .from('user_settings')
      .update(dbSettings)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseSettingsToSettings(data), error: null };
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Basculer l'affichage d'un type de repas
 */
export async function toggleMealTypeVisibility(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ data: UserSettings | null; error: Error | null }> {
  try {
    // Récupérer les préférences actuelles
    const { data: currentSettings, error: fetchError } = await getUserSettings();
    if (fetchError || !currentSettings) {
      return { data: null, error: fetchError };
    }

    // Basculer la valeur
    const updates: any = {};
    switch (mealType) {
      case 'breakfast':
        updates.showBreakfast = !currentSettings.showBreakfast;
        break;
      case 'lunch':
        updates.showLunch = !currentSettings.showLunch;
        break;
      case 'dinner':
        updates.showDinner = !currentSettings.showDinner;
        break;
      case 'snack':
        updates.showSnack = !currentSettings.showSnack;
        break;
    }

    return await updateUserSettings(updates);
  } catch (error) {
    console.error('Error in toggleMealTypeVisibility:', error);
    return { data: null, error: error as Error };
  }
}
