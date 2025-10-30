import { ImagePickerButton } from "@/components/image-picker-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ingredient, MealType, Recipe, RecipeFormData } from "@/types/recipe";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: (recipe: RecipeFormData) => void;
  onCancel: () => void;
}

const MEAL_TYPES = [
  { value: "petit-déjeuner" as MealType, label: "Petit-déjeuner", emoji: "🍳" },
  { value: "repas-complet" as MealType, label: "Repas complet", emoji: "🍽️" },
  { value: "collation" as MealType, label: "Collation", emoji: "🍎" },
];

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [isSimple, setIsSimple] = useState(recipe?.isSimple || false);
  
  // Nombre d'étapes dynamique: 2 pour recette simple, 5 pour recette complète
  const totalSteps = isSimple ? 2 : 5;

  // Réinitialiser l'étape à 1 quand on change le mode recette simple
  useEffect(() => {
    if (currentStep > totalSteps) {
      setCurrentStep(1);
    }
  }, [isSimple, totalSteps, currentStep]);
  const [title, setTitle] = useState(recipe?.title || "");
  const [notes, setNotes] = useState(recipe?.notes || "");
  const [mealType, setMealType] = useState<MealType>(
    recipe?.mealType || "repas-complet"
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    recipe?.imageUrl
  );

  const [servings, setServings] = useState(recipe?.servings?.toString() || "");
  const [prepTime, setPrepTime] = useState(recipe?.prepTime?.toString() || "");
  const [cookTime, setCookTime] = useState(recipe?.cookTime?.toString() || "");
  const [description, setDescription] = useState(recipe?.description || "");

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [{ id: "1", name: "", quantity: "", unit: "" }]
  );

  const [steps, setSteps] = useState<string[]>(
    recipe?.steps && recipe.steps.length > 0 ? recipe.steps : [""]
  );

  const [equipment, setEquipment] = useState<string[]>(
    recipe?.equipment && recipe.equipment.length > 0 ? recipe.equipment : []
  );

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: "", quantity: "", unit: "" },
    ]);
  };

  const updateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const addStep = () => {
    setSteps([...steps, ""]);
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

  const addEquipment = () => {
    setEquipment([...equipment, ""]);
  };

  const updateEquipment = (index: number, value: string) => {
    const newEquipment = [...equipment];
    newEquipment[index] = value;
    setEquipment(newEquipment);
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!title.trim()) {
          Alert.alert("Erreur", "Le titre est obligatoire");
          return false;
        }
        return true;
      case 2:
        return true; // Tous les champs sont optionnels
      case 3:
        const validIngredients = ingredients.filter((ing) => ing.name.trim());
        if (validIngredients.length === 0) {
          Alert.alert("Erreur", "Ajoutez au moins un ingrédient");
          return false;
        }
        return true;
      case 4:
        const validSteps = steps.filter((step) => step.trim());
        if (validSteps.length === 0) {
          Alert.alert("Erreur", "Ajoutez au moins une étape");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Pour les recettes simples, on ne valide que le titre, l'image et les notes
    if (isSimple) {
      const recipeData: RecipeFormData = {
        title: title.trim(),
        description: "",
        imageUrl,
        mealType,
        isSimple: true,
        notes: notes.trim() || undefined,
        ingredients: [],
        steps: [],
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        difficulty: "facile",
        category: "Autre",
      };
      onSubmit(recipeData);
      return;
    }

    // Pour les recettes complètes
    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    const validSteps = steps.filter((step) => step.trim());
    const validEquipment = equipment.filter((item) => item.trim());

    const recipeData: RecipeFormData = {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      mealType,
      isSimple: false,
      notes: notes.trim() || undefined,
      ingredients: validIngredients,
      equipment: validEquipment.length > 0 ? validEquipment : undefined,
      steps: validSteps,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
      difficulty: "facile",
      category: "Autre",
    };

    onSubmit(recipeData);
  };

  const selectedMealType = MEAL_TYPES.find((mt) => mt.value === mealType);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Informations de base
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Commençons par les informations essentielles de votre recette
            </ThemedText>

            {/* Toggle Recette Simple */}
            <TouchableOpacity
              style={[
                styles.simpleToggle,
                { borderColor: isSimple ? colors.tint : colors.icon },
                isSimple && { backgroundColor: colors.tint + "20" },
              ]}
              onPress={() => setIsSimple(!isSimple)}
            >
              <View style={styles.simpleToggleContent}>
                <Icon
                  name={isSimple ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={isSimple ? colors.tint : colors.icon}
                />
                <View style={styles.simpleToggleText}>
                  <ThemedText style={styles.simpleToggleTitle}>
                    Recette simple
                  </ThemedText>
                  <ThemedText style={styles.simpleToggleSubtitle}>
                    Seulement image, titre et notes
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>

            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="Titre de la recette *"
              placeholderTextColor={colors.icon}
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText style={styles.label}>Type de repas</ThemedText>
            <SelectDropdown
              data={MEAL_TYPES}
              onSelect={(selectedItem) => {
                setMealType(selectedItem.value);
              }}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View
                    style={[
                      styles.dropdownButton,
                      { borderColor: colors.tint },
                    ]}
                  >
                    <ThemedText style={styles.emoji}>
                      {(selectedItem && selectedItem.emoji) || "🍽️"}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.dropdownButtonText,
                        { color: colors.text },
                      ]}
                    >
                      {(selectedItem && selectedItem.label) ||
                        "Sélectionner un type"}
                    </ThemedText>
                    <Icon
                      name={isOpened ? "chevron-up" : "chevron-down"}
                      style={[styles.dropdownArrow, { color: colors.tint }]}
                    />
                  </View>
                );
              }}
              renderItem={(item, index, isSelected) => {
                return (
                  <View
                    style={[
                      styles.dropdownItem,
                      { backgroundColor: colors.background },
                      isSelected && { backgroundColor: colors.tint + "20" },
                    ]}
                  >
                    <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
                    <ThemedText
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      {item.label}
                    </ThemedText>
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
              dropdownStyle={[
                styles.dropdownMenu,
                { backgroundColor: colors.card },
              ]}
              defaultValue={selectedMealType}
            />

            <ThemedText style={styles.label}>Photo (optionnel)</ThemedText>
            <ImagePickerButton
              imageUri={imageUrl}
              onImageSelected={setImageUrl}
            />

            <ThemedText style={styles.label}>Notes (optionnel)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="Ajoutez des notes, astuces ou commentaires..."
              placeholderTextColor={colors.icon}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      case 2:
        // Si recette simple, afficher le récapitulatif
        if (isSimple) {
          return (
            <ScrollView
              style={styles.stepContent}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText type="subtitle" style={styles.stepTitle}>
                Récapitulatif
              </ThemedText>
              <ThemedText style={styles.stepDescription}>
                Vérifiez votre recette avant de l&apos;enregistrer
              </ThemedText>

              <View
                style={[styles.previewCard, { backgroundColor: colors.card }]}
              >
                {imageUrl && (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                )}

                <View style={styles.previewContent}>
                  <ThemedText type="subtitle" style={styles.previewTitle}>
                    {title}
                  </ThemedText>

                  <View style={styles.previewMeta}>
                    <View style={styles.previewMetaItem}>
                      <ThemedText style={styles.previewEmoji}>
                        {selectedMealType?.emoji}
                      </ThemedText>
                      <ThemedText style={styles.previewMetaText}>
                        {selectedMealType?.label}
                      </ThemedText>
                    </View>
                  </View>

                  {notes && (
                    <View style={styles.previewSection}>
                      <ThemedText style={styles.previewSectionTitle}>
                        Notes
                      </ThemedText>
                      <ThemedText style={styles.previewText}>
                        {notes}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          );
        }

        // Sinon, afficher les détails de préparation (recette complète)
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Détails de préparation
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Quelques informations pratiques sur votre recette
            </ThemedText>

            <ThemedText style={styles.label}>Portions</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="Nombre de personnes (ex: 4)"
              placeholderTextColor={colors.icon}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Préparation (min)</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.icon },
                  ]}
                  placeholder="15"
                  placeholderTextColor={colors.icon}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Cuisson (min)</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.icon },
                  ]}
                  placeholder="30"
                  placeholderTextColor={colors.icon}
                  value={cookTime}
                  onChangeText={setCookTime}
                  keyboardType="numeric"
                />
                ≠{" "}
              </View>
            </View>

            <ThemedText style={styles.label}>Notes (optionnel)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="Ajoutez des notes personnelles, astuces ou variantes..."
              placeholderTextColor={colors.icon}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Ingrédients
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Listez tous les ingrédients nécessaires
            </ThemedText>

            <ScrollView
              style={styles.ingredientsList}
              showsVerticalScrollIndicator={false}
            >
              {ingredients.map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.ingredientName,
                      { color: colors.text, borderColor: colors.icon },
                    ]}
                    placeholder="Nom *"
                    placeholderTextColor={colors.icon}
                    value={ingredient.name}
                    onChangeText={(value) =>
                      updateIngredient(ingredient.id, "name", value)
                    }
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.ingredientQuantity,
                      { color: colors.text, borderColor: colors.icon },
                    ]}
                    placeholder="Qté"
                    placeholderTextColor={colors.icon}
                    value={ingredient.quantity}
                    onChangeText={(value) =>
                      updateIngredient(ingredient.id, "quantity", value)
                    }
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.ingredientUnit,
                      { color: colors.text, borderColor: colors.icon },
                    ]}
                    placeholder="Unité"
                    placeholderTextColor={colors.icon}
                    value={ingredient.unit}
                    onChangeText={(value) =>
                      updateIngredient(ingredient.id, "unit", value)
                    }
                  />
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeIngredient(ingredient.id)}
                      style={styles.removeButton}
                    >
                      <Icon name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.tint }]}
                onPress={addIngredient}
              >
                <Icon name="plus" size={20} color={colors.tint} />
                <ThemedText style={{ color: colors.tint, marginLeft: 8 }}>
                  Ajouter un ingrédient
                </ThemedText>
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.sectionDivider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
              </View>

              {/* Section Accessoires */}
              <View style={styles.equipmentSection}>
                <ThemedText style={styles.label}>
                  🔧 Accessoires requis (optionnel)
                </ThemedText>
                <ThemedText
                  style={[styles.stepDescription, { marginBottom: 12 }]}
                >
                  Ustensiles, appareils ou équipements nécessaires
                </ThemedText>
              </View>

              {equipment.map((item, index) => (
                <View key={index} style={styles.equipmentRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.equipmentInput,
                      { color: colors.text, borderColor: colors.icon },
                    ]}
                    placeholder="Ex: Fouet, Robot mixeur, Moule à cake..."
                    placeholderTextColor={colors.icon}
                    value={item}
                    onChangeText={(value) => updateEquipment(index, value)}
                  />
                  <TouchableOpacity
                    onPress={() => removeEquipment(index)}
                    style={styles.removeButton}
                  >
                    <Icon name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.tint }]}
                onPress={addEquipment}
              >
                <Icon name="plus" size={20} color={colors.tint} />
                <ThemedText style={{ color: colors.tint, marginLeft: 8 }}>
                  Ajouter un accessoire
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Étapes de préparation
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Décrivez les étapes une par une
            </ThemedText>

            <ScrollView
              style={styles.stepsList}
              showsVerticalScrollIndicator={false}
            >
              {steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepNumberBadge,
                      { backgroundColor: colors.tint },
                    ]}
                  >
                    <ThemedText style={styles.stepNumberText}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.stepInput,
                      { color: colors.text, borderColor: colors.icon },
                    ]}
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
                      <Icon name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.tint }]}
                onPress={addStep}
              >
                <Icon name="plus" size={20} color={colors.tint} />
                <ThemedText style={{ color: colors.tint, marginLeft: 8 }}>
                  Ajouter une étape
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );

      case 5:
        const validIngredients = ingredients.filter((ing) => ing.name.trim());
        const validSteps = steps.filter((step) => step.trim());
        const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

        return (
          <ScrollView
            style={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="subtitle" style={styles.stepTitle}>
              Récapitulatif
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Vérifiez votre recette avant de l&apos;enregistrer
            </ThemedText>

            <View
              style={[styles.previewCard, { backgroundColor: colors.card }]}
            >
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              )}

              <View style={styles.previewContent}>
                <ThemedText type="subtitle" style={styles.previewTitle}>
                  {title}
                </ThemedText>

                <View style={styles.previewMeta}>
                  <View style={styles.previewMetaItem}>
                    <ThemedText style={styles.previewEmoji}>
                      {selectedMealType?.emoji}
                    </ThemedText>
                    <ThemedText style={styles.previewMetaText}>
                      {selectedMealType?.label}
                    </ThemedText>
                  </View>
                  {totalTime > 0 && (
                    <View style={styles.previewMetaItem}>
                      <ThemedText style={styles.previewEmoji}>⏱️</ThemedText>
                      <ThemedText style={styles.previewMetaText}>
                        {totalTime} min
                      </ThemedText>
                    </View>
                  )}
                  {servings && (
                    <View style={styles.previewMetaItem}>
                      <ThemedText style={styles.previewEmoji}>👥</ThemedText>
                      <ThemedText style={styles.previewMetaText}>
                        {servings} pers.
                      </ThemedText>
                    </View>
                  )}
                </View>

                {description && (
                  <View style={styles.previewSection}>
                    <ThemedText style={styles.previewSectionTitle}>
                      Notes
                    </ThemedText>
                    <ThemedText style={styles.previewText}>
                      {description}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.previewSection}>
                  <ThemedText style={styles.previewSectionTitle}>
                    Ingrédients ({validIngredients.length})
                  </ThemedText>
                  {validIngredients.map((ing, index) => (
                    <ThemedText key={index} style={styles.previewText}>
                      • {ing.quantity} {ing.unit} {ing.name}
                    </ThemedText>
                  ))}
                </View>

                <View style={styles.previewSection}>
                  <ThemedText style={styles.previewSectionTitle}>
                    Préparation ({validSteps.length} étapes)
                  </ThemedText>
                  {validSteps.map((step, index) => (
                    <View key={index} style={styles.previewStepItem}>
                      <ThemedText style={styles.previewStepNumber}>
                        {index + 1}.
                      </ThemedText>
                      <ThemedText style={styles.previewText}>{step}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    index < currentStep ? colors.tint : colors.icon + "30",
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={styles.progressText}>
          Étape {currentStep} sur {totalSteps}
        </ThemedText>
      </View>

      {/* Step content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              { borderColor: colors.icon },
            ]}
            onPress={handlePrevious}
          >
            <Icon name="chevron-left" size={20} color={colors.text} />
            <ThemedText>Retour</ThemedText>
          </TouchableOpacity>
        )}

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: colors.tint },
            ]}
            onPress={handleNext}
          >
            <ThemedText style={styles.nextButtonText}>Suivant</ThemedText>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.submitButton,
              { backgroundColor: colors.tint },
            ]}
            onPress={handleSubmit}
          >
            <Icon name="check" size={20} color="#fff" />
            <ThemedText style={styles.submitButtonText}>Enregistrer</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navButton, styles.cancelButton]}
          onPress={onCancel}
        >
          <ThemedText style={{ color: "#ef4444" }}>Annuler</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    progressContainer: {
      padding: 16,
      paddingBottom: 8,
    },
    progressBar: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    progressStep: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 13,
      textAlign: "center",
      opacity: 0.7,
    },
    content: {
      flex: 1,
    },
    stepContent: {
      padding: 16,
    },
    stepTitle: {
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 24,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      fontSize: 16,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    inputGroup: {
      flex: 1,
    },
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 10,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    emoji: {
      fontSize: 20,
    },
    dropdownButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
    },
    dropdownArrow: {
      fontSize: 20,
    },
    dropdownMenu: {
      borderRadius: 12,
      marginTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    dropdownItemText: {
      fontSize: 15,
      fontWeight: "500",
    },
    ingredientsList: {
      maxHeight: 400,
    },
    ingredientRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 12,
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
    equipmentRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 12,
    },
    equipmentInput: {
      flex: 1,
      marginBottom: 0,
    },
    sectionDivider: {
      marginVertical: 24,
      alignItems: "center",
    },
    dividerLine: {
      width: "100%",
      height: 1,
      opacity: 0.5,
    },
    equipmentSection: {
      marginBottom: 16,
    },
    stepsList: {
      maxHeight: 400,
    },
    stepRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
      marginBottom: 16,
    },
    stepNumberBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    stepNumberText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
    },
    stepInput: {
      flex: 1,
      marginBottom: 0,
      minHeight: 60,
    },
    removeButton: {
      padding: 4,
      marginTop: 8,
    },
    addButton: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "center",
    },
    previewCard: {
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    previewImage: {
      width: "100%",
      height: 200,
      backgroundColor: colors.icon + "20",
    },
    previewContent: {
      padding: 16,
    },
    previewTitle: {
      marginBottom: 12,
    },
    previewMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 16,
    },
    previewMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    previewEmoji: {
      fontSize: 16,
    },
    previewMetaText: {
      fontSize: 14,
      opacity: 0.8,
    },
    previewSection: {
      marginTop: 16,
    },
    previewSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },
    previewText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
      opacity: 0.9,
    },
    previewStepItem: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    previewStepNumber: {
      fontWeight: "700",
      fontSize: 14,
    },
    simpleToggle: {
      borderWidth: 2,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    simpleToggleContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    simpleToggleText: {
      flex: 1,
    },
    simpleToggleTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    simpleToggleSubtitle: {
      fontSize: 13,
      opacity: 0.7,
    },
    notesInput: {
      minHeight: 100,
      paddingTop: 12,
    },
    navigationContainer: {
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.icon + "20",
    },
    navButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    backButton: {
      borderWidth: 1.5,
    },
    nextButton: {
      marginBottom: 0,
    },
    nextButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    submitButton: {
      marginBottom: 0,
    },
    submitButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    cancelButton: {
      padding: 12,
    },
  });
