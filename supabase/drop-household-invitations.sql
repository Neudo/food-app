-- =====================================================
-- SUPPRIMER LA TABLE HOUSEHOLD_INVITATIONS
-- =====================================================
-- Cette table n'est plus utilisée car le système utilise
-- maintenant des codes de foyer pour rejoindre directement
-- =====================================================

-- Supprimer la table (déjà fait par l'utilisateur)
-- DROP TABLE IF EXISTS public.household_invitations CASCADE;

-- Note: La table a été supprimée manuellement
-- Le code lié aux invitations a été retiré de:
-- - services/household-service.ts (fonctions inviteToHousehold, getPendingInvitations, acceptInvitation, declineInvitation, cancelInvitation)
-- - types/household.ts (type HouseholdInvitation, InvitationStatus)
-- - app/household.tsx (UI et logique des invitations)

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que la table n'existe plus
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'household_invitations';

-- Devrait retourner 0 lignes
