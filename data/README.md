# Données Mock pour le Développement

## Recettes de test

Le fichier `mock-recipes.ts` contient 5 recettes de base utilisées pendant la phase de développement.

### Recettes incluses :
1. **Pâtes Carbonara** - Plat principal facile
2. **Salade César** - Entrée facile
3. **Tarte Tatin** - Dessert moyen
4. **Bœuf Bourguignon** - Plat principal difficile
5. **Smoothie Bowl Tropical** - Petit-déjeuner facile

## Comment désactiver les recettes mock

Quand vous connecterez la base de données, modifiez le fichier `/contexts/recipe-context.tsx` :

```typescript
// Remplacer cette ligne :
const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

// Par :
const [recipes, setRecipes] = useState<Recipe[]>([]);
```

Vous pouvez également supprimer l'import :
```typescript
import { mockRecipes } from '@/data/mock-recipes';
```

## Utilisation

Les recettes mock sont automatiquement chargées au démarrage de l'application, permettant de tester immédiatement :
- L'onglet Explorer avec le système de swipe
- L'affichage des recettes
- Les fonctionnalités de like/reject
