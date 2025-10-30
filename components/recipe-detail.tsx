import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Recipe } from "@/types/recipe";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
}

export function RecipeDetail({ recipe, onClose, onEdit }: RecipeDetailProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [currentStep, setCurrentStep] = useState<"ingredients" | "preparation">(
    "ingredients"
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const styles = createStyles(colors);

  const handleNext = () => {
    if (currentStep === "ingredients") {
      setCurrentStep("preparation");
      setCurrentStepIndex(0);
    } else if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else if (currentStep === "preparation") {
      setCurrentStep("ingredients");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <ThemedText style={styles.closeButtonText}>✕</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </ThemedText>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <ThemedText style={styles.editButtonText}>✏️</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Image et Info Bar - Masqués en mode préparation */}
      {currentStep === "ingredients" && (
        <>
          {recipe.imageUrl && (
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <ThemedView style={styles.infoBar}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoIcon}>⏱️</ThemedText>
              <ThemedText style={styles.infoText}>
                {recipe.prepTime + recipe.cookTime} min
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoIcon}>👥</ThemedText>
              <ThemedText style={styles.infoText}>
                {recipe.servings} pers.
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoIcon}>📊</ThemedText>
              <ThemedText style={styles.infoText}>
                {recipe.difficulty}
              </ThemedText>
            </View>
          </ThemedView>
        </>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === "ingredients" ? (
          <>
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Liste des ingrédients
              </ThemedText>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <View
                    style={[
                      styles.ingredientBullet,
                      { backgroundColor: colors.tint },
                    ]}
                  />
                  <ThemedText style={styles.ingredientText}>
                    <ThemedText style={styles.ingredientQuantity}>
                      {ingredient.quantity} {ingredient.unit}
                    </ThemedText>{" "}
                    {ingredient.name}
                  </ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* Section Accessoires */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <>
                {/* Séparateur */}
                <View style={styles.sectionDivider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
                </View>

                <ThemedView style={styles.section}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    🔧 Accessoires requis
                  </ThemedText>
                {recipe.equipment.map((item, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View
                      style={[
                        styles.ingredientBullet,
                        { backgroundColor: colors.tint },
                      ]}
                    />
                    <ThemedText style={styles.ingredientText}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
                </ThemedView>
              </>
            )}
          </>
        ) : (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Étape {currentStepIndex + 1} sur {recipe.steps.length}
            </ThemedText>
            <View style={styles.currentStepContainer}>
              <View
                style={[
                  styles.stepNumberLarge,
                  { backgroundColor: colors.tint },
                ]}
              >
                <ThemedText style={styles.stepNumberTextLarge}>
                  {currentStepIndex + 1}
                </ThemedText>
              </View>
              <ThemedText style={styles.stepTextLarge}>
                {recipe.steps[currentStepIndex]}
              </ThemedText>
            </View>
          </ThemedView>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <ThemedView style={styles.footer}>
        {currentStep === "ingredients" ? (
          <TouchableOpacity
            style={[styles.navigationButton, { backgroundColor: colors.tint }]}
            onPress={handleNext}
          >
            <ThemedText style={styles.navigationButtonText}>
              Je suis prêt(e) →
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.tint }]}
              onPress={handlePrevious}
              disabled={currentStepIndex === 0 && currentStep === "preparation"}
            >
              <ThemedText
                style={[styles.backButtonText, { color: colors.tint }]}
              >
                {currentStepIndex === 0
                  ? "← Ingrédients"
                  : "← Étape précédente"}
              </ThemedText>
            </TouchableOpacity>
            {currentStepIndex < recipe.steps.length - 1 ? (
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  { backgroundColor: colors.tint, flex: 1 },
                ]}
                onPress={handleNext}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Étape suivante →
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  { backgroundColor: "#10b981", flex: 1 },
                ]}
                onPress={onClose}
              >
                <ThemedText style={styles.navigationButtonText}>
                  ✓ Terminé
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: 24,
      fontWeight: "300",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    editButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    editButtonText: {
      fontSize: 20,
    },
    image: {
      width: "100%",
      height: 250,
    },
    infoBar: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    infoIcon: {
      fontSize: 18,
    },
    infoText: {
      fontSize: 14,
      fontWeight: "600",
    },
    tabs: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + "20",
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 16,
      fontWeight: "500",
    },
    tabTextActive: {
      fontWeight: "700",
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      marginBottom: 20,
      fontSize: 20,
    },
    ingredientItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
      gap: 12,
    },
    ingredientBullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    ingredientText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
    },
    ingredientQuantity: {
      fontWeight: "700",
    },
    currentStepContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    stepNumberLarge: {
      width: 58,
      height: 58,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    stepNumberTextLarge: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 18,
    },
    stepTextLarge: {
      fontSize: 18,
      lineHeight: 28,
      textAlign: "center",
      paddingHorizontal: 20,
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
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.icon + "20",
    },
    navigationButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    navigationButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    footerButtons: {
      flexDirection: "row",
      gap: 12,
    },
    backButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 2,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    doneButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
  });
