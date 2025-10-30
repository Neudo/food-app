import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const totalTime = recipe.prepTime + recipe.cookTime;

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'facile':
        return '#10b981';
      case 'moyen':
        return '#f59e0b';
      case 'difficile':
        return '#ef4444';
    }
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.card}>
        {recipe.imageUrl && (
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
              {recipe.title}
            </ThemedText>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(recipe.difficulty) },
              ]}
            >
              <ThemedText style={styles.difficultyText}>
                {recipe.difficulty}
              </ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoIcon}>⏱️</ThemedText>
            <ThemedText style={styles.infoText}>{totalTime} min</ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText style={styles.infoIcon}>👥</ThemedText>
            <ThemedText style={styles.infoText}>{recipe.servings} pers.</ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText style={styles.infoIcon}>📝</ThemedText>
            <ThemedText style={styles.infoText}>
              {recipe.ingredients.length} ingr.
            </ThemedText>
          </View>
        </View>

          {recipe.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.categoryText, { color: colors.tint }]}>
                {recipe.category}
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: 180,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 12,
    },
    title: {
      fontSize: 18,
      flex: 1,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    difficultyText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    infoIcon: {
      fontSize: 14,
    },
    infoText: {
      fontSize: 13,
      opacity: 0.7,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
