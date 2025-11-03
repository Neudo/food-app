import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useRecipes } from "@/contexts/recipe-context";
import { Recipe, MealType } from "@/types/recipe";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as UserSettingsService from "@/services/user-settings-service";
import { UserSettings } from "@/types/user-settings";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const MEAL_TYPES: {
  type: MealType;
  label: string;
  emoji: string;
  settingsKey: keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>;
}[] = [
  { type: "petit-déjeuner", label: "Petit-déjeuner", emoji: "🍳", settingsKey: "showBreakfast" },
  { type: "déjeuner", label: "Déjeuner", emoji: "🍽️", settingsKey: "showLunch" },
  { type: "dîner", label: "Dîner", emoji: "🌙", settingsKey: "showDinner" },
  { type: "collation", label: "Collation", emoji: "🍎", settingsKey: "showSnack" },
];

export default function PlanningScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const {
    recipes,
    likedRecipes,
    plannedMeals,
    addPlannedMeal,
    removePlannedMeal,
    getPlannedMealsForDate,
  } = useRecipes();

  // États
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Charger les préférences utilisateur
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    setLoadingSettings(true);
    const { data, error } = await UserSettingsService.getUserSettings();
    if (error) {
      console.error('Error loading user settings:', error);
    } else if (data) {
      setUserSettings(data);
    }
    setLoadingSettings(false);
  };

  const toggleMealTypeVisibility = async (settingsKey: keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>) => {
    if (!userSettings) return;

    const updates = {
      [settingsKey]: !userSettings[settingsKey],
    };

    const { data, error } = await UserSettingsService.updateUserSettings(updates);
    if (error) {
      console.error('Error updating settings:', error);
    } else if (data) {
      setUserSettings(data);
    }
  };

  // Filtrer les types de repas visibles selon les préférences
  const visibleMealTypes = useMemo(() => {
    if (!userSettings) return MEAL_TYPES;
    return MEAL_TYPES.filter(mt => userSettings[mt.settingsKey]);
  }, [userSettings]);

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
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

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDayName = (date: Date) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days[date.getDay()];
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate().toString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date: Date) => {
    return formatDate(date) === selectedDate;
  };

  // Filtrer les recettes
  const allRecipes = [...recipes, ...likedRecipes];
  const uniqueRecipes = Array.from(
    new Map(allRecipes.map((r) => [r.id, r])).values()
  );

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return uniqueRecipes;
    const query = searchQuery.toLowerCase();
    return uniqueRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query)
    );
  }, [uniqueRecipes, searchQuery]);

  const handleAddMealPress = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setIsRecipeModalVisible(true);
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (selectedMealType && selectedDate) {
      await addPlannedMeal(selectedDate, selectedMealType, recipe);
      setIsRecipeModalVisible(false);
      setSelectedMealType(null);
      setSearchQuery("");
    }
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    await removePlannedMeal(mealPlanId);
  };

  const mealsForSelectedDate = selectedDate
    ? getPlannedMealsForDate(selectedDate)
    : [];

  if (loadingSettings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Planning des repas
        </Text>
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.settingsButton}
        >
          <Icon name="cog-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Calendrier semaine */}
      <View style={[styles.weekContainer, { backgroundColor: colors.card }]}>
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.weekArrow}>
            <Icon name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={[styles.todayButtonText, { color: colors.tint }]}>
              Aujourd'hui
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToNextWeek} style={styles.weekArrow}>
            <Icon name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {weekDays.map((date) => {
            const dateStr = formatDate(date);
            const selected = isSelected(date);
            const today = isToday(date);

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayButton,
                  selected && { backgroundColor: colors.tint },
                  today && !selected && { borderColor: colors.tint, borderWidth: 2 },
                ]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: selected ? "#fff" : colors.tabIconDefault },
                  ]}
                >
                  {formatDayName(date)}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: selected ? "#fff" : colors.text },
                  ]}
                >
                  {formatDayNumber(date)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Menu du jour */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Menu du jour
        </Text>

        {visibleMealTypes.map((mealType) => {
          const mealsOfType = mealsForSelectedDate.filter(
            (m) => m.mealType === mealType.type
          );

          return (
            <View
              key={mealType.type}
              style={[styles.mealSection, { backgroundColor: colors.card }]}
            >
              <View style={styles.mealHeader}>
                <Text style={[styles.mealTypeLabel, { color: colors.text }]}>
                  {mealType.emoji} {mealType.label}
                </Text>
                <TouchableOpacity
                  onPress={() => handleAddMealPress(mealType.type)}
                  style={[styles.addButton, { backgroundColor: colors.tint }]}
                >
                  <Icon name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {mealsOfType.length > 0 ? (
                mealsOfType.map((meal) => (
                  <View
                    key={meal.id}
                    style={[styles.mealCard, { backgroundColor: colors.background }]}
                  >
                    <TouchableOpacity
                      style={styles.mealCardContent}
                      onPress={() => router.push(`/recipe/${meal.recipe.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.mealRecipeTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {meal.recipe.title}
                      </Text>
                      <Text
                        style={[styles.mealRecipeDetails, { color: colors.tabIconDefault }]}
                      >
                        ⏱️ {meal.recipe.prepTime + meal.recipe.cookTime} min • 👥{" "}
                        {meal.recipe.servings} pers.
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveMeal(meal.id!)}
                      style={styles.removeButton}
                    >
                      <Icon name="close" size={20} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                  Aucun repas planifié
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de sélection de recette */}
      <Modal
        visible={isRecipeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsRecipeModalVisible(false);
          setSearchQuery("");
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choisir une recette
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsRecipeModalVisible(false);
                setSearchQuery("");
              }}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, borderColor: colors.icon, backgroundColor: colors.card },
            ]}
            placeholder="Rechercher une recette..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recipeItem, { backgroundColor: colors.card }]}
                onPress={() => handleRecipeSelect(item)}
              >
                <Text style={[styles.recipeItemTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.recipeItemDetails, { color: colors.tabIconDefault }]}>
                  ⏱️ {item.prepTime + item.cookTime} min • 👥 {item.servings} pers.
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyListText, { color: colors.tabIconDefault }]}>
                Aucune recette trouvée
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal des paramètres */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Préférences d'affichage
            </Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsContent}>
            <Text style={[styles.settingsDescription, { color: colors.tabIconDefault }]}>
              Choisissez les types de repas à afficher dans votre planning
            </Text>

            {MEAL_TYPES.map((mealType) => (
              <TouchableOpacity
                key={mealType.type}
                style={[styles.settingItem, { backgroundColor: colors.card }]}
                onPress={() => toggleMealTypeVisibility(mealType.settingsKey)}
              >
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingEmoji}>{mealType.emoji}</Text>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {mealType.label}
                  </Text>
                </View>
                <Icon
                  name={userSettings?.[mealType.settingsKey] ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={userSettings?.[mealType.settingsKey] ? colors.tint : colors.icon}
                />
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
    },
    settingsButton: {
      padding: 8,
    },
    weekContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
    },
    weekHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    weekArrow: {
      padding: 8,
    },
    todayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    todayButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    weekDays: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayButton: {
      width: 45,
      height: 60,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    dayName: {
      fontSize: 12,
      marginBottom: 4,
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 16,
    },
    mealSection: {
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    mealTypeLabel: {
      fontSize: 18,
      fontWeight: "600",
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    mealCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    mealCardContent: {
      flex: 1,
    },
    mealRecipeTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    mealRecipeDetails: {
      fontSize: 14,
    },
    removeButton: {
      padding: 8,
    },
    emptyText: {
      fontSize: 14,
      fontStyle: "italic",
      textAlign: "center",
      paddingVertical: 12,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
    },
    searchInput: {
      margin: 16,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 16,
    },
    recipeItem: {
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
    },
    recipeItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    recipeItemDetails: {
      fontSize: 14,
    },
    emptyListText: {
      textAlign: "center",
      marginTop: 32,
      fontSize: 16,
    },
    settingsContent: {
      padding: 16,
    },
    settingsDescription: {
      fontSize: 14,
      marginBottom: 20,
      lineHeight: 20,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    settingItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    settingEmoji: {
      fontSize: 24,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
