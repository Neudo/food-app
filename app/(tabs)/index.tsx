import React, { useState } from 'react';
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

type TabType = 'all' | 'favorites';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { recipes, addRecipe, likedRecipes } = useRecipes();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Filtrer les recettes selon l'onglet actif
  const displayedRecipes = activeTab === 'all' ? recipes : likedRecipes;

  const handleAddRecipe = (recipeData: RecipeFormData) => {
    addRecipe(recipeData);
    setIsFormVisible(false);
  };

  const handleEditRecipe = (recipeData: RecipeFormData) => {
    // TODO: Implémenter la fonction updateRecipe dans le contexte
    console.log('Édition de la recette:', selectedRecipe?.id, recipeData);
    setIsFormVisible(false);
    setIsEditMode(false);
    setSelectedRecipe(null);
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.activeTab,
            activeTab === 'all' && { borderBottomColor: colors.tint },
          ]}
          onPress={() => setActiveTab('all')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'all' && styles.activeTabText,
              activeTab === 'all' && { color: colors.tint },
            ]}
          >
            Toutes ({recipes.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'favorites' && styles.activeTab,
            activeTab === 'favorites' && { borderBottomColor: colors.tint },
          ]}
          onPress={() => setActiveTab('favorites')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'favorites' && styles.activeTabText,
              activeTab === 'favorites' && { color: colors.tint },
            ]}
          >
            ❤️ Favoris ({likedRecipes.length})
          </ThemedText>
        </TouchableOpacity>
      </View>

      {displayedRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>
            {activeTab === 'all' ? '📖' : '❤️'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            {activeTab === 'all' ? 'Aucune recette' : 'Aucun favori'}
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            {activeTab === 'all'
              ? 'Commencez par ajouter votre première recette !'
              : 'Likez des recettes dans l\'onglet Explorer pour les retrouver ici !'}
          </ThemedText>
          {activeTab === 'all' && (
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
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      opacity: 0.6,
    },
    activeTabText: {
      fontWeight: '600',
      opacity: 1,
    },
  });
