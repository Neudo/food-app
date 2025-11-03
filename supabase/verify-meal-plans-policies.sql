-- =====================================================
-- VÉRIFIER LES POLICIES SUR MEAL_PLANS
-- =====================================================

-- 1. Vérifier que la fonction user_has_household_access existe
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'user_has_household_access';

-- 2. Vérifier les policies sur meal_plans
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE tablename = 'meal_plans'
ORDER BY cmd, policyname;

-- 3. Vérifier que RLS est activé sur meal_plans
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'meal_plans';
