import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImagePickerButton } from '@/components/image-picker-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RecipeFormData, Ingredient, MealType, Recipe } from '@/types/recipe';

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: (recipe: RecipeFormData) => void;
  onCancel: () => void;
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Initialiser avec les valeurs de la recette si en mode édition
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(recipe?.imageUrl);
  const [mealType, setMealType] = useState<MealType>(recipe?.mealType || 'déjeuner');
  const [prepTime, setPrepTime] = useState(recipe?.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime?.toString() || '');
  const [servings, setServings] = useState(recipe?.servings?.toString() || '');
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>(recipe?.difficulty || 'facile');
  const [category, setCategory] = useState(recipe?.category || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [{ id: '1', name: '', quantity: '', unit: '' }]
  );
  const [steps, setSteps] = useState<string[]>(
    recipe?.steps && recipe.steps.length > 0
      ? recipe.steps
      : ['']
  );

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', quantity: '', unit: '' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    const validSteps = steps.filter((step) => step.trim());

    if (validIngredients.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un ingrédient');
      return;
    }

    if (validSteps.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une étape');
      return;
    }

    const recipe: RecipeFormData = {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      mealType,
      ingredients: validIngredients,
      steps: validSteps,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
      difficulty,
      category: category.trim() || 'Autre',
    };

    onSubmit(recipe);
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Informations générales
        </ThemedText>

        <ImagePickerButton
          imageUri={imageUrl}
          onImageSelected={setImageUrl}
        />

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
          placeholder="Titre de la recette *"
          placeholderTextColor={colors.icon}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
          placeholder="Description"
          placeholderTextColor={colors.icon}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.smallInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Préparation (min)"
            placeholderTextColor={colors.icon}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.smallInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Cuisson (min)"
            placeholderTextColor={colors.icon}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.smallInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Portions"
            placeholderTextColor={colors.icon}
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.smallInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Catégorie"
            placeholderTextColor={colors.icon}
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <ThemedText style={styles.label}>Type de repas</ThemedText>
        <View style={styles.mealTypeContainer}>
          {(['petit-déjeuner', 'déjeuner', 'dîner', 'goûter'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                { borderColor: colors.tint },
                mealType === type && { backgroundColor: colors.tint },
              ]}
              onPress={() => setMealType(type)}
            >
              <ThemedText
                style={[
                  styles.mealTypeText,
                  mealType === type && styles.mealTypeTextActive,
                ]}
              >
                {type === 'petit-déjeuner' ? 'Petit-déj' : type.charAt(0).toUpperCase() + type.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.label}>Difficulté</ThemedText>
        <View style={styles.difficultyContainer}>
          {(['facile', 'moyen', 'difficile'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                { borderColor: colors.tint },
                difficulty === level && { backgroundColor: colors.tint },
              ]}
              onPress={() => setDifficulty(level)}
            >
              <ThemedText
                style={[
                  styles.difficultyText,
                  difficulty === level && styles.difficultyTextActive,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Ingrédients
        </ThemedText>

        {ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.ingredientName, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Nom *"
              placeholderTextColor={colors.icon}
              value={ingredient.name}
              onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
            />
            <TextInput
              style={[styles.input, styles.ingredientQuantity, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Qté"
              placeholderTextColor={colors.icon}
              value={ingredient.quantity}
              onChangeText={(value) => updateIngredient(ingredient.id, 'quantity', value)}
            />
            <TextInput
              style={[styles.input, styles.ingredientUnit, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Unité"
              placeholderTextColor={colors.icon}
              value={ingredient.unit}
              onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
            />
            {ingredients.length > 1 && (
              <TouchableOpacity
                onPress={() => removeIngredient(ingredient.id)}
                style={styles.removeButton}
              >
                <ThemedText style={{ color: '#ef4444' }}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.tint }]}
          onPress={addIngredient}
        >
          <ThemedText style={{ color: colors.tint }}>+ Ajouter un ingrédient</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Étapes de préparation
        </ThemedText>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <ThemedText style={styles.stepNumber}>{index + 1}.</ThemedText>
            <TextInput
              style={[styles.input, styles.stepInput, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Décrivez l'étape *"
              placeholderTextColor={colors.icon}
              value={step}
              onChangeText={(value) => updateStep(index, value)}
              multiline
            />
            {steps.length > 1 && (
              <TouchableOpacity
                onPress={() => removeStep(index)}
                style={styles.removeButton}
              >
                <ThemedText style={{ color: '#ef4444' }}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.tint }]}
          onPress={addStep}
        >
          <ThemedText style={{ color: colors.tint }}>+ Ajouter une étape</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.icon }]}
          onPress={onCancel}
        >
          <ThemedText>Annuler</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, { backgroundColor: colors.tint }]}
          onPress={handleSubmit}
        >
          <ThemedText style={styles.submitButtonText}>Enregistrer</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    smallInput: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 8,
    },
    mealTypeContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    mealTypeButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    mealTypeText: {
      fontSize: 13,
    },
    mealTypeTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    difficultyContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    difficultyButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    difficultyText: {
      fontSize: 14,
    },
    difficultyTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    ingredientRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    ingredientName: {
      flex: 2,
      marginBottom: 0,
    },
    ingredientQuantity: {
      flex: 1,
      marginBottom: 0,
    },
    ingredientUnit: {
      flex: 1,
      marginBottom: 0,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    stepNumber: {
      fontSize: 16,
      fontWeight: '600',
      paddingTop: 12,
    },
    stepInput: {
      flex: 1,
      marginBottom: 0,
    },
    removeButton: {
      padding: 8,
    },
    addButton: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
      marginBottom: 32,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      borderWidth: 1,
    },
    submitButton: {},
    submitButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });
