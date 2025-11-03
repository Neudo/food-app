import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export interface SelectOption<T = string> {
  value: T;
  label: string;
  emoji?: string;
  count?: number;
}

interface CustomSelectProps<T = string> {
  options: SelectOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  placeholder?: string;
  showCount?: boolean;
}

export function CustomSelect<T = string>({
  options,
  selectedValue,
  onSelect,
  placeholder = "Sélectionner",
  showCount = false,
}: CustomSelectProps<T>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const selectedItem = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.container}>
      <SelectDropdown
        data={options}
        onSelect={(selectedItem) => {
          onSelect(selectedItem.value);
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={[styles.dropdownButton, { borderColor: colors.border }]}>
              {selectedItem?.emoji && (
                <Text style={styles.emoji}>{selectedItem.emoji}</Text>
              )}
              <Text style={[styles.dropdownButtonText, { color: colors.text }]}>
                {selectedItem?.label || placeholder}
                {showCount && selectedItem?.count !== undefined && ` (${selectedItem.count})`}
              </Text>
              <Icon
                name={isOpened ? "chevron-up" : "chevron-down"}
                style={[styles.dropdownArrow, { color: colors.tabIconDefault }]}
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
              {item.emoji && <Text style={styles.emoji}>{item.emoji}</Text>}
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                {item.label}
                {showCount && item.count !== undefined && ` (${item.count})`}
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
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 10,
      backgroundColor: colors.card,
    },
    emoji: {
      fontSize: 20,
    },
    dropdownButtonText: {
      flex: 1,
      fontSize: 15,
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
  });
