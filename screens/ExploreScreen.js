import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  Badge,
  Card,
} from '../components/DesignSystem';
import { 
  searchRecipesByIngredients, 
  isApiKeyConfigured,
  getApiStatus 
} from '../services/spoonacularService';

const { width } = Dimensions.get('window');

// No dummy data - all recipes will come from Spoonacular API

// Available ingredients for selection
const availableIngredients = [
  { id: 1, name: 'Chicken', icon: '🍗' },
  { id: 2, name: 'Broccoli', icon: '🥦' },
  { id: 3, name: 'Garlic', icon: '🧄' },
  { id: 4, name: 'Onion', icon: '🧅' },
  { id: 5, name: 'Tomato', icon: '🍅' },
  { id: 6, name: 'Rice', icon: '🍚' },
  { id: 7, name: 'Pasta', icon: '🍝' },
  { id: 8, name: 'Beef', icon: '🥩' },
  { id: 9, name: 'Salmon', icon: '🐟' },
  { id: 10, name: 'Eggs', icon: '🥚' },
  { id: 11, name: 'Milk', icon: '🥛' },
  { id: 12, name: 'Cheese', icon: '🧀' },
  { id: 13, name: 'Potato', icon: '🥔' },
  { id: 14, name: 'Carrot', icon: '🥕' },
  { id: 15, name: 'Spinach', icon: '🥬' },
];

// Filter options
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const timeCategories = [
  { label: 'Quick (under 15 min)', value: 'Quick' },
  { label: 'Medium (15-30 min)', value: 'Medium' },
  { label: 'Long (30+ min)', value: 'Long' },
];

export default function ExploreScreen({ navigation, pantryItems = [] }) {
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMealTypes, setSelectedMealTypes] = useState([]);
  const [selectedTimeCategories, setSelectedTimeCategories] = useState([]);
  
  // API and recipe state
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [cookNowRecipes, setCookNowRecipes] = useState([]);
  const [almostThereRecipes, setAlmostThereRecipes] = useState([]);
  const [discoverRecipes, setDiscoverRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Calculate active filter count
  const activeFilterCount = selectedMealTypes.length + selectedTimeCategories.length;

  // Filter recipes based on selected filters
  const filterRecipes = (recipes) => {
    if (activeFilterCount === 0) return recipes;
    
    return recipes.filter(recipe => {
      const mealTypeMatch = selectedMealTypes.length === 0 || selectedMealTypes.includes(recipe.mealType);
      const timeMatch = selectedTimeCategories.length === 0 || selectedTimeCategories.includes(recipe.timeCategory);
      return mealTypeMatch && timeMatch;
    });
  };

  const toggleMealType = (mealType) => {
    setSelectedMealTypes(prev => 
      prev.includes(mealType) 
        ? prev.filter(type => type !== mealType)
        : [...prev, mealType]
    );
  };

  const toggleTimeCategory = (timeCategory) => {
    setSelectedTimeCategories(prev => 
      prev.includes(timeCategory) 
        ? prev.filter(time => time !== timeCategory)
        : [...prev, timeCategory]
    );
  };

  const clearAllFilters = () => {
    setSelectedMealTypes([]);
    setSelectedTimeCategories([]);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  // API Integration Functions
  const searchRecipes = async () => {
    if (!isApiKeyConfigured()) {
      Alert.alert(
        'API Key Required',
        'Please configure your Spoonacular API key in the .env file to search for recipes.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (selectedIngredients.length === 0) {
      setCookNowRecipes([]);
      setAlmostThereRecipes([]);
      setDiscoverRecipes([]);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const ingredientNames = selectedIngredients.map(ing => ing.name);
      console.log('🔍 Searching recipes with ingredients:', ingredientNames);
      console.log('📊 Total ingredients:', ingredientNames.length);
      
      const recipes = await searchRecipesByIngredients(ingredientNames, {
        number: 20,
        ranking: 1,
        ignorePantry: false,
      });

      console.log('📋 API returned recipes:', recipes.length);
      console.log('🍳 Sample recipe:', recipes[0]);

      // Separate recipes into categories based on missing ingredients
      const cookNow = recipes.filter(recipe => recipe.missedIngredientCount <= 1); // 0-1 missing ingredients
      const almostThere = recipes.filter(recipe => recipe.missedIngredientCount >= 2 && recipe.missedIngredientCount <= 3); // 2-3 missing ingredients
      const discover = recipes.filter(recipe => recipe.missedIngredientCount > 3); // 4+ missing ingredients (trending/popular)

      console.log('✅ Cook Now recipes:', cookNow.length);
      console.log('🟡 Almost There recipes:', almostThere.length);
      console.log('🔍 Discover recipes:', discover.length);

      setCookNowRecipes(cookNow);
      setAlmostThereRecipes(almostThere);
      setDiscoverRecipes(discover);

    } catch (error) {
      console.error('❌ Error searching recipes:', error);
      console.error('❌ Error details:', error.message);
      setApiError(error.message);
      
      // More specific error handling
      if (error.message.includes('API key')) {
        Alert.alert(
          'API Key Error',
          'Invalid or missing Spoonacular API key. Please check your configuration.',
          [{ text: 'OK' }]
        );
      } else if (error.message.includes('network')) {
        Alert.alert(
          'Network Error',
          'Unable to connect to recipe service. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Search Error',
          'Failed to search for recipes. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Convert pantry items to ingredients and auto-populate
  const convertPantryToIngredients = (pantryItems) => {
    return pantryItems.map(item => ({
      id: item.id,
      name: normalizeIngredientName(item.name),
      icon: getIngredientIcon(item.name),
      fromPantry: true,
      category: item.category
    }));
  };

  // Normalize ingredient names for Spoonacular API compatibility
  const normalizeIngredientName = (name) => {
    const lowerName = name.toLowerCase().trim();
    
    // Common ingredient mappings for better API results
    const ingredientMappings = {
      'onion': 'onion',
      'white onion': 'onion',
      'yellow onion': 'onion',
      'red onion': 'onion',
      'garlic': 'garlic',
      'garlic cloves': 'garlic',
      'chicken': 'chicken',
      'chicken breast': 'chicken breast',
      'chicken thighs': 'chicken',
      'beef': 'beef',
      'ground beef': 'ground beef',
      'pork': 'pork',
      'salmon': 'salmon',
      'fish': 'fish',
      'milk': 'milk',
      'whole milk': 'milk',
      'skim milk': 'milk',
      'cheese': 'cheese',
      'cheddar cheese': 'cheese',
      'eggs': 'eggs',
      'egg': 'eggs',
      'flour': 'flour',
      'all purpose flour': 'flour',
      'bread flour': 'flour',
      'rice': 'rice',
      'white rice': 'rice',
      'brown rice': 'rice',
      'pasta': 'pasta',
      'spaghetti': 'pasta',
      'tomato': 'tomato',
      'tomatoes': 'tomato',
      'potato': 'potato',
      'potatoes': 'potato',
      'carrot': 'carrot',
      'carrots': 'carrot',
      'broccoli': 'broccoli',
      'spinach': 'spinach',
      'lettuce': 'lettuce',
      'apple': 'apple',
      'apples': 'apple',
      'banana': 'banana',
      'bananas': 'banana',
      'olive oil': 'olive oil',
      'vegetable oil': 'vegetable oil',
      'butter': 'butter',
      'salt': 'salt',
      'pepper': 'pepper',
      'black pepper': 'pepper',
      'sugar': 'sugar',
      'brown sugar': 'sugar',
      'honey': 'honey',
      'bread': 'bread',
      'tortilla': 'tortilla',
      'tortillas': 'tortilla',
      'tortilla chips': 'tortilla chips',
      'chips': 'tortilla chips',
    };

    // Check for exact matches first
    if (ingredientMappings[lowerName]) {
      return ingredientMappings[lowerName];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(ingredientMappings)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return value;
      }
    }

    // Return original name if no mapping found
    return name.toLowerCase().trim();
  };

  // Get appropriate icon for ingredient based on name
  const getIngredientIcon = (name) => {
    const lowerName = name.toLowerCase();
    
    // Produce
    if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('orange')) return '🍎';
    if (lowerName.includes('tomato')) return '🍅';
    if (lowerName.includes('lettuce') || lowerName.includes('spinach')) return '🥬';
    if (lowerName.includes('carrot')) return '🥕';
    if (lowerName.includes('onion')) return '🧅';
    if (lowerName.includes('garlic')) return '🧄';
    if (lowerName.includes('potato')) return '🥔';
    if (lowerName.includes('broccoli')) return '🥦';
    if (lowerName.includes('cucumber')) return '🥒';
    
    // Proteins
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('beef') || lowerName.includes('steak')) return '🥩';
    if (lowerName.includes('fish') || lowerName.includes('salmon')) return '🐟';
    if (lowerName.includes('egg')) return '🥚';
    if (lowerName.includes('tofu')) return '🧈';
    
    // Dairy
    if (lowerName.includes('milk')) return '🥛';
    if (lowerName.includes('cheese')) return '🧀';
    if (lowerName.includes('yogurt')) return '🥛';
    if (lowerName.includes('butter')) return '🧈';
    
    // Grains
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('pasta')) return '🍝';
    if (lowerName.includes('bread')) return '🍞';
    if (lowerName.includes('flour')) return '🌾';
    
    // Default
    return '🥘';
  };

  // Auto-populate ingredients from pantry when pantry changes
  useEffect(() => {
    if (pantryItems.length > 0) {
      const pantryIngredients = convertPantryToIngredients(pantryItems);
      setSelectedIngredients(pantryIngredients);
    } else {
      // Fallback to manual selection if no pantry items
      setSelectedIngredients([]);
    }
  }, [pantryItems]);

  // Refresh when screen comes into focus (e.g., returning from Pantry)
  useFocusEffect(
    React.useCallback(() => {
      if (pantryItems.length > 0) {
        const pantryIngredients = convertPantryToIngredients(pantryItems);
        setSelectedIngredients(pantryIngredients);
      }
    }, [pantryItems])
  );

  // Search recipes when ingredients change
  useEffect(() => {
    searchRecipes();
  }, [selectedIngredients]);



  const renderRecipeCard = (recipe) => (
    <TouchableOpacity 
      key={recipe.id} 
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.image,
        selectedIngredients: selectedIngredients,
      })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <View style={styles.recipeCardContent}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
        
        {/* Recipe Badge */}
        <View style={styles.recipeBadgeContainer}>
          <View style={[
            styles.recipeBadge,
            recipe.missedIngredientCount === 0 && styles.canMakeBadge,
            recipe.missedIngredientCount === 1 && styles.almostCanMakeBadge,
            recipe.missedIngredientCount >= 2 && styles.missingIngredientsBadge,
          ]}>
            <Text style={styles.recipeBadgeText}>
              {recipe.missingIngredientsText}
            </Text>
          </View>
        </View>
        
        {/* Used Ingredients Info */}
        <Text style={styles.usedIngredientsText}>
          Uses {recipe.usedIngredientCount} of your ingredients
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title, recipes, emptyMessage) => {
    const filteredRecipes = filterRecipes(recipes);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>No recipes found</Text>
            <Text style={styles.emptyStateText}>{emptyMessage}</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {filteredRecipes.map(renderRecipeCard)}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderCheckbox = (label, isSelected, onToggle) => (
    <TouchableOpacity 
      style={styles.checkboxRow} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
        )}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={['#DC2626', '#B91C1C']}
              style={styles.titleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.headerTitle}>Kitchen AI</Text>
            </LinearGradient>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={24} color={COLORS.textPrimary} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {/* Loading indicator for background pantry search */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                {pantryItems.length > 0 
                  ? `Finding recipes with your ${pantryItems.length} pantry items...` 
                  : 'Searching recipes...'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Recipe Sections */}
        {renderSection(
          'Cook Now', 
          cookNowRecipes, 
          selectedIngredients.length === 0 
            ? (pantryItems.length > 0 
                ? 'No recipes found with your current pantry items. Try adding more ingredients to your pantry!' 
                : 'Add items to your pantry to see recipes you can make right now!'
              )
            : 'Try adding more ingredients to find recipes you can make.'
        )}
        {renderSection(
          'Almost There', 
          almostThereRecipes, 
          selectedIngredients.length === 0 
            ? (pantryItems.length > 0 
                ? 'No recipes found with your current pantry items. Try adding more ingredients to your pantry!' 
                : 'Add items to your pantry to see recipes you\'re close to making!'
              )
            : 'Try adding more ingredients to find recipes you\'re close to making.'
        )}
        {renderSection(
          'Discover', 
          discoverRecipes, 
          'Popular recipes will appear here as you explore more ingredients.'
        )}
      </ScrollView>



      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Meal Type Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Meal Type</Text>
                {mealTypes.map(mealType => (
                  <View key={mealType}>
                    {renderCheckbox(
                      mealType,
                      selectedMealTypes.includes(mealType),
                      () => toggleMealType(mealType)
                    )}
                  </View>
                ))}
              </View>

              {/* Time Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time</Text>
                {timeCategories.map(timeCategory => (
                  <View key={timeCategory.value}>
                    {renderCheckbox(
                      timeCategory.label,
                      selectedTimeCategories.includes(timeCategory.value),
                      () => toggleTimeCategory(timeCategory.value)
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
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
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleGradient: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  recipeCard: {
    width: 280,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  recipeCardContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: width - 40,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Recipe card enhancement styles
  recipeBadgeContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  recipeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  canMakeBadge: {
    backgroundColor: '#10B981', // Green
  },
  almostCanMakeBadge: {
    backgroundColor: '#F59E0B', // Orange
  },
  missingIngredientsBadge: {
    backgroundColor: '#EF4444', // Red
  },
  recipeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  usedIngredientsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

}); 