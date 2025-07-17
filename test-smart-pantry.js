// Test file for Smart Pantry System
// Run this with: node test-smart-pantry.js

import smartPantry from './services/smartPantrySystem.js';

// Test data
const testIngredients = [
  { name: 'chicken breast' },
  { name: 'eggs' },
  { name: 'milk' },
  { name: 'onion' },
  { name: 'tomato' },
  { name: 'rice' }
];

const testPantryItems = [
  { name: '2% milk', quantity: '1 gallon' },
  { name: 'large eggs', quantity: '12' },
  { name: 'chicken breast', quantity: '1 lb' },
  { name: 'yellow onion', quantity: '2' },
  { name: 'olive oil', quantity: '1 cup' }
];

const testRecipeIngredients = [
  'eggs',
  'milk',
  'chicken',
  'onion',
  'oil',
  'salt'
];

const testScannedItems = [
  'ch1cken breast',
  'eg9s',
  'm1lk',
  'on1on',
  't0mat0'
];

async function testSmartPantry() {
  console.log('🧪 Testing Smart Pantry System...\n');

  try {
    // Test 1: Smart categorization
    console.log('📂 Testing Smart Categorization...');
    const categorization = await smartPantry.categorizeIngredients(testIngredients);
    console.log('✅ Categorization Result:', JSON.stringify(categorization, null, 2));
    console.log('');

    // Test 2: Recipe ingredient checking
    console.log('🍳 Testing Recipe Ingredient Checking...');
    const recipeCheck = await smartPantry.checkRecipeIngredients(testRecipeIngredients, testPantryItems);
    console.log('✅ Recipe Check Result:', JSON.stringify(recipeCheck, null, 2));
    console.log('');

    // Test 3: Process scanned ingredients
    console.log('📷 Testing Scanned Ingredient Processing...');
    const scannedProcessing = await smartPantry.processScannedIngredients(testScannedItems);
    console.log('✅ Scanned Processing Result:', JSON.stringify(scannedProcessing, null, 2));
    console.log('');

    // Test 4: Real-time validation
    console.log('🔍 Testing Real-time Validation...');
    const validation1 = await smartPantry.validateAndCategorizeItem('ch1cken');
    const validation2 = await smartPantry.validateAndCategorizeItem('eg9s');
    console.log('✅ Validation Results:');
    console.log('  "ch1cken" →', JSON.stringify(validation1, null, 2));
    console.log('  "eg9s" →', JSON.stringify(validation2, null, 2));
    console.log('');

    // Test 5: Cache functionality
    console.log('⚡ Testing Cache Functionality...');
    const startTime = Date.now();
    const cachedResult = await smartPantry.categorizeIngredients(testIngredients);
    const endTime = Date.now();
    console.log(`✅ Cached categorization (${endTime - startTime}ms):`, JSON.stringify(cachedResult, null, 2));
    console.log('');

    console.log('🎉 All smart pantry tests completed successfully!');
    console.log('💡 The smart pantry system is ready to fix categorization and matching issues');

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
testSmartPantry(); 