import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Recipe } from '@/types/recipe';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as RecipeService from '@/services/recipe-service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(colors);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await RecipeService.getRecipeById(id);
    
    if (error) {
      console.error('Error loading recipe:', error);
    } else if (data) {
      setRecipe(data);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Recette introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {recipe.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {recipe.imageUrl && (
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Titre et description */}
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={[styles.description, { color: colors.tabIconDefault }]}>
              {recipe.description}
            </Text>
          )}
        </View>

        {/* Informations */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {recipe.prepTime + recipe.cookTime} min
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="account-group" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {recipe.servings} pers.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="chef-hat" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {recipe.difficulty}
            </Text>
          </View>
        </View>

        {/* Ingrédients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🛒 Ingrédients
            </Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View
                key={ingredient.id || index}
                style={[styles.ingredientItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.ingredientName, { color: colors.text }]}>
                  {ingredient.name}
                </Text>
                <Text style={[styles.ingredientQuantity, { color: colors.tabIconDefault }]}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Équipement */}
        {recipe.equipment && recipe.equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔪 Équipement
            </Text>
            {recipe.equipment.map((item, index) => (
              <View
                key={index}
                style={[styles.equipmentItem, { backgroundColor: colors.card }]}
              >
                <Icon name="check-circle" size={16} color={colors.tint} />
                <Text style={[styles.equipmentText, { color: colors.text }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Étapes */}
        {recipe.steps && recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              👨‍🍳 Préparation
            </Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {recipe.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📝 Notes
            </Text>
            <Text style={[styles.notesText, { color: colors.tabIconDefault }]}>
              {recipe.notes}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
    },
    image: {
      width: '100%',
      height: 250,
    },
    section: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
    },
    infoCard: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
    },
    infoItem: {
      alignItems: 'center',
      gap: 4,
    },
    infoText: {
      fontSize: 14,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    ingredientItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    ingredientName: {
      fontSize: 16,
      flex: 1,
    },
    ingredientQuantity: {
      fontSize: 14,
      fontWeight: '500',
    },
    equipmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    equipmentText: {
      fontSize: 15,
    },
    stepItem: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    stepText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
    },
    notesText: {
      fontSize: 15,
      lineHeight: 22,
      fontStyle: 'italic',
    },
  });
