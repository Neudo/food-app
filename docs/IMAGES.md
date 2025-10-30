# Gestion des Images dans l'Application

## Fonctionnalités Implémentées

### 📸 Sélection d'Images

L'application permet maintenant d'ajouter des photos aux recettes via deux méthodes :
- **Prendre une photo** avec l'appareil photo du téléphone
- **Choisir depuis la galerie** une photo existante

### 🔧 Composants Créés

#### `ImagePickerButton` (`/components/image-picker-button.tsx`)
Composant réutilisable qui gère :
- Demande de permissions (caméra et galerie)
- Interface utilisateur intuitive
- Prévisualisation de l'image sélectionnée
- Possibilité de modifier l'image après sélection
- Gestion des erreurs

**Props :**
- `imageUri?: string` - URI de l'image actuelle
- `onImageSelected: (uri: string) => void` - Callback lors de la sélection

### 📝 Intégration dans le Formulaire

Le composant `RecipeForm` a été mis à jour pour inclure :
- Sélecteur d'images en haut du formulaire
- Sauvegarde de l'URI de l'image avec la recette
- Champ `imageUrl` ajouté au type `RecipeFormData`

### 🎴 Affichage dans les Cartes

Le composant `SwipeCard` affiche maintenant :
- Image de la recette en haut de la carte (200px de hauteur)
- Design responsive avec `resizeMode="cover"`
- Gestion gracieuse si aucune image n'est fournie

### 🖼️ Images Mock

Les 5 recettes de test incluent maintenant des images provenant d'Unsplash :
1. **Pâtes Carbonara** - Photo de pâtes italiennes
2. **Salade César** - Photo de salade fraîche
3. **Tarte Tatin** - Photo de tarte aux pommes
4. **Bœuf Bourguignon** - Photo de plat mijoté
5. **Smoothie Bowl** - Photo de smoothie bowl coloré

## Permissions Requises

L'application demande automatiquement les permissions suivantes :
- `CAMERA` - Pour prendre des photos
- `MEDIA_LIBRARY` - Pour accéder à la galerie

## Utilisation

### Dans le Formulaire de Création de Recette

```tsx
<ImagePickerButton
  imageUri={imageUrl}
  onImageSelected={setImageUrl}
/>
```

### Dans la Carte de Swipe

```tsx
{recipe.imageUrl && (
  <Image
    source={{ uri: recipe.imageUrl }}
    style={styles.recipeImage}
    resizeMode="cover"
  />
)}
```

## Configuration

### Package Installé
- `expo-image-picker@17.0.8`

### Aspect Ratio
Les images sont recadrées en format **16:9** lors de la sélection pour un affichage cohérent.

### Qualité
Compression à **0.8** pour optimiser la taille des fichiers tout en gardant une bonne qualité.

## Notes Techniques

- Les images sont stockées localement via leur URI
- Pour la production, il faudra implémenter l'upload vers un serveur/cloud
- Les permissions sont gérées automatiquement par le composant
- Compatible iOS et Android

## Prochaines Étapes (Production)

1. **Upload vers le cloud** (Firebase Storage, AWS S3, etc.)
2. **Compression optimisée** pour réduire la bande passante
3. **Cache des images** pour améliorer les performances
4. **Placeholder** pendant le chargement des images
5. **Gestion des erreurs** de chargement d'images distantes
