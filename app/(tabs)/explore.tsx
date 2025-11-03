import { MealTypeFilter } from "@/components/meal-type-filter";
import { SwipeCard } from "@/components/swipe-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useRecipes } from "@/contexts/recipe-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MealType } from "@/types/recipe";
import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { recipes, likeRecipe, rejectRecipe, likedRecipes, rejectedRecipes } =
    useRecipes();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedRecipes, setSwipedRecipes] = useState<Set<string>>(new Set());
  const [selectedMealType, setSelectedMealType] = useState<MealType>("tous");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Récupérer l'ID de l'utilisateur actuel
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Filtrer les recettes par type de repas, non swipées, et exclure les recettes de l'utilisateur
  const availableRecipes = recipes.filter((recipe) => {
    const matchesMealType =
      selectedMealType === "tous" || recipe.mealType === selectedMealType;
    const notSwiped = !swipedRecipes.has(recipe.id);
    const notOwnRecipe = currentUserId ? recipe.userId !== currentUserId : true;
    return matchesMealType && notSwiped && notOwnRecipe;
  });

  const currentRecipe = availableRecipes[currentIndex];
  const nextRecipe = availableRecipes[currentIndex + 1];

  const handleSwipeLeft = () => {
    if (currentRecipe) {
      rejectRecipe(currentRecipe.id);
      setSwipedRecipes((prev) => new Set(prev).add(currentRecipe.id));
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentRecipe) {
      likeRecipe(currentRecipe.id);
      setSwipedRecipes((prev) => new Set(prev).add(currentRecipe.id));
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setSwipedRecipes(new Set());
    setCurrentIndex(0);
  };

  const handleMealTypeChange = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setCurrentIndex(0);
  };

  const styles = createStyles(colors);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title">Explorer</ThemedText>
        </ThemedView>

        <MealTypeFilter
          selectedMealType={selectedMealType}
          onSelectMealType={handleMealTypeChange}
        />

        {availableRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>🍽️</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Plus de recettes !
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {recipes.length === 0
                ? "Ajoutez des recettes dans l'onglet Mes Recettes pour commencer à explorer."
                : "Vous avez parcouru toutes les recettes disponibles."}
            </ThemedText>
            {swipedRecipes.size > 0 && (
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.tint }]}
                onPress={handleReset}
              >
                <ThemedText style={styles.resetButtonText}>
                  Recommencer
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.cardContainer}>
              {nextRecipe && (
                <SwipeCard
                  recipe={nextRecipe}
                  onSwipeLeft={() => {}}
                  onSwipeRight={() => {}}
                  isTop={false}
                />
              )}
              {currentRecipe && (
                <SwipeCard
                  recipe={currentRecipe}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  isTop={true}
                />
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleSwipeLeft}
              >
                <ThemedText style={styles.actionIcon}>✕</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleSwipeRight}
              >
                <ThemedText style={styles.actionIcon}>❤️</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.instructions}>
              <ThemedText style={styles.instructionText}>
                Swipez à gauche pour rejeter, à droite pour aimer
              </ThemedText>
            </View>
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 8,
    },
    stats: {
      flexDirection: "row",
      gap: 16,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statEmoji: {
      fontSize: 18,
    },
    statNumber: {
      fontSize: 16,
      fontWeight: "600",
    },
    cardContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 40,
      paddingVertical: 20,
    },
    actionButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    rejectButton: {
      backgroundColor: "#ef4444",
    },
    likeButton: {
      backgroundColor: "#10b981",
    },
    actionIcon: {
      fontSize: 28,
    },
    instructions: {
      paddingHorizontal: 32,
      paddingBottom: 16,
      alignItems: "center",
    },
    instructionText: {
      fontSize: 13,
      opacity: 0.6,
      textAlign: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      marginBottom: 8,
    },
    emptyText: {
      textAlign: "center",
      opacity: 0.7,
      marginBottom: 24,
      lineHeight: 22,
    },
    resetButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    resetButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
  });
