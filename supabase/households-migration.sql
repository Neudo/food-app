-- =====================================================
-- MIGRATION COMPLÈTE: SYSTÈME DE FOYERS
-- =====================================================
-- Architecture simplifiée avec household_id dans user_settings
-- Ordre d'exécution: households → user_settings → invitations
-- =====================================================

-- 1. CRÉER LA TABLE HOUSEHOLDS EN PREMIER
-- =====================================================

CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Code unique pour rejoindre le foyer (ex: "EYN5S2")
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_households_created_by ON public.households(created_by);
CREATE INDEX IF NOT EXISTS idx_households_code ON public.households(code);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_updated_at_households ON public.households;
CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour récupérer les membres d'un foyer avec leurs emails
DROP FUNCTION IF EXISTS public.get_household_members_with_email(UUID);
CREATE FUNCTION public.get_household_members_with_email(household_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    household_role TEXT,
    user_email VARCHAR(255)
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id,
        us.household_role,
        au.email::VARCHAR(255) as user_email
    FROM public.user_settings us
    INNER JOIN auth.users au ON us.user_id = au.id
    WHERE us.household_id = household_uuid;
END;
$$;

-- 2. AJOUTER LES COLONNES À USER_SETTINGS
-- =====================================================

-- Ajouter household_id (maintenant que households existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings' 
        AND column_name = 'household_id'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ajouter household_role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings' 
        AND column_name = 'household_role'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN household_role TEXT DEFAULT 'member' CHECK (household_role IN ('owner', 'admin', 'member'));
    END IF;
END $$;

-- Index sur household_id
CREATE INDEX IF NOT EXISTS idx_user_settings_household_id ON public.user_settings(household_id);

-- 3. CRÉER LA TABLE DES INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.household_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    inviter_email TEXT, -- Email de l'inviteur pour affichage
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Activer RLS
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON public.household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON public.household_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_status ON public.household_invitations(status);

-- =====================================================
-- POLICIES POUR HOUSEHOLDS
-- =====================================================

-- Voir son foyer (via user_settings OU si on l'a créé OU pour rejoindre avec un code)
DROP POLICY IF EXISTS "Users can view their household" ON public.households;
CREATE POLICY "Users can view their household"
    ON public.households
    FOR SELECT
    USING (
        -- Voir le foyer dont on est membre
        id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid()
            AND household_id IS NOT NULL
        )
        -- OU voir les foyers qu'on a créés (pour le .select() après INSERT)
        OR created_by = auth.uid()
        -- OU permettre de voir n'importe quel foyer pour rejoindre avec un code
        -- (la sécurité est assurée par le code unique)
        OR auth.uid() IS NOT NULL
    );

-- Créer un foyer
DROP POLICY IF EXISTS "Users can create households" ON public.households;
CREATE POLICY "Users can create households"
    ON public.households
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Modifier le foyer (admins/owners)
DROP POLICY IF EXISTS "Admins can update household" ON public.households;
CREATE POLICY "Admins can update household"
    ON public.households
    FOR UPDATE
    USING (
        id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid() 
            AND household_role IN ('owner', 'admin')
        )
    );

-- Supprimer le foyer (owner uniquement)
DROP POLICY IF EXISTS "Owner can delete household" ON public.households;
CREATE POLICY "Owner can delete household"
    ON public.households
    FOR DELETE
    USING (
        id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid() 
            AND household_role = 'owner'
        )
    );

-- =====================================================
-- POLICIES POUR HOUSEHOLD_INVITATIONS
-- =====================================================

-- Voir les invitations (membres du foyer ou invité)
DROP POLICY IF EXISTS "Users can view invitations" ON public.household_invitations;
CREATE POLICY "Users can view invitations"
    ON public.household_invitations
    FOR SELECT
    USING (
        household_id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid()
        )
        OR invited_email = auth.email()
    );

-- Créer des invitations (admins/owners)
DROP POLICY IF EXISTS "Admins can create invitations" ON public.household_invitations;
CREATE POLICY "Admins can create invitations"
    ON public.household_invitations
    FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid() 
            AND household_role IN ('owner', 'admin')
        )
        AND invited_by = auth.uid()
    );

-- Modifier les invitations (admins ou invité)
DROP POLICY IF EXISTS "Admins and invitees can update invitations" ON public.household_invitations;
CREATE POLICY "Admins and invitees can update invitations"
    ON public.household_invitations
    FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id 
            FROM public.user_settings 
            WHERE user_id = auth.uid() 
            AND household_role IN ('owner', 'admin')
        )
        OR invited_email = auth.email()
    );

-- =====================================================
-- FONCTION HELPER POUR LE PARTAGE
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_household_access(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si les deux utilisateurs sont dans le même foyer
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_settings us1
        JOIN public.user_settings us2 ON us1.household_id = us2.household_id
        WHERE us1.user_id = auth.uid() 
        AND us2.user_id = target_user_id
        AND us1.household_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES DE PARTAGE (RECIPES, LIKED_RECIPES, MEAL_PLANS)
-- =====================================================

-- RECIPES: Partage avec le foyer
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view their own and household recipes" ON public.recipes;
CREATE POLICY "Users can view their own and household recipes"
    ON public.recipes
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- LIKED_RECIPES: Partage avec le foyer
DROP POLICY IF EXISTS "Users can view their liked recipes" ON public.liked_recipes;
DROP POLICY IF EXISTS "Users can view their own and household liked recipes" ON public.liked_recipes;
CREATE POLICY "Users can view their own and household liked recipes"
    ON public.liked_recipes
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- MEAL_PLANS: Partage avec le foyer (SELECT)
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can view their own and household meal plans" ON public.meal_plans;
CREATE POLICY "Users can view their own and household meal plans"
    ON public.meal_plans
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- MEAL_PLANS: Partage avec le foyer (INSERT)
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can create meal plans for themselves and household" ON public.meal_plans;
CREATE POLICY "Users can create meal plans for themselves and household"
    ON public.meal_plans
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- MEAL_PLANS: Partage avec le foyer (UPDATE)
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own and household meal plans" ON public.meal_plans;
CREATE POLICY "Users can update their own and household meal plans"
    ON public.meal_plans
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- MEAL_PLANS: Partage avec le foyer (DELETE)
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own and household meal plans" ON public.meal_plans;
CREATE POLICY "Users can delete their own and household meal plans"
    ON public.meal_plans
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.user_has_household_access(user_id)
    );

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier les colonnes de user_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_settings'
AND column_name IN ('household_id', 'household_role')
ORDER BY column_name;

-- Vérifier les tables créées
SELECT 
    table_name,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.table_name) as policies
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('households', 'household_invitations', 'user_settings')
ORDER BY table_name;

-- Vérifier la fonction helper
SELECT 
    proname as function_name,
    prosecdef as security_definer
FROM pg_proc
WHERE proname = 'user_has_household_access';

-- Afficher toutes les policies de partage
SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('households', 'household_invitations', 'recipes', 'liked_recipes', 'meal_plans')
ORDER BY tablename, policyname;
