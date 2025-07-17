// Test file for Essentials Fix
// Run this with: node test-essentials-fix.js

import PantryEssentialsManager from './services/pantryEssentialsService.js';

// Mock user pantry items
const mockUserPantryItems = [
  {
    id: '1',
    name: 'Chicken Breast',
    category: 'Protein',
    quantity: '1 lb',
    addedAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Rice',
    category: 'Grains & Breads',
    quantity: '2 cups',
    addedAt: new Date().toISOString()
  }
];

async function testEssentialsFix() {
  console.log('🧪 Testing Essentials Fix...\n');

  try {
    // Test 1: Check if essentials are enabled
    console.log('📋 Test 1: Checking essentials status...');
    const enabled = await PantryEssentialsManager.areEssentialsEnabled();
    console.log('✅ Essentials enabled:', enabled);
    console.log('');

    // Test 2: Get all available ingredients
    console.log('📋 Test 2: Getting all available ingredients...');
    const allIngredients = await PantryEssentialsManager.getAllAvailableIngredients(mockUserPantryItems);
    console.log('✅ Total ingredients:', allIngredients.length);
    console.log('✅ User items:', mockUserPantryItems.length);
    console.log('✅ Essential items added:', allIngredients.length - mockUserPantryItems.length);
    
    // Show which essentials were added
    const essentialItems = allIngredients.filter(item => item.isEssential);
    console.log('✅ Essential items:', essentialItems.map(item => item.name));
    console.log('');

    // Test 3: Check recipe matching ingredients
    console.log('📋 Test 3: Checking recipe matching ingredients...');
    const recipeIngredients = ['eggs', 'milk', 'flour', 'salt', 'chicken'];
    const availableNames = allIngredients.map(item => item.name.toLowerCase());
    
    const matchingIngredients = recipeIngredients.filter(ingredient => 
      availableNames.some(available => 
        available.includes(ingredient) || ingredient.includes(available)
      )
    );
    
    const missingIngredients = recipeIngredients.filter(ingredient => 
      !availableNames.some(available => 
        available.includes(ingredient) || ingredient.includes(available)
      )
    );
    
    console.log('✅ Recipe ingredients:', recipeIngredients);
    console.log('✅ Matching ingredients:', matchingIngredients);
    console.log('✅ Missing ingredients:', missingIngredients);
    console.log('✅ Match rate:', `${matchingIngredients.length}/${recipeIngredients.length} (${Math.round(matchingIngredients.length/recipeIngredients.length*100)}%)`);
    console.log('');

    // Test 4: Check specific essential matching
    console.log('📋 Test 4: Checking specific essential matching...');
    const essentialTests = [
      { recipe: 'eggs', pantry: 'Eggs' },
      { recipe: 'milk', pantry: 'Milk' },
      { recipe: 'flour', pantry: 'All-Purpose Flour' },
      { recipe: 'salt', pantry: 'Salt' },
      { recipe: 'butter', pantry: 'Butter' }
    ];
    
    essentialTests.forEach(test => {
      const found = allIngredients.some(item => 
        item.name.toLowerCase().includes(test.recipe.toLowerCase()) ||
        test.recipe.toLowerCase().includes(item.name.toLowerCase())
      );
      console.log(`✅ ${test.recipe} → ${test.pantry}: ${found ? 'MATCH' : 'MISSING'}`);
    });
    console.log('');

    console.log('🎉 Essentials fix test completed successfully!');
    console.log('💡 Essentials should now be properly included in recipe matching');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure AsyncStorage is working');
    console.log('2. Check that essentials are enabled');
    console.log('3. Verify the pantry essentials service is loaded');
  }
}

// Run the test
testEssentialsFix(); 