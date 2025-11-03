-- =====================================================
-- APPLIQUER LES POLICIES DE PARTAGE
-- =====================================================
-- Ce script applique uniquement les policies de partage
-- pour les recettes, favoris et plannings
-- =====================================================

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
        INNER JOIN public.user_settings us2 ON us1.household_id = us2.household_id
        WHERE us1.user_id = auth.uid()
          AND us2.user_id = target_user_id
          AND us1.household_id IS NOT NULL
          AND us2.household_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES DE PARTAGE
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
-- VÉRIFICATION
-- =====================================================

-- Vérifier que les policies sont bien créées
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename IN ('recipes', 'liked_recipes', 'meal_plans')
ORDER BY tablename, cmd;
