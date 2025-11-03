import { supabase } from '@/lib/supabase';
import { Household, HouseholdMember, HouseholdRole } from '@/types/household';

/**
 * Service pour gérer les foyers (households) et le partage entre utilisateurs
 */

// =====================================================
// TYPES DATABASE
// =====================================================

interface DatabaseHousehold {
  id: string;
  name: string;
  code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseHouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  joined_at: string;
}

// =====================================================
// CONVERSION DATABASE <-> APP
// =====================================================

function mapDatabaseHousehold(db: DatabaseHousehold): Household {
  return {
    id: db.id,
    name: db.name,
    code: db.code,
    createdBy: db.created_by,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function mapDatabaseMember(db: DatabaseHouseholdMember): HouseholdMember {
  return {
    id: db.id,
    householdId: db.household_id,
    userId: db.user_id,
    role: db.role,
    joinedAt: new Date(db.joined_at),
  };
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Générer un code aléatoire unique pour un foyer (6 caractères alphanumériques)
 */
function generateHouseholdCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =====================================================
// GESTION DES FOYERS
// =====================================================

/**
 * Récupérer le foyer de l'utilisateur actuel
 */
export async function getUserHousehold(): Promise<{ data: Household | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Récupérer le foyer via user_settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        // Pas de settings trouvés
        return { data: null, error: null };
      }
      console.error('Error fetching user settings:', settingsError);
      return { data: null, error: new Error(settingsError.message) };
    }

    // Si pas de foyer
    if (!settings.household_id) {
      return { data: null, error: null };
    }

    // Récupérer les détails du foyer
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', settings.household_id)
      .single();

    if (householdError) {
      console.error('Error fetching household:', householdError);
      return { data: null, error: new Error(householdError.message) };
    }

    return { data: mapDatabaseHousehold(householdData), error: null };
  } catch (error) {
    console.error('Error in getUserHousehold:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Créer un nouveau foyer
 */
export async function createHousehold(name: string): Promise<{ data: Household | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Vérifier que l'utilisateur n'est pas déjà dans un foyer
    const { data: existingHousehold } = await getUserHousehold();
    if (existingHousehold) {
      return { data: null, error: new Error('User already belongs to a household') };
    }

    // Générer un code unique
    let code = generateHouseholdCode();
    let codeExists = true;
    
    // Vérifier que le code n'existe pas déjà
    while (codeExists) {
      const { data: existing } = await supabase
        .from('households')
        .select('id')
        .eq('code', code)
        .single();
      
      if (!existing) {
        codeExists = false;
      } else {
        code = generateHouseholdCode();
      }
    }

    // Créer le foyer
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .insert([{
        name,
        code,
        created_by: user.id,
      }])
      .select()
      .single();

    if (householdError) {
      console.error('Error creating household:', householdError);
      return { data: null, error: new Error(householdError.message) };
    }

    // Mettre à jour user_settings avec le foyer et le rôle owner
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        household_id: householdData.id,
        household_role: 'owner',
      })
      .eq('user_id', user.id);

    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
      // Supprimer le foyer créé
      await supabase.from('households').delete().eq('id', householdData.id);
      return { data: null, error: new Error(settingsError.message) };
    }

    return { data: mapDatabaseHousehold(householdData), error: null };
  } catch (error) {
    console.error('Error in createHousehold:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mettre à jour le nom du foyer
 */
export async function updateHouseholdName(householdId: string, name: string): Promise<{ data: Household | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('households')
      .update({ name })
      .eq('id', householdId)
      .select()
      .single();

    if (error) {
      console.error('Error updating household:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseHousehold(data), error: null };
  } catch (error) {
    console.error('Error in updateHouseholdName:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Quitter le foyer
 */
export async function leaveHousehold(): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('user_settings')
      .update({
        household_id: null,
        household_role: 'member',
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving household:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in leaveHousehold:', error);
    return { error: error as Error };
  }
}

/**
 * Rejoindre un foyer avec un code
 */
export async function joinHouseholdByCode(code: string): Promise<{ data: Household | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Vérifier que l'utilisateur n'est pas déjà dans un foyer
    const { data: existingHousehold } = await getUserHousehold();
    if (existingHousehold) {
      return { data: null, error: new Error('You must leave your current household first') };
    }

    // Trouver le foyer avec ce code
    const searchCode = code.trim().toUpperCase();
    console.log('Searching for household with code:', searchCode);
    
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('code', searchCode)
      .single();

    console.log('Household search result:', { householdData, householdError });

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return { data: null, error: new Error('Invalid household code') };
      }
      console.error('Error finding household:', householdError);
      return { data: null, error: new Error(householdError.message) };
    }

    // Rejoindre le foyer en mettant à jour user_settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        household_id: householdData.id,
        household_role: 'member',
      })
      .eq('user_id', user.id);

    if (settingsError) {
      console.error('Error joining household:', settingsError);
      return { data: null, error: new Error(settingsError.message) };
    }

    return { data: mapDatabaseHousehold(householdData), error: null };
  } catch (error) {
    console.error('Error in joinHouseholdByCode:', error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// GESTION DES MEMBRES
// =====================================================

/**
 * Récupérer les membres du foyer avec leurs emails
 */
export async function getHouseholdMembers(householdId: string): Promise<{ data: HouseholdMember[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_household_members_with_email', { household_uuid: householdId });

    if (error) {
      console.error('Error fetching household members:', error);
      return { data: null, error: new Error(error.message) };
    }

    // Convertir au format HouseholdMember
    const members = data.map((item: any) => ({
      id: item.user_id,
      householdId: householdId,
      userId: item.user_id,
      role: item.household_role,
      joinedAt: new Date(),
      userEmail: item.user_email,
    }));

    return { data: members, error: null };
  } catch (error) {
    console.error('Error in getHouseholdMembers:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Retirer un membre du foyer
 */
export async function removeMember(userId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .update({
        household_id: null,
        household_role: 'member',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in removeMember:', error);
    return { error: error as Error };
  }
}

/**
 * Modifier le rôle d'un membre
 */
export async function updateMemberRole(userId: string, role: HouseholdRole): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .update({ household_role: role })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating member role:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    return { error: error as Error };
  }
}

