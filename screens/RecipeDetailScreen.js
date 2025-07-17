import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
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
} from '../components/DesignSystem';
import { 
  getRecipeInformation, 
  isRecipeSaved, 
  saveRecipe, 
  removeRecipe,
  addRecipeRating,
  addRecipeNote,
  markRecipeAsCooked,
  getSimilarRecipes
} from '../services/spoonacularService';
import { usePantry } from '../PantryContext';

const { width, height } = Dimensions.get('window');

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId, recipeTitle, recipeImage, selectedIngredients } = route.params;
  const { pantryItems } = usePantry();
  
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isInMealPlan, setIsInMealPlan] = useState(false);
  const [servings, setServings] = useState(4);
  const [ingredientAvailability, setIngredientAvailability] = useState([]);
  const [cookModeActive, setCookModeActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    fetchRecipeDetails();
    checkSavedStatus();
  }, [recipeId]);

  useEffect(() => {
    if (recipe) {
      loadSimilarRecipes();
    }
  }, [recipe]);

  useEffect(() => {
    if (recipe) {
      checkIngredientAvailability();
      setServings(recipe.servings || 4);
    }
  }, [recipe, pantryItems]);

  const fetchRecipeDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const recipeData = await getRecipeInformation(recipeId);
      setRecipe(recipeData);
      
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        'Failed to load recipe details. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const saved = await isRecipeSaved(recipeId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status:', error);
      setIsSaved(false);
    }
  };

  const loadSimilarRecipes = async () => {
    try {
      const similar = await getSimilarRecipes(recipeId, 3);
      setSimilarRecipes(similar);
    } catch (error) {
      console.error('Error loading similar recipes:', error);
    }
  };

  const checkIngredientAvailability = () => {
    if (!recipe || !pantryItems) return;

    const availability = recipe.extendedIngredients?.map(ingredient => {
      const normalizedIngredientName = ingredient.name.toLowerCase().trim();
      const available = pantryItems.some(item => {
        const normalizedItemName = item.name.toLowerCase().trim();
        return normalizedItemName.includes(normalizedIngredientName) || 
               normalizedIngredientName.includes(normalizedItemName);
      });

      return {
        ...ingredient,
        available,
        adjustedQuantity: getAdjustedQuantity(ingredient.amount, recipe.servings || 4, servings)
      };
    }) || [];

    setIngredientAvailability(availability);
  };

  const getAdjustedQuantity = (originalAmount, originalServings, newServings) => {
    if (!originalAmount || !originalServings) return originalAmount;
    const multiplier = newServings / originalServings;
    return (originalAmount * multiplier).toFixed(1);
  };

  const getAvailabilityPercentage = () => {
    if (!ingredientAvailability.length) return 0;
    const availableCount = ingredientAvailability.filter(item => item.available).length;
    return Math.round((availableCount / ingredientAvailability.length) * 100);
  };

  const getMissingIngredients = () => {
    return ingredientAvailability.filter(ingredient => !ingredient.available);
  };

  const toggleSaveRecipe = async () => {
    try {
      if (isSaved) {
        await removeRecipe(recipeId);
        setIsSaved(false);
        Alert.alert('Removed from Cookbook', 'Recipe removed from your cookbook.');
      } else {
        await saveRecipe(recipeId);
        setIsSaved(true);
        Alert.alert('Saved to Cookbook', 'Recipe saved to your cookbook!');
      }
    } catch (error) {
      console.error('Error toggling save recipe:', error);
      Alert.alert('Error', 'Failed to update recipe status. Please try again.');
    }
  };

  const toggleMealPlan = () => {
    setIsInMealPlan(!isInMealPlan);
    Alert.alert(
      isInMealPlan ? 'Removed from Meal Plan' : 'Added to Meal Plan',
      isInMealPlan ? 'Recipe removed from your meal plan.' : 'Recipe added to your meal plan!'
    );
  };

  const addMissingIngredientsToGroceryList = () => {
    const missingIngredients = getMissingIngredients();
    if (missingIngredients.length === 0) {
      Alert.alert('No Missing Ingredients', 'You have all the ingredients needed for this recipe!');
      return;
    }
    
    Alert.alert(
      'Added to Grocery List',
      `${missingIngredients.length} missing ingredient(s) added to your grocery list.`
    );
  };

  const shareRecipe = async () => {
    if (!recipe) return;
    
    try {
      await Share.share({
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.sourceUrl || ''}`,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  const adjustServings = (newServings) => {
    if (newServings < 1) return;
    setServings(newServings);
  };

  const startCooking = async () => {
    setCookModeActive(true);
    setCurrentStep(0);
    // Mark as cooked when user starts cooking
    try {
      await markRecipeAsCooked(recipeId);
    } catch (error) {
      console.error('Error marking recipe as cooked:', error);
      // Continue with cooking mode even if marking as cooked fails
    }
  };

  const nextStep = () => {
    if (currentStep < (recipe.analyzedInstructions?.[0]?.steps?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getDifficultyLevel = (readyInMinutes) => {
    if (!readyInMinutes) return 'Unknown';
    if (readyInMinutes <= 15) return 'Easy';
    if (readyInMinutes <= 30) return 'Medium';
    if (readyInMinutes <= 60) return 'Hard';
    return 'Expert';
  };

  const getAvailabilityStatus = () => {
    const percentage = getAvailabilityPercentage();
    if (percentage >= 80) return { text: 'Ready to Cook!', icon: '✅', color: '#10B981' };
    if (percentage >= 50) return { text: 'Almost Ready', icon: '⚠️', color: '#F59E0B' };
    return { text: 'Missing Ingredients', icon: '❌', color: '#EF4444' };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.textSecondary} />
          <Text style={styles.errorTitle}>Failed to Load Recipe</Text>
          <Text style={styles.errorText}>
            {error || 'Unable to load recipe details. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRecipeDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availabilityStatus = getAvailabilityStatus();
  const missingIngredients = getMissingIngredients();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: recipe.image || recipeImage }} 
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.imageOverlay}
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={shareRecipe}
            >
              <Ionicons name="share-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleSaveRecipe}
            >
              <Ionicons 
                name={isSaved ? "heart" : "heart-outline"} 
                size={24} 
                color={isSaved ? "#EF4444" : COLORS.white} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={startCooking}
            >
              <Ionicons name="restaurant" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe Content */}
        <View style={styles.content}>
          {/* Recipe Title */}
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          {/* Quick Info Bar */}
          <View style={styles.quickInfoBar}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{formatTime(recipe.readyInMinutes)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{servings} servings</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trending-up-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{getDifficultyLevel(recipe.readyInMinutes)}</Text>
            </View>
          </View>

          {/* Serving Size Adjuster */}
          <View style={styles.servingAdjuster}>
            <Text style={styles.servingLabel}>Servings:</Text>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => adjustServings(servings - 1)}
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.servingCount}>{servings}</Text>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => adjustServings(servings + 1)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Availability Summary */}
          <View style={styles.availabilitySummary}>
            <View style={styles.availabilityHeader}>
              <Text style={styles.availabilityIcon}>{availabilityStatus.icon}</Text>
              <View style={styles.availabilityText}>
                <Text style={styles.availabilityTitle}>{availabilityStatus.text}</Text>
                <Text style={styles.availabilitySubtitle}>
                  {getAvailabilityPercentage()}% ingredients available ({ingredientAvailability.filter(i => i.available).length}/{ingredientAvailability.length})
                </Text>
              </View>
            </View>
            
            {missingIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.addMissingButton}
                onPress={addMissingIngredientsToGroceryList}
              >
                <Ionicons name="list" size={16} color={COLORS.white} />
                <Text style={styles.addMissingText}>
                  Add {missingIngredients.length} Missing Items to List
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {ingredientAvailability.map((ingredient, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.ingredientItem,
                    ingredient.available ? styles.ingredientAvailable : styles.ingredientMissing
                  ]}
                >
                  <View style={styles.ingredientInfo}>
                    <Ionicons 
                      name={ingredient.available ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={ingredient.available ? "#10B981" : "#EF4444"} 
                    />
                    <View style={styles.ingredientDetails}>
                      <Text style={styles.ingredientAmount}>
                        {ingredient.adjustedQuantity} {ingredient.unit}
                      </Text>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.ingredientStatus,
                    ingredient.available ? styles.statusHave : styles.statusNeed
                  ]}>
                    {ingredient.available ? 'Have it' : 'Need it'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <TouchableOpacity 
                style={styles.voiceModeButton}
                onPress={() => setShowVoiceMode(!showVoiceMode)}
              >
                <Ionicons name="mic" size={20} color={COLORS.primary} />
                <Text style={styles.voiceModeText}>Voice Mode</Text>
              </TouchableOpacity>
            </View>
            
            {cookModeActive ? (
              <View style={styles.cookModeContainer}>
                <View style={styles.cookModeStep}>
                  <Text style={styles.cookModeStepNumber}>Step {currentStep + 1}</Text>
                  <Text style={styles.cookModeStepText}>
                    {recipe.analyzedInstructions?.[0]?.steps?.[currentStep]?.step || 'No instructions available'}
                  </Text>
                </View>
                <View style={styles.cookModeControls}>
                  <TouchableOpacity 
                    style={[styles.cookModeButton, currentStep === 0 && styles.cookModeButtonDisabled]}
                    onPress={previousStep}
                    disabled={currentStep === 0}
                  >
                    <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cookModeButton}
                    onPress={() => setCookModeActive(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.cookModeButton, 
                      currentStep >= (recipe.analyzedInstructions?.[0]?.steps?.length || 0) - 1 && styles.cookModeButtonDisabled
                    ]}
                    onPress={nextStep}
                    disabled={currentStep >= (recipe.analyzedInstructions?.[0]?.steps?.length || 0) - 1}
                  >
                    <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.instructionsList}>
                {recipe.analyzedInstructions?.[0]?.steps?.map((step, index) => (
                  <View key={index} style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step.step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Nutrition Section */}
          {recipe.nutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <View style={styles.nutritionGrid}>
                {recipe.nutrition.nutrients?.slice(0, 6).map((nutrient, index) => (
                  <View key={index} style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>{nutrient.name}</Text>
                    <Text style={styles.nutritionValue}>
                      {Math.round(nutrient.amount)}{nutrient.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        {missingIngredients.length > 0 ? (
          <TouchableOpacity 
            style={styles.actionButtonSecondary}
            onPress={addMissingIngredientsToGroceryList}
          >
            <Ionicons name="cart" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonSecondaryText}>
              Add Missing Items ({missingIngredients.length})
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.actionButtonSecondary}
            onPress={() => {}}
          >
            <Ionicons name="cart" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonSecondaryText}>Shopping List</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButtonPrimary}
          onPress={startCooking}
        >
          <Ionicons name="restaurant" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonPrimaryText}>Start Cooking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    lineHeight: 36,
  },
  quickInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dietaryTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dietaryTagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  ingredientTextAvailable: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  addToGroceryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  instructionsList: {
    gap: 20,
  },
  instructionStep: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    flex: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bottomActionBar: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  mealPlanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  mealPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mealPlanButtonTextActive: {
    color: COLORS.white,
  },
  groceryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  groceryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  servingAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  servingLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  availabilitySummary: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  availabilityIcon: {
    fontSize: 24,
  },
  availabilityText: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addMissingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addMissingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ingredientAvailable: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  ingredientMissing: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  ingredientStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusHave: {
    backgroundColor: '#E0F2F7',
    color: '#10B981',
  },
  statusNeed: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cookModeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cookModeStep: {
    marginBottom: 16,
  },
  cookModeStepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cookModeStepText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  cookModeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cookModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookModeButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
}); 