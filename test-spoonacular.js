// Test file for Spoonacular API service
// Run with: node test-spoonacular.js

const { searchRecipesByIngredients, isApiKeyConfigured, getApiStatus } = require('./services/spoonacularService');

async function testSpoonacularAPI() {
  console.log('🧪 Testing Spoonacular API Integration...\n');

  // Test 1: Check API configuration
  console.log('1. Checking API configuration...');
  const apiStatus = getApiStatus();
  console.log('API Status:', apiStatus);
  
  if (!apiStatus.configured) {
    console.log('❌ API key not configured. Please add SPOONACULAR_API_KEY to your .env file');
    console.log('   Get your API key from: https://spoonacular.com/food-api');
    return;
  }

  console.log('✅ API key is configured\n');

  // Test 2: Test ingredient search
  console.log('2. Testing ingredient-based recipe search...');
  try {
    const testIngredients = ['chicken', 'broccoli', 'garlic'];
    console.log('Searching for recipes with:', testIngredients.join(', '));
    
    const recipes = await searchRecipesByIngredients(testIngredients, {
      number: 5,
      ranking: 1,
      ignorePantry: false,
    });

    console.log(`✅ Found ${recipes.length} recipes`);
    
    if (recipes.length > 0) {
      console.log('\nSample recipe:');
      const sampleRecipe = recipes[0];
      console.log(`- Title: ${sampleRecipe.title}`);
      console.log(`- Can Make: ${sampleRecipe.canMake}`);
      console.log(`- Missing Ingredients: ${sampleRecipe.missedIngredientCount}`);
      console.log(`- Used Ingredients: ${sampleRecipe.usedIngredientCount}`);
      console.log(`- Description: ${sampleRecipe.description}`);
    }

  } catch (error) {
    console.log('❌ Error testing recipe search:', error.message);
  }

  console.log('\n🎉 Test completed!');
}

// Run the test
testSpoonacularAPI().catch(console.error); 