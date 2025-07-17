// Spoonacular API Service
// Configuration and functions for ingredient-based recipe search
import { SPOONACULAR_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const SPOONACULAR_CONFIG = {
  baseURL: 'https://api.spoonacular.com',
  endpoints: {
    findByIngredients: '/recipes/findByIngredients',
    recipeInformation: '/recipes/{id}/information',
    analyzedInstructions: '/recipes/{id}/analyzedInstructions',
    nutrition: '/recipes/{id}/nutritionWidget.json',
    similarRecipes: '/recipes/{id}/similar',
  },
  // TODO: Add your Spoonacular API key here
  apiKey: SPOONACULAR_API_KEY || 'YOUR_API_KEY_HERE',
};

/**
 * Search recipes by ingredients using Spoonacular API
 * @param {Array} ingredients - Array of ingredient names
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of recipe objects
 */
export const searchRecipesByIngredients = async (ingredients, options = {}) => {
  try {
    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    const {
      number = 20,
      ranking = 1,
      ignorePantry = false,
    } = options;

    // Convert ingredients array to comma-separated string
    const ingredientsString = ingredients.join(',');

    // Build query parameters
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_CONFIG.apiKey,
      ingredients: ingredientsString,
      number: number.toString(),
      ranking: ranking.toString(),
      ignorePantry: ignorePantry.toString(),
    });

    const url = `${SPOONACULAR_CONFIG.baseURL}${SPOONACULAR_CONFIG.endpoints.findByIngredients}?${params}`;

    console.log('Spoonacular API Request:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('Spoonacular API Response:', JSON.stringify(data[0], null, 2));
    
    // Transform Spoonacular response to our recipe format
    return data.map(recipe => {
      const missedIngredientCount = recipe.missedIngredientCount || 0;
      const usedIngredientCount = recipe.usedIngredientCount || 0;
      const missedIngredients = recipe.missedIngredients || [];
      const usedIngredients = recipe.usedIngredients || [];
      
      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        usedIngredientCount: usedIngredientCount,
        missedIngredientCount: missedIngredientCount,
        missedIngredients: missedIngredients,
        usedIngredients: usedIngredients,
        likes: recipe.likes || 0,
        // Add computed properties for UI
        canMake: missedIngredientCount <= 1, // Cook Now: 0-1 missing ingredients
        missingIngredientsText: missedIngredientCount === 0 
          ? 'Can Make' 
          : missedIngredientCount === 1
          ? 'Almost Can Make'
          : `Missing ${missedIngredientCount} items`,
        description: missedIngredientCount === 0 
          ? 'You have all ingredients!' 
          : missedIngredientCount === 1
          ? `Missing 1 ingredient: ${missedIngredients.map(ing => ing.name).join(', ')}`
          : `Missing ${missedIngredientCount} ingredients: ${missedIngredients.slice(0, 3).map(ing => ing.name).join(', ')}${missedIngredients.length > 3 ? '...' : ''}`,
      };
    });

  } catch (error) {
    console.error('Error searching recipes by ingredients:', error);
    throw error;
  }
};

/**
 * Get recipe information by ID with enhanced data
 * @param {number} recipeId - Spoonacular recipe ID
 * @returns {Promise<Object>} Recipe details with analyzed instructions
 */
export const getRecipeInformation = async (recipeId) => {
  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_CONFIG.apiKey,
      includeNutrition: 'true', // Include nutrition data
    });

    // Get basic recipe information
    const recipeUrl = `${SPOONACULAR_CONFIG.baseURL}/recipes/${recipeId}/information?${params}`;
    const recipeResponse = await fetch(recipeUrl);
    
    if (!recipeResponse.ok) {
      throw new Error(`Spoonacular API error: ${recipeResponse.status} ${recipeResponse.statusText}`);
    }

    const recipeData = await recipeResponse.json();

    // Get analyzed instructions for better step-by-step format
    const instructionsUrl = `${SPOONACULAR_CONFIG.baseURL}/recipes/${recipeId}/analyzedInstructions?${params}`;
    const instructionsResponse = await fetch(instructionsUrl);
    
    let analyzedInstructions = [];
    if (instructionsResponse.ok) {
      const instructionsData = await instructionsResponse.json();
      analyzedInstructions = instructionsData[0]?.steps || [];
    }

    // Combine recipe data with analyzed instructions
    return {
      ...recipeData,
      analyzedInstructions,
      // Add computed properties for UI
      difficulty: getDifficultyLevel(recipeData.readyInMinutes),
      formattedTime: formatTime(recipeData.readyInMinutes),
      nutritionSummary: getNutritionSummary(recipeData.nutrition),
    };

  } catch (error) {
    console.error('Error getting recipe information:', error);
    throw error;
  }
};

/**
 * Get difficulty level based on cooking time
 * @param {number} readyInMinutes - Recipe cooking time
 * @returns {string} Difficulty level
 */
const getDifficultyLevel = (readyInMinutes) => {
  if (!readyInMinutes) return 'Unknown';
  if (readyInMinutes <= 15) return 'Easy';
  if (readyInMinutes <= 30) return 'Medium';
  if (readyInMinutes <= 60) return 'Hard';
  return 'Expert';
};

/**
 * Format time in hours and minutes
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
const formatTime = (minutes) => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
};

/**
 * Get nutrition summary for display
 * @param {Object} nutrition - Nutrition data from API
 * @returns {Object} Formatted nutrition summary
 */
const getNutritionSummary = (nutrition) => {
  if (!nutrition) return null;
  
  const nutrients = nutrition.nutrients || [];
  const getNutrient = (name) => {
    const nutrient = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? `${nutrient.amount}${nutrient.unit}` : 'N/A';
  };

  return {
    calories: getNutrient('calories'),
    protein: getNutrient('protein'),
    carbohydrates: getNutrient('carbohydrates'),
    fat: getNutrient('fat'),
    fiber: getNutrient('fiber'),
    sugar: getNutrient('sugar'),
  };
};

/**
 * Check if API key is configured
 * @returns {boolean} True if API key is set
 */
export const isApiKeyConfigured = () => {
  return SPOONACULAR_CONFIG.apiKey && 
         SPOONACULAR_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' && 
         SPOONACULAR_CONFIG.apiKey.length > 0;
};

/**
 * Get similar recipes
 * @param {number} recipeId - Spoonacular recipe ID
 * @param {number} number - Number of similar recipes to return (default: 5)
 * @returns {Promise<Array>} Array of similar recipes
 */
export const getSimilarRecipes = async (recipeId, number = 5) => {
  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_CONFIG.apiKey,
      number: number.toString(),
    });

    const url = `${SPOONACULAR_CONFIG.baseURL}/recipes/${recipeId}/similar?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error getting similar recipes:', error);
    throw error;
  }
};

/**
 * Search recipes by query (for general recipe search)
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of recipe objects
 */
export const searchRecipesByQuery = async (query, options = {}) => {
  try {
    const {
      number = 20,
      cuisine = '',
      diet = '',
      intolerances = '',
      type = '',
    } = options;

    const params = new URLSearchParams({
      apiKey: SPOONACULAR_CONFIG.apiKey,
      query: query,
      number: number.toString(),
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });

    if (cuisine) params.append('cuisine', cuisine);
    if (diet) params.append('diet', diet);
    if (intolerances) params.append('intolerances', intolerances);
    if (type) params.append('type', type);

    const url = `${SPOONACULAR_CONFIG.baseURL}/recipes/complexSearch?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];

  } catch (error) {
    console.error('Error searching recipes by query:', error);
    throw error;
  }
};

/**
 * Local storage for user recipe data (no database needed)
 */
const STORAGE_KEYS = {
  USER_RECIPE_DATA: 'user_recipe_data',
  SAVED_RECIPES: 'savedRecipes',
  COOKED_RECIPES: 'cookedRecipes',
  RECIPE_RATINGS: 'recipeRatings',
  RECIPE_NOTES: 'recipeNotes',
  MEAL_PLAN: 'mealPlan',
};

/**
 * Get user recipe data from AsyncStorage
 * @returns {Promise<Object>} User recipe preferences and saved data
 */
export const getUserRecipeData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_RECIPE_DATA);
    return data ? JSON.parse(data) : {
      savedRecipes: [],
      cookedRecipes: [],
      ratings: {},
      notes: {},
      mealPlan: [],
    };
  } catch (error) {
    console.error('Error getting user recipe data:', error);
    return {
      savedRecipes: [],
      cookedRecipes: [],
      ratings: {},
      notes: {},
      mealPlan: [],
    };
  }
};

/**
 * Save user recipe data to AsyncStorage
 * @param {Object} data - User recipe data
 */
export const saveUserRecipeData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_RECIPE_DATA, JSON.stringify(data));
    console.log('User recipe data saved successfully');
  } catch (error) {
    console.error('Error saving user recipe data:', error);
  }
};

/**
 * Check if recipe is saved to user's cookbook
 * @param {number} recipeId - Recipe ID to check
 * @returns {Promise<boolean>} True if recipe is saved
 */
export const isRecipeSaved = async (recipeId) => {
  try {
    const userData = await getUserRecipeData();
    return userData.savedRecipes.includes(recipeId);
  } catch (error) {
    console.error('Error checking if recipe is saved:', error);
    return false;
  }
};

/**
 * Save recipe to user's cookbook
 * @param {number} recipeId - Recipe ID to save
 */
export const saveRecipe = async (recipeId) => {
  try {
    const userData = await getUserRecipeData();
    if (!userData.savedRecipes.includes(recipeId)) {
      userData.savedRecipes.push(recipeId);
      await saveUserRecipeData(userData);
      console.log(`Recipe ${recipeId} saved to cookbook`);
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
  }
};

/**
 * Remove recipe from user's cookbook
 * @param {number} recipeId - Recipe ID to remove
 */
export const removeRecipe = async (recipeId) => {
  try {
    const userData = await getUserRecipeData();
    userData.savedRecipes = userData.savedRecipes.filter(id => id !== recipeId);
    await saveUserRecipeData(userData);
    console.log(`Recipe ${recipeId} removed from cookbook`);
  } catch (error) {
    console.error('Error removing recipe:', error);
  }
};

/**
 * Add recipe rating
 * @param {number} recipeId - Recipe ID
 * @param {number} rating - Rating (1-5)
 */
export const addRecipeRating = async (recipeId, rating) => {
  try {
    const userData = await getUserRecipeData();
    userData.ratings[recipeId] = rating;
    await saveUserRecipeData(userData);
    console.log(`Rating ${rating} added for recipe ${recipeId}`);
  } catch (error) {
    console.error('Error adding recipe rating:', error);
  }
};

/**
 * Add recipe note
 * @param {number} recipeId - Recipe ID
 * @param {string} note - User note
 */
export const addRecipeNote = async (recipeId, note) => {
  try {
    const userData = await getUserRecipeData();
    userData.notes[recipeId] = note;
    await saveUserRecipeData(userData);
    console.log(`Note added for recipe ${recipeId}`);
  } catch (error) {
    console.error('Error adding recipe note:', error);
  }
};

/**
 * Mark recipe as cooked
 * @param {number} recipeId - Recipe ID
 */
export const markRecipeAsCooked = async (recipeId) => {
  try {
    const userData = await getUserRecipeData();
    if (!userData.cookedRecipes.includes(recipeId)) {
      userData.cookedRecipes.push(recipeId);
      await saveUserRecipeData(userData);
      console.log(`Recipe ${recipeId} marked as cooked`);
    }
  } catch (error) {
    console.error('Error marking recipe as cooked:', error);
  }
};

/**
 * Clear all user recipe data (for testing/reset purposes)
 */
export const clearAllUserRecipeData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_RECIPE_DATA,
      STORAGE_KEYS.SAVED_RECIPES,
      STORAGE_KEYS.COOKED_RECIPES,
      STORAGE_KEYS.RECIPE_RATINGS,
      STORAGE_KEYS.RECIPE_NOTES,
      STORAGE_KEYS.MEAL_PLAN,
    ]);
    console.log('All user recipe data cleared');
  } catch (error) {
    console.error('Error clearing user recipe data:', error);
  }
};

/**
 * Get all saved recipes
 * @returns {Promise<Array>} Array of saved recipe IDs
 */
export const getSavedRecipes = async () => {
  try {
    const userData = await getUserRecipeData();
    return userData.savedRecipes || [];
  } catch (error) {
    console.error('Error getting saved recipes:', error);
    return [];
  }
};

/**
 * Get all cooked recipes
 * @returns {Promise<Array>} Array of cooked recipe IDs
 */
export const getCookedRecipes = async () => {
  try {
    const userData = await getUserRecipeData();
    return userData.cookedRecipes || [];
  } catch (error) {
    console.error('Error getting cooked recipes:', error);
    return [];
  }
};

/**
 * Get API configuration status
 * @returns {Object} Configuration status
 */
export const getApiStatus = () => {
  return {
    configured: isApiKeyConfigured(),
    baseURL: SPOONACULAR_CONFIG.baseURL,
    hasApiKey: !!SPOONACULAR_CONFIG.apiKey,
  };
}; 