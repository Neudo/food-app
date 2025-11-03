-- =====================================================
-- VÉRIFIER LA CONFIGURATION DU PARTAGE
-- =====================================================

-- 1. Vérifier que la fonction user_has_household_access existe
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'user_has_household_access';

-- 2. Vérifier les policies sur recipes
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE tablename = 'recipes';

-- 3. Vérifier les policies sur liked_recipes
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'liked_recipes';

-- 4. Vérifier les policies sur meal_plans
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'meal_plans';

-- 5. Tester la fonction avec deux utilisateurs du même foyer
-- (Remplacer les UUIDs par de vrais IDs de test)
-- SELECT public.user_has_household_access('uuid-user-2');
