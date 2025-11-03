-- =====================================================
-- METTRE À JOUR LES POLICIES DU STORAGE
-- =====================================================
-- Ce script met à jour les policies pour permettre l'accès
-- aux images des recettes du foyer
-- =====================================================

-- 1. S'assurer que le bucket est PUBLIC
-- =====================================================
UPDATE storage.buckets
SET public = true
WHERE id = 'recipe-images';

-- 2. SUPPRIMER LES ANCIENNES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own and household recipe images" ON storage.objects;

-- 3. CRÉER LA NOUVELLE POLICY DE LECTURE
-- =====================================================
-- Permettre à tout le monde de voir les images (bucket public)
CREATE POLICY "Public can view recipe images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'recipe-images');

-- Alternative: Si tu veux restreindre aux utilisateurs authentifiés + foyer
-- (Décommenter si tu préfères cette approche)
/*
CREATE POLICY "Users can view their own and household recipe images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'recipe-images'
        AND (
            -- Voir ses propres images
            auth.uid()::text = (storage.foldername(name))[1]
            -- OU voir les images des membres du foyer
            OR public.user_has_household_access(
                ((storage.foldername(name))[1])::uuid
            )
        )
    );
*/

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que le bucket est public
SELECT id, name, public
FROM storage.buckets
WHERE id = 'recipe-images';

-- Vérifier les policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%recipe%'
ORDER BY policyname;
