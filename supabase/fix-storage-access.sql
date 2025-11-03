-- =====================================================
-- CORRIGER L'ACCÈS AUX IMAGES DU STORAGE
-- =====================================================

-- 1. Rendre le bucket PUBLIC
UPDATE storage.buckets
SET public = true
WHERE id = 'recipe-images';

-- 2. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own recipe images" ON storage.objects;

-- 3. Créer les nouvelles policies

-- SELECT: Tout le monde peut voir les images (bucket public)
CREATE POLICY "Public access to recipe images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'recipe-images');

-- INSERT: Les utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Users can upload their own recipe images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- UPDATE: Les utilisateurs peuvent modifier leurs propres images
CREATE POLICY "Users can update their own recipe images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- DELETE: Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own recipe images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que le bucket est public
SELECT 
    id, 
    name, 
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'recipe-images';

-- Vérifier les policies
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%recipe%'
ORDER BY cmd, policyname;
