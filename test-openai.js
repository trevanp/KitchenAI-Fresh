// Test file for OpenAI service integration
// Run this with: node test-openai.js

import openaiService from './services/openaiService.js';

// Test data
const testPantryItems = [
  { name: 'eggs', quantity: '6' },
  { name: 'milk', quantity: '1 gallon', expiry_date: '2024-01-15' },
  { name: 'bread', quantity: '1 loaf' },
  { name: 'chicken breast', quantity: '2 lbs' },
  { name: 'rice', quantity: '1 cup' },
  { name: 'tomatoes', quantity: '4' }
];

const testRecipes = [
  { name: 'Chicken Stir Fry' },
  { name: 'Scrambled Eggs' },
  { name: 'Rice Bowl' },
  { name: 'Tomato Soup' },
  { name: 'French Toast' }
];

async function testOpenAIService() {
  console.log('🧪 Testing OpenAI Service Integration...\n');

  try {
    // Test 1: Pantry Insights
    console.log('📊 Testing Pantry Insights...');
    const insights = await openaiService.getPantryInsights(testPantryItems);
    console.log('✅ Pantry Insights:', JSON.stringify(insights, null, 2));
    console.log('');

    // Test 2: Recipe Matching
    console.log('🍳 Testing Recipe Matching...');
    const matches = await openaiService.analyzeRecipeMatches(testPantryItems, testRecipes);
    console.log('✅ Recipe Matches:', JSON.stringify(matches, null, 2));
    console.log('');

    // Test 3: Shopping List Generation
    console.log('🛒 Testing Shopping List Generation...');
    const shoppingList = await openaiService.generateShoppingList(testPantryItems, testRecipes);
    console.log('✅ Shopping List:', JSON.stringify(shoppingList, null, 2));
    console.log('');

    // Test 4: Recipe Substitutions
    console.log('🔄 Testing Recipe Substitutions...');
    const substitutions = await openaiService.suggestSubstitutions(
      'Chicken Stir Fry',
      ['soy sauce', 'ginger'],
      testPantryItems
    );
    console.log('✅ Substitutions:', JSON.stringify(substitutions, null, 2));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('💡 Make sure to add your OpenAI API key to services/openaiService.js');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure you have added your OpenAI API key to services/openaiService.js');
    console.log('2. Check that your API key is valid and has credits');
    console.log('3. Verify your internet connection');
    console.log('4. Check the OpenAI service status at https://status.openai.com/');
  }
}

// Run the test
testOpenAIService(); 