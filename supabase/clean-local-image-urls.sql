-- =====================================================
-- NETTOYER LES URLs LOCALES DES IMAGES
-- =====================================================
-- Ce script supprime les URLs locales (file://) des recettes
-- car elles ne sont pas accessibles depuis d'autres appareils
-- =====================================================

-- Voir combien de recettes ont des URLs locales
SELECT 
    COUNT(*) as recipes_with_local_urls,
    COUNT(DISTINCT user_id) as affected_users
FROM recipes
WHERE image_url LIKE 'file://%';

-- Mettre à jour les recettes pour supprimer les URLs locales
UPDATE recipes
SET image_url = NULL
WHERE image_url LIKE 'file://%';

-- Vérifier le résultat
SELECT 
    COUNT(*) as total_recipes,
    COUNT(image_url) as recipes_with_images,
    COUNT(*) - COUNT(image_url) as recipes_without_images
FROM recipes;
