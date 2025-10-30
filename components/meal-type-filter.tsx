import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MealType } from "@/types/recipe";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface MealTypeFilterProps {
  selectedMealType: MealType;
  onSelectMealType: (mealType: MealType) => void;
}

const mealTypes: { value: MealType; label: string; emoji: string }[] = [
  { value: "tous", label: "Tous", emoji: "🍽️" },
  { value: "petit-déjeuner", label: "Petit-déj", emoji: "🍳" },
  { value: "repas-complet", label: "Repas complet", emoji: "🍲" },
  { value: "collation", label: "Collation", emoji: "🍎" },
];

export function MealTypeFilter({
  selectedMealType,
  onSelectMealType,
}: MealTypeFilterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const selectedItem = mealTypes.find((mt) => mt.value === selectedMealType);

  return (
    <View style={styles.container}>
      <SelectDropdown
        data={mealTypes}
        onSelect={(selectedItem) => {
          onSelectMealType(selectedItem.value);
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={[styles.dropdownButton, { borderColor: colors.tint }]}>
              <Text style={styles.emoji}>
                {(selectedItem && selectedItem.emoji) || "🍽️"}
              </Text>
              <Text style={[styles.dropdownButtonText, { color: colors.text }]}>
                {(selectedItem && selectedItem.label) || "Sélectionner un type"}
              </Text>
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
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                {item.label}
              </Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={[styles.dropdownMenu, { backgroundColor: colors.card }]}
        defaultValue={selectedItem}
      />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 10,
      backgroundColor: colors.background,
    },
    emoji: {
      fontSize: 20,
    },
    dropdownButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
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
  });
