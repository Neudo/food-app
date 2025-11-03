-- =====================================================
-- SCHEMA SUPABASE POUR L'APPLICATION RECIPE APP
-- =====================================================
-- Ce fichier contient toutes les tables, policies RLS et configurations
-- nécessaires pour l'application de recettes
-- =====================================================

-- 1. ACTIVATION DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Table des recettes
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de base
    title TEXT NOT NULL,
    description TEXT,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('petit-déjeuner', 'déjeuner', 'dîner', 'collation', 'repas-complet')),
    
    -- Mode recette simple
    is_simple BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    
    -- Image
    image_url TEXT,
    
    -- Détails de préparation (pour recettes complètes)
    prep_time INTEGER DEFAULT 0,
    cook_time INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    difficulty TEXT CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
    category TEXT,
    
    -- Ingrédients (stockés en JSONB pour flexibilité)
    ingredients JSONB DEFAULT '[]'::jsonb,
    
    -- Équipements requis (optionnel)
    equipment JSONB DEFAULT '[]'::jsonb,
    
    -- Étapes de préparation
    steps JSONB DEFAULT '[]'::jsonb,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour améliorer les performances
    CONSTRAINT recipes_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200)
);

-- Activer RLS sur la table recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 2. INDEXES POUR OPTIMISER LES REQUÊTES
-- =====================================================

-- Index sur user_id pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);

-- Index sur meal_type pour filtrer par type de repas
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON public.recipes(meal_type);

-- Index sur created_at pour trier par date
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

-- Index sur is_simple pour filtrer les recettes simples
CREATE INDEX IF NOT EXISTS idx_recipes_is_simple ON public.recipes(is_simple);

-- Index GIN sur ingredients pour recherche dans le JSONB
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON public.recipes USING GIN (ingredients);

-- 3. POLICIES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Policy: Les utilisateurs peuvent voir UNIQUEMENT leurs propres recettes
CREATE POLICY "Users can view their own recipes"
    ON public.recipes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres recettes
CREATE POLICY "Users can create their own recipes"
    ON public.recipes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier UNIQUEMENT leurs propres recettes
CREATE POLICY "Users can update their own recipes"
    ON public.recipes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer UNIQUEMENT leurs propres recettes
CREATE POLICY "Users can delete their own recipes"
    ON public.recipes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. FONCTION POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS set_updated_at ON public.recipes;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLE POUR LES RECETTES LIKÉES (FAVORIS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.liked_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un utilisateur ne peut liker qu'une seule fois la même recette
    UNIQUE(user_id, recipe_id)
);

-- Activer RLS sur liked_recipes
ALTER TABLE public.liked_recipes ENABLE ROW LEVEL SECURITY;

-- Index pour les requêtes de likes
CREATE INDEX IF NOT EXISTS idx_liked_recipes_user_id ON public.liked_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_recipes_recipe_id ON public.liked_recipes(recipe_id);

-- Policies pour liked_recipes
CREATE POLICY "Users can view their own likes"
    ON public.liked_recipes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can like recipes"
    ON public.liked_recipes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike recipes"
    ON public.liked_recipes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. TABLE POUR LES PRÉFÉRENCES UTILISATEUR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Préférences d'affichage des types de repas dans le planning
    show_breakfast BOOLEAN DEFAULT true,
    show_lunch BOOLEAN DEFAULT true,
    show_dinner BOOLEAN DEFAULT true,
    show_snack BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Index sur user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Policies pour user_settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABLE POUR LE PLANNING DES REPAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('petit-déjeuner', 'déjeuner', 'dîner', 'collation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Pas de contrainte UNIQUE : permet plusieurs repas du même type sur une même journée
);

-- Activer RLS sur meal_plans
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Index pour les requêtes de planning
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON public.meal_plans(planned_date);

-- Policies pour meal_plans
CREATE POLICY "Users can view their own meal plans"
    ON public.meal_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
    ON public.meal_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
    ON public.meal_plans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
    ON public.meal_plans
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- FIN DU SCHEMA
-- =====================================================

-- VÉRIFICATION: Afficher toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('recipes', 'liked_recipes', 'meal_plans', 'user_settings');
