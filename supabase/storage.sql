-- =====================================================
-- CONFIGURATION DU STORAGE SUPABASE POUR LES IMAGES
-- =====================================================
-- Ce fichier configure le bucket de stockage pour les images de recettes
-- avec les bonnes pratiques de sécurité
-- =====================================================

-- 1. CRÉATION DU BUCKET POUR LES IMAGES DE RECETTES
-- =====================================================

-- Créer le bucket 'recipe-images' (public pour afficher les images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recipe-images',
    'recipe-images',
    true, -- Public pour que les images soient accessibles via URL
    5242880, -- Limite de 5MB par fichier (5 * 1024 * 1024)
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] -- Types MIME autorisés
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLICIES DE SÉCURITÉ POUR LE BUCKET
-- =====================================================

-- Policy: Les utilisateurs authentifiés peuvent UPLOADER des images
CREATE POLICY "Authenticated users can upload recipe images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
    );

-- Policy: Les utilisateurs peuvent VOIR toutes les images (bucket public)
CREATE POLICY "Anyone can view recipe images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'recipe-images');

-- Policy: Les utilisateurs peuvent METTRE À JOUR uniquement leurs propres images
CREATE POLICY "Users can update their own recipe images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Les utilisateurs peuvent SUPPRIMER uniquement leurs propres images
CREATE POLICY "Users can delete their own recipe images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'recipe-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- STRUCTURE DES CHEMINS DE FICHIERS
-- =====================================================
-- Les images seront stockées avec la structure suivante:
-- recipe-images/{user_id}/{recipe_id}_{timestamp}.{extension}
--
-- Exemple:
-- recipe-images/550e8400-e29b-41d4-a716-446655440000/abc123_1698765432.jpg
--
-- Avantages:
-- - Isolation par utilisateur (sécurité)
-- - Noms uniques avec timestamp (pas de collision)
-- - Facile à nettoyer (supprimer toutes les images d'un utilisateur)
-- =====================================================

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que le bucket a été créé
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'recipe-images';

-- Vérifier les policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%recipe images%';
