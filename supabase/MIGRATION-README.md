# 📋 Guide de Migration - Planning et User Settings

## 🎯 Objectif

Ce fichier ajoute les nouvelles fonctionnalités de planning et de préférences utilisateur sans toucher aux tables existantes.

## 📦 Ce qui est ajouté

### 1. Table `user_settings`
- Stocke les préférences d'affichage des types de repas
- Création automatique des préférences par défaut
- RLS activé avec policies

### 2. Table `meal_plans` (améliorée)
- Permet plusieurs repas du même type par jour
- Suppression de la contrainte UNIQUE
- RLS activé avec policies

## 🚀 Installation

### Étape 1: Exécuter la migration

1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Créer une nouvelle requête
4. Copier-coller le contenu de `migration-planning.sql`
5. Cliquer sur **Run** (ou Ctrl/Cmd + Enter)

### Étape 2: Vérifier l'installation

La requête affiche automatiquement:
- ✅ Les tables créées
- ✅ Le nombre de policies par table
- ✅ La liste des policies

**Résultat attendu:**
```
table_name     | policy_count
---------------+-------------
meal_plans     | 4
user_settings  | 3
```

### Étape 3: Tester dans l'application

1. Ouvrir l'app
2. Aller dans l'onglet **Planning**
3. Cliquer sur l'icône ⚙️ (paramètres)
4. Décocher/cocher des types de repas
5. Les préférences sont sauvegardées automatiquement !

## 🔍 Vérifications manuelles (optionnel)

### Vérifier la table user_settings
```sql
SELECT * FROM public.user_settings;
```

### Vérifier la table meal_plans
```sql
SELECT * FROM public.meal_plans;
```

### Vérifier les policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_settings', 'meal_plans');
```

## ⚠️ Notes importantes

- ✅ **Idempotent**: Le script peut être exécuté plusieurs fois sans erreur
- ✅ **Sécurisé**: Utilise des blocs `DO $$ ... END $$` pour éviter les doublons
- ✅ **Non destructif**: Ne modifie pas les tables existantes
- ✅ **RLS activé**: Toutes les données sont isolées par utilisateur

## 🐛 En cas d'erreur

### Erreur: "relation already exists"
➡️ Normal, le script gère les doublons automatiquement

### Erreur: "function handle_updated_at does not exist"
➡️ Exécuter d'abord `schema.sql` pour créer la fonction

### Erreur de permissions
➡️ Vérifier que vous êtes connecté avec un compte admin Supabase

## 📞 Support

Si tu rencontres des problèmes:
1. Vérifier les logs dans Supabase Dashboard
2. Vérifier que la table `recipes` existe déjà
3. Vérifier que la fonction `handle_updated_at()` existe

---

## ✅ Checklist

- [ ] Fichier `migration-planning.sql` exécuté
- [ ] Tables `user_settings` et `meal_plans` créées
- [ ] Policies créées (7 au total)
- [ ] Test dans l'app: paramètres de planning fonctionnels
- [ ] Test dans l'app: ajout de plusieurs repas du même type

🎉 Migration terminée !
