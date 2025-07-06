// Spoonacular API Service
// Configuration and functions for ingredient-based recipe search
import { SPOONACULAR_API_KEY } from '@env';

// API Configuration
const SPOONACULAR_CONFIG = {
  baseURL: 'https://api.spoonacular.com',
  endpoints: {
    findByIngredients: '/recipes/findByIngredients',
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
 * Get recipe information by ID
 * @param {number} recipeId - Spoonacular recipe ID
 * @returns {Promise<Object>} Recipe details
 */
export const getRecipeInformation = async (recipeId) => {
  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_CONFIG.apiKey,
    });

    const url = `${SPOONACULAR_CONFIG.baseURL}/recipes/${recipeId}/information?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error getting recipe information:', error);
    throw error;
  }
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