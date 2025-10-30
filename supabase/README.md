# 🗄️ Configuration Supabase pour Recipe App

Ce dossier contient tous les scripts SQL nécessaires pour configurer la base de données Supabase de l'application Recipe App.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Structure de la base de données](#structure-de-la-base-de-données)
4. [Sécurité](#sécurité)
5. [Utilisation](#utilisation)

---

## ✅ Prérequis

- Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- Un projet Supabase créé
- Les variables d'environnement configurées dans `.env`

---

## 🚀 Installation

### Étape 1: Créer les tables

1. Connecte-toi à ton projet Supabase
2. Va dans **SQL Editor** (icône de base de données dans le menu latéral)
3. Crée une nouvelle requête
4. Copie-colle le contenu de `schema.sql`
5. Clique sur **Run** (ou Ctrl/Cmd + Enter)

✅ Tu devrais voir un message de succès et les 3 tables créées : `recipes`, `liked_recipes`, `meal_plans`

### Étape 2: Configurer le stockage des images

1. Reste dans le **SQL Editor**
2. Crée une nouvelle requête
3. Copie-colle le contenu de `storage.sql`
4. Clique sur **Run**

✅ Le bucket `recipe-images` est maintenant créé avec les bonnes policies de sécurité

### Étape 3: Vérifier la configuration

#### Vérifier les tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('recipes', 'liked_recipes', 'meal_plans');
```

#### Vérifier le bucket
1. Va dans **Storage** dans le menu latéral
2. Tu devrais voir le bucket `recipe-images`
3. Clique dessus pour voir les policies

---

## 🏗️ Structure de la base de données

### Table `recipes`

Stocke toutes les recettes des utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique (auto-généré) |
| `user_id` | UUID | Référence vers l'utilisateur (auth.users) |
| `title` | TEXT | Titre de la recette (obligatoire) |
| `description` | TEXT | Description de la recette |
| `meal_type` | TEXT | Type de repas (petit-déjeuner, déjeuner, dîner, collation, repas-complet) |
| `is_simple` | BOOLEAN | Mode recette simple (true/false) |
| `notes` | TEXT | Notes optionnelles |
| `image_url` | TEXT | URL de l'image (stockée dans Storage) |
| `prep_time` | INTEGER | Temps de préparation (minutes) |
| `cook_time` | INTEGER | Temps de cuisson (minutes) |
| `servings` | INTEGER | Nombre de portions |
| `difficulty` | TEXT | Difficulté (facile, moyen, difficile) |
| `category` | TEXT | Catégorie de la recette |
| `ingredients` | JSONB | Liste des ingrédients (JSON) |
| `equipment` | JSONB | Équipements requis (JSON) |
| `steps` | JSONB | Étapes de préparation (JSON) |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

**Exemple de structure JSONB pour `ingredients`:**
```json
[
  {
    "id": "1",
    "name": "Farine",
    "quantity": "250",
    "unit": "g"
  },
  {
    "id": "2",
    "name": "Œufs",
    "quantity": "3",
    "unit": ""
  }
]
```

**Exemple de structure JSONB pour `steps`:**
```json
[
  "Préchauffer le four à 180°C",
  "Mélanger la farine et les œufs",
  "Enfourner pendant 30 minutes"
]
```

### Table `liked_recipes`

Stocke les recettes likées (favoris) par les utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Utilisateur qui a liké |
| `recipe_id` | UUID | Recette likée |
| `created_at` | TIMESTAMP | Date du like |

**Contrainte:** Un utilisateur ne peut liker qu'une seule fois la même recette.

### Table `meal_plans`

Stocke le planning des repas.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Utilisateur propriétaire |
| `recipe_id` | UUID | Recette planifiée |
| `planned_date` | DATE | Date du repas |
| `meal_type` | TEXT | Type de repas |
| `created_at` | TIMESTAMP | Date de création |

**Contrainte:** Un seul repas par type et par date.

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour garantir que:
- ✅ Les utilisateurs ne voient **QUE** leurs propres données
- ✅ Les utilisateurs ne peuvent **PAS** modifier les données des autres
- ✅ Les utilisateurs ne peuvent **PAS** supprimer les données des autres

### Policies appliquées

#### Pour `recipes`:
- `SELECT`: Voir uniquement ses propres recettes
- `INSERT`: Créer uniquement avec son propre `user_id`
- `UPDATE`: Modifier uniquement ses propres recettes
- `DELETE`: Supprimer uniquement ses propres recettes

#### Pour le Storage:
- `INSERT`: Upload uniquement dans son propre dossier (`{user_id}/...`)
- `SELECT`: Voir toutes les images (bucket public)
- `UPDATE`: Modifier uniquement ses propres images
- `DELETE`: Supprimer uniquement ses propres images

### Validation des données

- ✅ Contraintes CHECK sur `meal_type` et `difficulty`
- ✅ Limite de taille pour le titre (1-200 caractères)
- ✅ Limite de taille des fichiers (5MB max)
- ✅ Types MIME autorisés: jpg, jpeg, png, webp, gif

---

## 💡 Utilisation

### Structure des URLs d'images

Les images sont stockées avec cette structure:
```
recipe-images/{user_id}/{recipe_id}_{timestamp}.{extension}
```

**Exemple:**
```
recipe-images/550e8400-e29b-41d4-a716-446655440000/abc123_1698765432.jpg
```

### URL publique

Pour obtenir l'URL publique d'une image:
```typescript
const { data } = supabase.storage
  .from('recipe-images')
  .getPublicUrl(`${userId}/${fileName}`);

const imageUrl = data.publicUrl;
```

### Upload d'une image

```typescript
const file = {
  uri: 'file:///path/to/image.jpg',
  type: 'image/jpeg',
  name: 'image.jpg'
};

const fileName = `${recipeId}_${Date.now()}.jpg`;
const filePath = `${userId}/${fileName}`;

const { data, error } = await supabase.storage
  .from('recipe-images')
  .upload(filePath, file);
```

### Supprimer une image

```typescript
const { error } = await supabase.storage
  .from('recipe-images')
  .remove([`${userId}/${fileName}`]);
```

---

## 🔧 Maintenance

### Nettoyer les images orphelines

Si une recette est supprimée mais que son image reste dans le Storage:

```sql
-- Trouver les images sans recette associée
SELECT name 
FROM storage.objects 
WHERE bucket_id = 'recipe-images'
AND name NOT IN (
  SELECT SUBSTRING(image_url FROM 'recipe-images/(.+)$')
  FROM recipes
  WHERE image_url IS NOT NULL
);
```

### Statistiques

```sql
-- Nombre de recettes par utilisateur
SELECT user_id, COUNT(*) as recipe_count
FROM recipes
GROUP BY user_id;

-- Recettes les plus likées
SELECT r.id, r.title, COUNT(l.id) as like_count
FROM recipes r
LEFT JOIN liked_recipes l ON r.id = l.recipe_id
GROUP BY r.id, r.title
ORDER BY like_count DESC
LIMIT 10;
```

---

## 📞 Support

Si tu rencontres des problèmes:
1. Vérifie que RLS est bien activé sur toutes les tables
2. Vérifie que les policies sont bien créées
3. Vérifie que le bucket `recipe-images` existe et est public
4. Consulte les logs Supabase dans le dashboard

---

## 🎉 C'est prêt !

Ta base de données Supabase est maintenant configurée et sécurisée. Tu peux commencer à développer l'intégration dans l'app ! 🚀
