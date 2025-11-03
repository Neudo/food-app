import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeForm } from '@/components/recipe-form';
import { RecipeDetail } from '@/components/recipe-detail';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipes } from '@/contexts/recipe-context';
import { RecipeFormData, Recipe } from '@/types/recipe';
import { supabase } from '@/lib/supabase';
import { CustomSelect } from '@/components/custom-select';

type TabType = 'all' | 'mine' | 'household' | 'favorites';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { recipes, addRecipe, updateRecipe, deleteRecipe, likedRecipes, loading } = useRecipes();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
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

  // Filtrer les recettes selon l'onglet actif
  const displayedRecipes = React.useMemo(() => {
    if (activeTab === 'favorites') {
      return likedRecipes;
    }
    
    if (activeTab === 'mine' && currentUserId) {
      return recipes.filter(r => r.userId === currentUserId);
    }
    
    if (activeTab === 'household') {
      // Mon foyer = toutes les recettes (mes recettes + celles du foyer)
      return recipes;
    }
    
    // Toutes = mes recettes + favoris + foyer (union de tout)
    const allRecipesSet = new Set<string>();
    const allRecipes: Recipe[] = [];
    
    // Ajouter mes recettes
    recipes.forEach(r => {
      if (!allRecipesSet.has(r.id)) {
        allRecipesSet.add(r.id);
        allRecipes.push(r);
      }
    });
    
    // Ajouter les favoris
    likedRecipes.forEach(r => {
      if (!allRecipesSet.has(r.id)) {
        allRecipesSet.add(r.id);
        allRecipes.push(r);
      }
    });
    
    return allRecipes;
  }, [activeTab, recipes, likedRecipes, currentUserId]);

  const handleAddRecipe = async (recipeData: RecipeFormData) => {
    const success = await addRecipe(recipeData);
    if (success) {
      setIsFormVisible(false);
    }
  };

  const handleEditRecipe = async (recipeData: RecipeFormData) => {
    if (!selectedRecipe) return;
    
    const success = await updateRecipe(selectedRecipe.id, recipeData);
    if (success) {
      setIsFormVisible(false);
      setIsEditMode(false);
      setSelectedRecipe(null);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedRecipe(null);
  };

  const handleEditFromDetail = () => {
    setIsDetailVisible(false);
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setIsEditMode(false);
    setSelectedRecipe(null);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Mes Recettes</ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setIsFormVisible(true)}
        >
          <ThemedText style={styles.addButtonText}>+ Ajouter</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Filtre Select */}
      <CustomSelect<TabType>
        options={[
          {
            value: 'all',
            label: 'Toutes',
            emoji: '📖',
            count: recipes.length + likedRecipes.filter(lr => !recipes.find(r => r.id === lr.id)).length,
          },
          {
            value: 'mine',
            label: 'Mes recettes',
            emoji: '👨‍🍳',
            count: currentUserId ? recipes.filter(r => r.userId === currentUserId).length : 0,
          },
          {
            value: 'household',
            label: 'Mon foyer',
            emoji: '🏠',
            count: recipes.length,
          },
          {
            value: 'favorites',
            label: 'Favoris',
            emoji: '❤️',
            count: likedRecipes.length,
          },
        ]}
        selectedValue={activeTab}
        onSelect={setActiveTab}
        showCount={true}
      />

      {displayedRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>
            {activeTab === 'all' ? '📖' : activeTab === 'mine' ? '👨‍🍳' : activeTab === 'household' ? '🏠' : '❤️'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            {activeTab === 'all' ? 'Aucune recette' : 
             activeTab === 'mine' ? 'Aucune recette personnelle' :
             activeTab === 'household' ? 'Aucune recette du foyer' :
             'Aucun favori'}
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            {activeTab === 'all' ? 'Commencez par ajouter votre première recette !' :
             activeTab === 'mine' ? 'Créez votre première recette personnelle !' :
             activeTab === 'household' ? 'Les recettes de votre foyer apparaîtront ici' :
             'Likez des recettes dans l\'onglet Explorer pour les retrouver ici !'}
          </ThemedText>
          {(activeTab === 'all' || activeTab === 'mine') && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
              onPress={() => setIsFormVisible(true)}
            >
              <ThemedText style={styles.emptyButtonText}>
                Créer ma première recette
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard 
              recipe={item} 
              onPress={() => handleRecipePress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de détail de recette */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseDetail}
      >
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={handleCloseDetail}
            onEdit={handleEditFromDetail}
          />
        )}
      </Modal>

      {/* Modal de formulaire */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="title">
              {isEditMode ? 'Éditer la Recette' : 'Nouvelle Recette'}
            </ThemedText>
          </ThemedView>
          <RecipeForm
            recipe={isEditMode ? selectedRecipe : undefined}
            onSubmit={isEditMode ? handleEditRecipe : handleAddRecipe}
            onCancel={handleCloseForm}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 8,
    },
    addButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    list: {
      padding: 16,
      paddingTop: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      textAlign: 'center',
      opacity: 0.7,
      marginBottom: 24,
    },
    emptyButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '30',
    },
  });
