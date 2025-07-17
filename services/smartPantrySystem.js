// File: services/smartPantrySystem.js
// Complete AI-powered pantry management that fixes categorization and matching

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'; // Use environment variable

class SmartPantrySystem {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    this.cache = new Map(); // Cache AI responses to save money
  }

  async makeOpenAIRequest(prompt, maxTokens = 300) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.1 // Very consistent results
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI request failed:', error);
      return null;
    }
  }

  // FIX #1: SMART INGREDIENT CATEGORIZATION
  async categorizeIngredients(ingredients) {
    // Check cache first
    const cacheKey = `categorize_${ingredients.map(i => i.name).join('|')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const ingredientList = ingredients.map(item => item.name).join(', ');
    
    const prompt = `
Categorize these grocery items into the correct pantry sections:

ITEMS: ${ingredientList}

AVAILABLE CATEGORIES:
- produce (fruits, vegetables, fresh herbs)
- meat (chicken, beef, pork, fish, seafood)
- dairy (milk, cheese, yogurt, butter, eggs)
- pantry (canned goods, spices, oils, grains, pasta, bread)
- frozen (frozen vegetables, ice cream, frozen meals)
- beverages (juice, soda, coffee, tea)

IMPORTANT RULES:
- Chicken = meat (NOT produce!)
- Eggs = dairy
- Fresh herbs = produce
- Dried spices = pantry
- Canned vegetables = pantry
- Fresh vegetables = produce

Return ONLY this JSON format:
{
  "categorized_items": [
    {
      "name": "chicken breast",
      "category": "meat",
      "confidence": "high"
    },
    {
      "name": "eggs",
      "category": "dairy", 
      "confidence": "high"
    }
  ]
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 500);
      const result = JSON.parse(response);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      // Fallback categorization
      return this.fallbackCategorization(ingredients);
    }
  }

  // FIX #2: SMART INGREDIENT MATCHING FOR RECIPES
  async checkRecipeIngredients(recipeIngredients, pantryItems) {
    const cacheKey = `match_${recipeIngredients.join('|')}_${pantryItems.map(p => p.name).join('|')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const pantryList = pantryItems.map(item => item.name).join(', ');
    const recipeList = recipeIngredients.join(', ');
    
    const prompt = `
Check if this pantry can make this recipe. Be SMART about matching:

PANTRY HAS: ${pantryList}

RECIPE NEEDS: ${recipeList}

SMART MATCHING RULES:
- "eggs" matches "large eggs", "free range eggs", "egg", etc.
- "milk" matches "2% milk", "whole milk", "skim milk", etc.
- "chicken" matches "chicken breast", "chicken thighs", etc.
- "onion" matches "yellow onion", "white onion", "red onion", etc.
- "butter" can substitute for "oil" in most cases
- Different forms work: "fresh basil" = "dried basil" (just note it)

Return ONLY this JSON:
{
  "can_make_recipe": true/false,
  "ingredient_analysis": [
    {
      "needed": "eggs", 
      "status": "available",
      "pantry_match": "large eggs",
      "confidence": "perfect"
    },
    {
      "needed": "milk",
      "status": "available", 
      "pantry_match": "2% milk",
      "confidence": "perfect"
    },
    {
      "needed": "vanilla extract",
      "status": "missing",
      "pantry_match": null,
      "confidence": "none"
    }
  ],
  "missing_ingredients": ["vanilla extract"],
  "substitution_notes": "Recipe should work perfectly with your ingredients"
}

BE GENEROUS with matching - if someone has the core ingredients, they can make it!`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 600);
      const result = JSON.parse(response);
      
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.fallbackMatching(recipeIngredients, pantryItems);
    }
  }

  // BATCH PROCESS: Handle multiple ingredients at once
  async processScannedIngredients(scannedItems) {
    const prompt = `
Process these scanned grocery items. Fix any OCR errors and categorize correctly:

SCANNED ITEMS: ${scannedItems.join(', ')}

Tasks:
1. Fix obvious OCR errors (e.g., "ch1cken" → "chicken")
2. Standardize names (e.g., "Gala Apples" → "apples")
3. Categorize correctly
4. Identify quantities if mentioned

Return ONLY this JSON:
{
  "processed_items": [
    {
      "original_scan": "ch1cken breast",
      "corrected_name": "chicken breast",
      "category": "meat",
      "quantity": "1 lb",
      "confidence": "high"
    },
    {
      "original_scan": "eg9s",
      "corrected_name": "eggs", 
      "category": "dairy",
      "quantity": "1 dozen",
      "confidence": "medium"
    }
  ]
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 700);
      return JSON.parse(response);
    } catch (error) {
      // Basic fallback
      return {
        processed_items: scannedItems.map(item => ({
          original_scan: item,
          corrected_name: item,
          category: "unknown",
          quantity: null,
          confidence: "low"
        }))
      };
    }
  }

  // VALIDATE AND CATEGORIZE A SINGLE ITEM
  async validateAndCategorizeItem(itemName) {
    const prompt = `
Validate and categorize this grocery item: "${itemName}"

Tasks:
1. Fix any obvious typos or OCR errors
2. Standardize the name (remove brand names, etc.)
3. Assign the correct category
4. Suggest a reasonable quantity if not specified

Return ONLY this JSON:
{
  "original": "${itemName}",
  "corrected_name": "standardized name",
  "category": "produce/meat/dairy/pantry/frozen/beverages",
  "suggested_quantity": "1 lb",
  "confidence": "high/medium/low",
  "notes": "any relevant notes"
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 200);
      return JSON.parse(response);
    } catch (error) {
      return {
        original: itemName,
        corrected_name: itemName,
        category: "unknown",
        suggested_quantity: null,
        confidence: "low",
        notes: "AI processing failed"
      };
    }
  }

  // FALLBACK FUNCTIONS
  fallbackCategorization(ingredients) {
    const categorized = ingredients.map(item => {
      const name = item.name.toLowerCase();
      
      if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish')) {
        return { name: item.name, category: 'meat', confidence: 'medium' };
      } else if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('egg')) {
        return { name: item.name, category: 'dairy', confidence: 'medium' };
      } else if (name.includes('apple') || name.includes('banana') || name.includes('tomato') || name.includes('lettuce')) {
        return { name: item.name, category: 'produce', confidence: 'medium' };
      } else {
        return { name: item.name, category: 'pantry', confidence: 'low' };
      }
    });

    return { categorized_items: categorized };
  }

  fallbackMatching(recipeIngredients, pantryItems) {
    const pantryNames = pantryItems.map(item => item.name.toLowerCase());
    const analysis = [];
    const missing = [];

    recipeIngredients.forEach(ingredient => {
      const match = pantryNames.find(pantryItem => 
        pantryItem.includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(pantryItem)
      );

      if (match) {
        analysis.push({
          needed: ingredient,
          status: "available",
          pantry_match: match,
          confidence: "basic"
        });
      } else {
        analysis.push({
          needed: ingredient,
          status: "missing",
          pantry_match: null,
          confidence: "none"
        });
        missing.push(ingredient);
      }
    });

    return {
      can_make_recipe: missing.length === 0,
      ingredient_analysis: analysis,
      missing_ingredients: missing,
      substitution_notes: "Basic matching used"
    };
  }
}

// Create and export the service
const smartPantrySystem = new SmartPantrySystem();
export default smartPantrySystem; 