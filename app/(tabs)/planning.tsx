import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecipes } from "@/contexts/recipe-context";
import { Recipe, MealType } from "@/types/recipe";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const MEAL_TYPES: {
  type: MealType;
  label: string;
  emoji: string;
  id: string;
}[] = [
  { type: "petit-déjeuner", label: "Petit-déj", emoji: "🍳", id: "breakfast" },
  { type: "déjeuner", label: "Déj", emoji: "🍽️", id: "lunch" },
  { type: "dîner", label: "Dîner", emoji: "🌙", id: "dinner" },
  { type: "collation", label: "Collation", emoji: "🍎", id: "snack" },
];

export default function PlanningScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    recipes,
    likedRecipes,
    plannedMeals,
    addPlannedMeal,
    removePlannedMeal,
    getPlannedMealsForDate,
  } = useRecipes();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Lundi = premier jour
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Générer les 7 jours de la semaine
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push({
        date: date,
        dateString: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("fr-FR", { weekday: "short" }),
        dayNumber: date.getDate(),
      });
    }
    return days;
  }, [currentWeekStart]);

  const availableRecipes = likedRecipes.length > 0 ? likedRecipes : recipes;

  // Filtrer les recettes par recherche
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return availableRecipes;

    const query = searchQuery.toLowerCase();
    return availableRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
    );
  }, [availableRecipes, searchQuery]);

  const getWeekTitle = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
      return currentWeekStart.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    } else {
      return `${currentWeekStart.toLocaleDateString("fr-FR", {
        month: "short",
      })} - ${weekEnd.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })}`;
    }
  };

  const handleDayPress = (dateString: string) => {
    setSelectedDate(dateString);
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    setCurrentWeekStart(monday);
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  const handleAddMealForType = (mealType: MealType) => {
    // Ouvre la modal de sélection de recettes avec le type pré-sélectionné
    setSelectedMealType(mealType);
    setMealTypeModalVisible(false);
    setRecipeModalVisible(true);
  };

  const handleOpenMealTypeModal = () => {
    setMealTypeModalVisible(true);
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    if (selectedDate && selectedMealType) {
      addPlannedMeal(selectedDate, selectedMealType, recipe);
    }
    setRecipeModalVisible(false);
    setSelectedMealType(null);
    setSearchQuery("");
  };

  const handleRandomRecipe = () => {
    if (filteredRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
      handleRecipeSelect(filteredRecipes[randomIndex]);
    }
  };

  const handleRemoveMeal = (date: string, mealType: MealType) => {
    removePlannedMeal(date, mealType);
  };

  const mealsForSelectedDate = selectedDate
    ? getPlannedMealsForDate(selectedDate)
    : [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Planning des repas
        </Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Organisez vos repas de la semaine
        </Text>
      </View>

      {/* Vue semaine personnalisée */}
      <View style={[styles.weekContainer, { backgroundColor: colors.card }]}>
        <View style={styles.weekHeader}>
          <TouchableOpacity
            onPress={goToPreviousWeek}
            style={styles.arrowButton}
          >
            <Text style={[styles.arrowText, { color: colors.tint }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday}>
            <Text style={[styles.weekTitle, { color: colors.text }]}>
              {getWeekTitle()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToNextWeek} style={styles.arrowButton}>
            <Text style={[styles.arrowText, { color: colors.tint }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {weekDays.map((day) => {
            const isSelected = day.dateString === selectedDate;
            const isToday =
              day.dateString === new Date().toISOString().split("T")[0];
            const hasMeals = plannedMeals.some(
              (meal) => meal.date === day.dateString
            );

            return (
              <TouchableOpacity
                key={day.dateString}
                style={[
                  styles.dayButton,
                  isSelected && { backgroundColor: colors.tint },
                ]}
                onPress={() => handleDayPress(day.dateString)}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: isSelected ? "#fff" : colors.tabIconDefault },
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected
                        ? "#fff"
                        : isToday
                        ? colors.tint
                        : colors.text,
                    },
                    isToday && !isSelected && styles.todayNumber,
                  ]}
                >
                  {day.dayNumber}
                </Text>
                {hasMeals && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? "#fff" : colors.tint },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Menu du jour */}
      {selectedDate && (
        <View style={styles.todayMenuSection}>
          <Text style={[styles.todayMenuTitle, { color: colors.text }]}>
            Menu du jour
          </Text>

          {mealsForSelectedDate.length > 0 ? (
            <ScrollView
              style={styles.todayMenuScroll}
              showsVerticalScrollIndicator={false}
            >
              {MEAL_TYPES.map(({ type, label, emoji, id }) => {
                const meal = mealsForSelectedDate.find(
                  (m) => m.mealType === type
                );
                if (!meal) return null;

                return (
                  <View
                    key={id}
                    style={[
                      styles.todayMealCard,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <View style={styles.todayMealHeader}>
                      <Text
                        style={[styles.todayMealType, { color: colors.text }]}
                      >
                        {emoji} {label}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveMeal(selectedDate, type)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={[styles.todayRecipeName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {meal.recipe.title}
                    </Text>
                    <Text
                      style={[
                        styles.todayRecipeDetail,
                        { color: colors.tabIconDefault },
                      ]}
                    >
                      ⏱️ {meal.recipe.prepTime + meal.recipe.cookTime} min • 👥{" "}
                      {meal.recipe.servings} pers.
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={[styles.addMealCTA, { backgroundColor: colors.tint }]}
              onPress={handleOpenMealTypeModal}
            >
              <Text style={styles.addMealCTAText}>+ Ajouter un repas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal de sélection de la recette */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={recipeModalVisible}
        onRequestClose={() => setRecipeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choisir une recette
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setRecipeModalVisible(false);
                  setSearchQuery("");
                  setSelectedMealType(null);
                }}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.tabIconDefault,
                  },
                ]}
                placeholder="Rechercher une recette..."
                placeholderTextColor={colors.tabIconDefault}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[styles.randomButton, { backgroundColor: colors.tint }]}
                onPress={handleRandomRecipe}
              >
                <Text style={styles.randomButtonText}>🎲</Text>
              </TouchableOpacity>
            </View>

            {filteredRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.tabIconDefault },
                  ]}
                >
                  Aucune recette trouvée
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.recipeCard,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => handleRecipeSelect(item)}
                  >
                    <Text
                      style={[styles.modalRecipeName, { color: colors.text }]}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.recipeDetailsRow}>
                      <Text
                        style={[
                          styles.recipeDetail,
                          { color: colors.tabIconDefault },
                        ]}
                      >
                        {item.mealType}
                      </Text>
                      <Text
                        style={[
                          styles.recipeDetail,
                          { color: colors.tabIconDefault },
                        ]}
                      >
                        ⏱️ {item.prepTime + item.cookTime} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de sélection du type de repas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mealTypeModalVisible}
        onRequestClose={() => setMealTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Pour quel type de repas ?
              </Text>
              <TouchableOpacity
                onPress={() => setMealTypeModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mealTypeGrid}>
              {MEAL_TYPES.map(({ type, label, emoji, id }) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.mealTypeButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => handleAddMealForType(type)}
                >
                  <Text style={styles.mealTypeEmoji}>{emoji}</Text>
                  <Text style={[styles.mealTypeLabel, { color: colors.text }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  calendar: {
    marginBottom: 16,
  },
  weekContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
  },
  arrowText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  todayNumber: {
    fontWeight: "bold",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  todayMenuSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  todayMenuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  todayMenuScroll: {
    flex: 1,
  },
  todayMealCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todayMealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  todayMealType: {
    fontSize: 14,
    fontWeight: "600",
  },
  todayRecipeName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  todayRecipeDetail: {
    fontSize: 13,
  },
  addMealCTA: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addMealCTAText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalMealsContainer: {
    maxHeight: 450,
  },
  mealCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  assignedMeal: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  recipeName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  recipeDetail: {
    fontSize: 13,
  },
  addMealButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
  },
  addMealText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  recipeCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalRecipeName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  recipeDetailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  mealTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mealTypeButton: {
    width: "47%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  randomButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  randomButtonText: {
    fontSize: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
});
