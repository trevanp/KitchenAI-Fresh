// Test file for Smart Ingredient Matcher
// Run this with: node test-smart-matcher.js

import smartMatcher from './services/smartIngredientMatcher.js';

// Test data
const testPantryItems = [
  { name: '2% milk', quantity: '1 gallon' },
  { name: 'yellow onion', quantity: '2' },
  { name: 'chicken breast', quantity: '1 lb' },
  { name: 'olive oil', quantity: '1 cup' },
  { name: 'garlic powder', quantity: '1 tsp' },
  { name: 'salt', quantity: '1 tsp' }
];

const testRecipeIngredients = [
  'milk',
  'onion', 
  'chicken',
  'oil',
  'garlic',
  'salt'
];

const testRecipes = [
  {
    name: 'Chicken Stir Fry',
    ingredients: ['chicken', 'onion', 'oil', 'garlic', 'soy sauce']
  },
  {
    name: 'Scrambled Eggs',
    ingredients: ['eggs', 'milk', 'butter', 'salt']
  },
  {
    name: 'Simple Pasta',
    ingredients: ['pasta', 'olive oil', 'garlic', 'salt']
  }
];

async function testSmartMatcher() {
  console.log('🧪 Testing Smart Ingredient Matcher...\n');

  try {
    // Test 1: Single recipe matching
    console.log('🍳 Testing Single Recipe Matching...');
    const recipeResult = await smartMatcher.canMakeRecipe(testRecipeIngredients, testPantryItems);
    console.log('✅ Recipe Match Result:', JSON.stringify(recipeResult, null, 2));
    console.log('');

    // Test 2: Single ingredient checking
    console.log('🥛 Testing Single Ingredient Check...');
    const ingredientResult = await smartMatcher.checkSingleIngredient('milk', testPantryItems);
    console.log('✅ Ingredient Check Result:', JSON.stringify(ingredientResult, null, 2));
    console.log('');

    // Test 3: Batch recipe checking
    console.log('📋 Testing Batch Recipe Checking...');
    const batchResult = await smartMatcher.checkMultipleRecipes(testRecipes, testPantryItems);
    console.log('✅ Batch Check Result:', JSON.stringify(batchResult, null, 2));
    console.log('');

    // Test 4: Cache test
    console.log('⚡ Testing Cache Functionality...');
    const startTime = Date.now();
    const cachedResult = await smartMatcher.canMakeRecipe(testRecipeIngredients, testPantryItems);
    const endTime = Date.now();
    console.log(`✅ Cached result (${endTime - startTime}ms):`, JSON.stringify(cachedResult, null, 2));
    console.log('');

    console.log('🎉 All smart matcher tests completed successfully!');
    console.log('💡 The matcher is now ready to use in your app');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure your OpenAI API key is valid');
    console.log('2. Check your internet connection');
    console.log('3. Verify the API key has credits');
  }
}

// Run the test
testSmartMatcher(); 