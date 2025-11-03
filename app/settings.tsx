import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as UserSettingsService from "@/services/user-settings-service";
import { UserSettings } from "@/types/user-settings";

const MEAL_TYPES = [
  {
    key: "showBreakfast" as keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>,
    label: "Petit-déjeuner",
    emoji: "🍳",
    description: "Repas du matin",
  },
  {
    key: "showLunch" as keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>,
    label: "Déjeuner",
    emoji: "🍽️",
    description: "Repas du midi",
  },
  {
    key: "showDinner" as keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>,
    label: "Dîner",
    emoji: "🌙",
    description: "Repas du soir",
  },
  {
    key: "showSnack" as keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>,
    label: "Collation",
    emoji: "🍎",
    description: "Goûters et en-cas",
  },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createStyles(colors);

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await UserSettingsService.getUserSettings();
    if (error) {
      console.error("Error loading settings:", error);
      Alert.alert("Erreur", "Impossible de charger les paramètres");
    } else if (data) {
      setUserSettings(data);
    }
    setLoading(false);
  };

  const toggleMealType = async (
    key: keyof Pick<UserSettings, 'showBreakfast' | 'showLunch' | 'showDinner' | 'showSnack'>
  ) => {
    if (!userSettings) return;

    // Vérifier qu'au moins un type reste activé
    const currentlyEnabled = [
      userSettings.showBreakfast,
      userSettings.showLunch,
      userSettings.showDinner,
      userSettings.showSnack,
    ].filter(Boolean).length;

    if (currentlyEnabled === 1 && userSettings[key]) {
      Alert.alert(
        "Attention",
        "Vous devez garder au moins un type de repas activé dans votre planning."
      );
      return;
    }

    setSaving(true);

    const updates = {
      [key]: !userSettings[key],
    };

    const { data, error } = await UserSettingsService.updateUserSettings(updates);

    if (error) {
      console.error("Error updating settings:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les paramètres");
    } else if (data) {
      setUserSettings(data);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des paramètres...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Planning */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Planning des repas
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
            Choisissez les types de repas à afficher dans votre planning hebdomadaire.
            Au moins un type doit rester activé.
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {MEAL_TYPES.map((mealType, index) => {
              const isEnabled = userSettings?.[mealType.key] ?? true;
              const isLast = index === MEAL_TYPES.length - 1;

              return (
                <View key={mealType.key}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => toggleMealType(mealType.key)}
                    disabled={saving}
                  >
                    <View style={styles.settingItemLeft}>
                      <View
                        style={[
                          styles.emojiContainer,
                          {
                            backgroundColor: isEnabled
                              ? colors.tint + "20"
                              : colors.icon + "10",
                          },
                        ]}
                      >
                        <Text style={styles.emoji}>{mealType.emoji}</Text>
                      </View>
                      <View style={styles.settingItemText}>
                        <Text
                          style={[
                            styles.settingLabel,
                            { color: colors.text },
                            !isEnabled && { opacity: 0.5 },
                          ]}
                        >
                          {mealType.label}
                        </Text>
                        <Text
                          style={[
                            styles.settingDescription,
                            { color: colors.tabIconDefault },
                            !isEnabled && { opacity: 0.5 },
                          ]}
                        >
                          {mealType.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.settingItemRight}>
                      {saving ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <Icon
                          name={
                            isEnabled
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          size={28}
                          color={isEnabled ? colors.tint : colors.icon}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  {!isLast && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.icon + "20" },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.tint + "10" }]}>
          <Icon
            name="information"
            size={20}
            color={colors.tint}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors.tint }]}>
            Les modifications sont sauvegardées automatiquement et s'appliquent
            immédiatement à votre planning.
          </Text>
        </View>

        {/* Section À venir */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Autres paramètres
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.comingSoonItem}>
              <Icon name="theme-light-dark" size={24} color={colors.icon} />
              <Text style={[styles.comingSoonText, { color: colors.tabIconDefault }]}>
                Thème de l'application
              </Text>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.icon + "20" }]}
            />

            <View style={styles.comingSoonItem}>
              <Icon name="translate" size={24} color={colors.icon} />
              <Text style={[styles.comingSoonText, { color: colors.tabIconDefault }]}>
                Langue
              </Text>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    card: {
      borderRadius: 16,
      overflow: "hidden",
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    settingItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    emojiContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    emoji: {
      fontSize: 24,
    },
    settingItemText: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
    },
    settingItemRight: {
      marginLeft: 12,
    },
    divider: {
      height: 1,
      marginLeft: 80,
    },
    infoCard: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 12,
      marginBottom: 32,
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    comingSoonItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    comingSoonText: {
      flex: 1,
      fontSize: 16,
      marginLeft: 16,
    },
    comingSoonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    comingSoonBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
