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
import { getRecipeInformation } from '../services/spoonacularService';

const { width, height } = Dimensions.get('window');

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId, recipeTitle, recipeImage, selectedIngredients } = route.params;
  
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isInMealPlan, setIsInMealPlan] = useState(false);

  useEffect(() => {
    fetchRecipeDetails();
  }, [recipeId]);

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

  const toggleSaveRecipe = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save to cookbook functionality
    Alert.alert(
      isSaved ? 'Removed from Cookbook' : 'Saved to Cookbook',
      isSaved ? 'Recipe removed from your cookbook.' : 'Recipe saved to your cookbook!'
    );
  };

  const toggleMealPlan = () => {
    setIsInMealPlan(!isInMealPlan);
    // TODO: Implement meal plan functionality
    Alert.alert(
      isInMealPlan ? 'Removed from Meal Plan' : 'Added to Meal Plan',
      isInMealPlan ? 'Recipe removed from your meal plan.' : 'Recipe added to your meal plan!'
    );
  };

  const addMissingIngredientsToGroceryList = () => {
    if (!recipe) return;
    
    const missingIngredients = recipe.missedIngredients || [];
    if (missingIngredients.length === 0) {
      Alert.alert('No Missing Ingredients', 'You have all the ingredients needed for this recipe!');
      return;
    }
    
    // TODO: Implement add to grocery list functionality
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

  const hasIngredient = (ingredientName) => {
    if (!selectedIngredients) return false;
    return selectedIngredients.some(ing => 
      ingredientName.toLowerCase().includes(ing.name.toLowerCase()) ||
      ing.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
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
              <Text style={styles.infoText}>{recipe.servings || 'N/A'} servings</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trending-up-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{getDifficultyLevel(recipe.readyInMinutes)}</Text>
            </View>
          </View>

          {/* Dietary Tags */}
          {recipe.diets && recipe.diets.length > 0 && (
            <View style={styles.dietaryTags}>
              {recipe.diets.slice(0, 3).map((diet, index) => (
                <View key={index} style={styles.dietaryTag}>
                  <Text style={styles.dietaryTagText}>{diet}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.extendedIngredients?.map((ingredient, index) => {
                const hasIngredientItem = hasIngredient(ingredient.name);
                return (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Ionicons 
                        name={hasIngredientItem ? "checkmark-circle" : "cart-outline"} 
                        size={20} 
                        color={hasIngredientItem ? "#10B981" : "#EF4444"} 
                      />
                      <Text style={[
                        styles.ingredientText,
                        hasIngredientItem && styles.ingredientTextAvailable
                      ]}>
                        {ingredient.original}
                      </Text>
                    </View>
                    {!hasIngredientItem && (
                      <TouchableOpacity style={styles.addToGroceryButton}>
                        <Ionicons name="add" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
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
        <TouchableOpacity 
          style={styles.mealPlanButton}
          onPress={toggleMealPlan}
        >
          <Ionicons 
            name={isInMealPlan ? "calendar" : "calendar-outline"} 
            size={20} 
            color={isInMealPlan ? COLORS.white : COLORS.primary} 
          />
          <Text style={[
            styles.mealPlanButtonText,
            isInMealPlan && styles.mealPlanButtonTextActive
          ]}>
            {isInMealPlan ? 'In Meal Plan' : 'Add to Meal Plan'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.groceryButton}
          onPress={addMissingIngredientsToGroceryList}
        >
          <Ionicons name="cart" size={20} color={COLORS.white} />
          <Text style={styles.groceryButtonText}>Add Missing to Grocery List</Text>
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
}); 