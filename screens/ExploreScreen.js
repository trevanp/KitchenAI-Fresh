import React, { useState, useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import openaiService from '../services/openaiService';
import smartMatcher from '../services/smartIngredientMatcher';
import smartPantry from '../services/smartPantrySystem';
import { usePantry } from '../PantryContext';

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

export default function ExploreScreen({ navigation: navigationProp, pantryItems = [] }) {
  // Use useNavigation hook as fallback if prop is not provided
  const navigationHook = useNavigation();
  const navigation = navigationProp || navigationHook;
  
  // Get pantry context for essentials
  const { getAllAvailableIngredients } = usePantry();
  
  // Debug navigation object
  useEffect(() => {
    console.log('🔍 ExploreScreen - Navigation debug:');
    console.log('Navigation prop:', navigationProp);
    console.log('Navigation hook:', navigationHook);
    console.log('Final navigation object:', navigation);
    console.log('Navigation type:', typeof navigation);
    console.log('Navigation methods:', navigation ? Object.keys(navigation) : 'undefined');
    
    // Validate navigation object
    if (!navigation) {
      console.error('❌ CRITICAL: Navigation object is undefined in ExploreScreen!');
    } else if (typeof navigation.navigate !== 'function') {
      console.error('❌ CRITICAL: navigation.navigate is not a function!');
    } else {
      console.log('✅ Navigation object is valid');
    }
  }, [navigation, navigationProp, navigationHook]);

  // Safety check - if navigation is still undefined, show error
  if (!navigation) {
    console.error('❌ CRITICAL: Navigation is still undefined after fallback!');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Navigation Error</Text>
          <Text style={styles.errorText}>
            Unable to load navigation. Please restart the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

  // AI-powered features state
  const [aiRecipeMatches, setAiRecipeMatches] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

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
      // Get all available ingredients including essentials
      const allAvailableIngredients = await getAllAvailableIngredients();
      const userSelectedIngredients = selectedIngredients.map(ing => ing.name);
      
      // Combine user-selected ingredients with essentials for better recipe matching
      const allIngredientNames = [...new Set([
        ...userSelectedIngredients,
        ...allAvailableIngredients.map(item => item.name)
      ])];
      
      console.log('🔍 Searching recipes with ingredients:', allIngredientNames);
      console.log('📊 Total ingredients (including essentials):', allIngredientNames.length);
      console.log('👤 User selected ingredients:', userSelectedIngredients.length);
      console.log('⭐ Essentials included:', allIngredientNames.length - userSelectedIngredients.length);
      console.log('🔧 All available ingredients from pantry:', allAvailableIngredients.map(item => `${item.name}${item.isEssential ? ' (essential)' : ''}`));
      
      const recipes = await searchRecipesByIngredients(allIngredientNames, {
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

      // Trigger AI analysis with all recipes and pantry items (including essentials)
      const allRecipes = [...cookNow, ...almostThere, ...discover];
      await analyzeWithAI(allRecipes, allAvailableIngredients);

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

  // AI-powered recipe analysis
  const analyzeWithAI = async (recipes, allAvailableIngredients) => {
    if (!aiEnabled) return;
    
    setIsAiLoading(true);
    try {
      // Get AI-powered recipe matches with all available ingredients (including essentials)
      const matches = await openaiService.analyzeRecipeMatches(allAvailableIngredients, recipes);
      setAiRecipeMatches(matches);
      
      // Get pantry insights with all available ingredients
      const insights = await openaiService.getPantryInsights(allAvailableIngredients);
      setAiInsights(insights);
      
      // Use smart matcher for more accurate recipe categorization
      const smartMatches = await smartMatcher.checkMultipleRecipes(recipes, allAvailableIngredients);
      console.log('🤖 Smart matcher results:', smartMatches);
      
      // Use smart pantry system for enhanced recipe checking
      const enhancedRecipes = await Promise.all(
        recipes.slice(0, 5).map(async (recipe) => {
          try {
            const recipeIngredients = recipe.missedIngredients.concat(recipe.usedIngredients).map(ing => ing.name);
            const smartCheck = await smartPantry.checkRecipeIngredients(recipeIngredients, allAvailableIngredients);
            return {
              ...recipe,
              smartCheck
            };
          } catch (error) {
            console.log('🤖 Smart pantry check failed for recipe:', recipe.title, error.message);
            return recipe;
          }
        })
      );
      
      console.log('🤖 Enhanced recipes with smart pantry:', enhancedRecipes.length);
      
      console.log('🤖 AI analysis completed:', { matches, insights, smartMatches, enhancedRecipes });
    } catch (error) {
      console.log('🤖 AI features unavailable:', error.message);
      setAiEnabled(false);
    } finally {
      setIsAiLoading(false);
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



  const renderRecipeCard = (recipe) => {
    const handleRecipePress = () => {
      if (!navigation) {
        console.error('❌ Navigation is undefined in ExploreScreen');
        Alert.alert('Navigation Error', 'Unable to open recipe details. Navigation is not available.');
        return;
      }
      
      try {
        // Try primary navigation method
        navigation.navigate('RecipeDetail', {
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeImage: recipe.image,
          recipe: recipe, // Pass the full recipe object
          selectedIngredients: selectedIngredients,
        });
        console.log('✅ Successfully navigated to RecipeDetail');
      } catch (error) {
        console.error('❌ Primary navigation failed:', error);
        
        // Fallback: try to navigate to the Explore stack first
        try {
          navigation.navigate('Explore', {
            screen: 'RecipeDetail',
            params: {
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              recipeImage: recipe.image,
              recipe: recipe,
              selectedIngredients: selectedIngredients,
            }
          });
          console.log('✅ Successfully navigated using fallback method');
        } catch (fallbackError) {
          console.error('❌ Fallback navigation also failed:', fallbackError);
          Alert.alert(
            'Navigation Error', 
            'Unable to open recipe details. Please try again or restart the app.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    return (
      <TouchableOpacity 
        key={recipe.id} 
        style={styles.recipeCard}
        onPress={handleRecipePress}
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
  };

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

        {/* AI Insights Section */}
        {aiInsights && aiInsights.insights && aiInsights.insights.length > 0 && (
          <View style={styles.aiInsightsSection}>
            <View style={styles.aiInsightsHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.primary} />
              <Text style={styles.aiInsightsTitle}>AI Kitchen Insights</Text>
              {isAiLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiInsightsScroll}
            >
              {aiInsights.insights.map((insight, index) => (
                <View key={index} style={[styles.insightCard, styles[`insight${insight.type}`]]}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </ScrollView>

            {aiInsights.quick_stats && (
              <View style={styles.quickStatsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{aiInsights.quick_stats.total_possible_meals}</Text>
                  <Text style={styles.statLabel}>Possible Meals</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{aiInsights.quick_stats.expiring_soon}</Text>
                  <Text style={styles.statLabel}>Expiring Soon</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Most Versatile</Text>
                  <Text style={styles.statIngredient}>{aiInsights.quick_stats.most_versatile_ingredient}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* AI Recipe Matches Section */}
        {aiRecipeMatches && aiRecipeMatches.perfect_matches && aiRecipeMatches.perfect_matches.length > 0 && (
          <View style={styles.aiMatchesSection}>
            <View style={styles.aiMatchesHeader}>
              <Ionicons name="star" size={20} color="#10B981" />
              <Text style={styles.aiMatchesTitle}>AI Perfect Matches</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiMatchesScroll}
            >
              {aiRecipeMatches.perfect_matches.map((match, index) => (
                <View key={index} style={styles.aiMatchCard}>
                  <View style={styles.aiMatchHeader}>
                    <Text style={styles.aiMatchName}>{match.recipe_name}</Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>{match.confidence}%</Text>
                    </View>
                  </View>
                  <Text style={styles.aiMatchReason}>{match.reason}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

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
  // AI Insights Styles
  aiInsightsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiInsightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  aiInsightsScroll: {
    paddingRight: 20,
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  insightopportunity: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  insightwarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  insightsuggestion: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightinfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
  },
  insightIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  // AI Recipe Matches Styles
  aiMatchesSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  aiMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiMatchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  aiMatchesScroll: {
    paddingRight: 20,
  },
  aiMatchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 250,
    borderWidth: 1,
    borderColor: '#10B981',
    ...SHADOWS.medium,
  },
  aiMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiMatchName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  aiMatchReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

}); 