import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Recipe } from '@/types/recipe';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  recipe: Recipe;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

export function SwipeCard({ recipe, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isTop) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (!isTop) return;
      
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5, {}, () => {
          if (direction > 0) {
            runOnJS(onSwipeRight)();
          } else {
            runOnJS(onSwipeLeft)();
          }
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15]
    );

    const opacity = isTop ? 1 : 0.5;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: isTop ? 1 : 0.95 },
      ],
      opacity,
    };
  });

  const likeStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );
    return { opacity };
  });

  const nopeStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );
    return { opacity };
  });

  const totalTime = recipe.prepTime + recipe.cookTime;
  const styles = createStyles(colors);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <ThemedView style={styles.cardContent}>
          {/* Stamps de validation/rejet */}
          <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
            <ThemedText style={styles.stampText}>✓</ThemedText>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]}>
            <ThemedText style={styles.stampText}>✕</ThemedText>
          </Animated.View>

          {/* Image de la recette */}
          {recipe.imageUrl && (
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          )}

          {/* Contenu de la carte */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title} numberOfLines={2}>
              {recipe.title}
            </ThemedText>
          </View>

          {recipe.description ? (
            <ThemedText style={styles.description} numberOfLines={3}>
              {recipe.description}
            </ThemedText>
          ) : null}

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>⏱️</ThemedText>
                <ThemedText style={styles.infoText}>{totalTime} min</ThemedText>
              </View>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>👥</ThemedText>
                <ThemedText style={styles.infoText}>{recipe.servings} pers.</ThemedText>
              </View>
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
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ingrédients ({recipe.ingredients.length})
            </ThemedText>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <ThemedText style={styles.bullet}>•</ThemedText>
                  <ThemedText style={styles.ingredientText} numberOfLines={1}>
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </ThemedText>
                </View>
              ))}
              {recipe.ingredients.length > 5 && (
                <ThemedText style={styles.moreText}>
                  + {recipe.ingredients.length - 5} autres...
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Préparation ({recipe.steps.length} étapes)
            </ThemedText>
            <View style={styles.stepsList}>
              {recipe.steps.slice(0, 3).map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <ThemedText style={styles.stepNumber}>{index + 1}.</ThemedText>
                  <ThemedText style={styles.stepText} numberOfLines={2}>
                    {step}
                  </ThemedText>
                </View>
              ))}
              {recipe.steps.length > 3 && (
                <ThemedText style={styles.moreText}>
                  + {recipe.steps.length - 3} autres étapes...
                </ThemedText>
              )}
            </View>
          </View>

          {recipe.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.categoryText, { color: colors.tint }]}>
                {recipe.category}
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </Animated.View>
    </GestureDetector>
  );
}

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

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      width: SCREEN_WIDTH - 40,
      height: '85%',
      alignSelf: 'center',
    },
    cardContent: {
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    recipeImage: {
      width: '100%',
      height: 200,
      marginBottom: 16,
    },
    stamp: {
      position: 'absolute',
      top: 50,
      zIndex: 10,
      borderWidth: 4,
      borderRadius: 12,
      padding: 12,
      transform: [{ rotate: '-20deg' }],
    },
    likeStamp: {
      right: 30,
      borderColor: '#10b981',
    },
    nopeStamp: {
      left: 30,
      borderColor: '#ef4444',
      transform: [{ rotate: '20deg' }],
    },
    stampText: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#fff',
    },
    header: {
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
    },
    description: {
      fontSize: 16,
      opacity: 0.8,
      marginBottom: 16,
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    infoContainer: {
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoIcon: {
      fontSize: 16,
    },
    infoText: {
      fontSize: 14,
      opacity: 0.8,
    },
    difficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    difficultyText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    section: {
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      marginBottom: 8,
    },
    ingredientsList: {
      gap: 6,
    },
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bullet: {
      fontSize: 16,
      opacity: 0.6,
    },
    ingredientText: {
      fontSize: 14,
      flex: 1,
      opacity: 0.9,
    },
    stepsList: {
      gap: 8,
    },
    stepItem: {
      flexDirection: 'row',
      gap: 8,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.8,
    },
    stepText: {
      fontSize: 14,
      flex: 1,
      opacity: 0.9,
      lineHeight: 20,
    },
    moreText: {
      fontSize: 13,
      opacity: 0.6,
      fontStyle: 'italic',
      marginTop: 4,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginTop: 8,
      marginLeft: 20,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
