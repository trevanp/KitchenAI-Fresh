// File: services/smartIngredientMatcher.js
// This replaces your rigid ingredient matching with AI-powered smart matching

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'; // Use environment variable

class SmartIngredientMatcher {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    // Cache for common matches to save API calls
    this.matchCache = new Map();
  }

  async makeOpenAIRequest(prompt) {
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
          max_tokens: 300,
          temperature: 0.1 // Very low for consistent matching
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Smart matching failed, using fallback:', error);
      return null;
    }
  }

  // MAIN FUNCTION: Check if a recipe can be made with pantry items
  async canMakeRecipe(recipeIngredients, pantryItems) {
    const cacheKey = `${recipeIngredients.join('|')}::${pantryItems.map(p => p.name).join('|')}`;
    
    if (this.matchCache.has(cacheKey)) {
      return this.matchCache.get(cacheKey);
    }

    const pantryList = pantryItems.map(item => item.name).join(', ');
    const recipeList = recipeIngredients.join(', ');
    
    const prompt = `
You are a kitchen expert. Check if these pantry ingredients can make this recipe.

PANTRY AVAILABLE: ${pantryList}

RECIPE NEEDS: ${recipeList}

RULES:
- Be flexible with milk types (2%, whole, skim are all "milk")
- Accept reasonable substitutions (butter for oil, etc.)
- Consider different forms (fresh vs dried herbs, etc.)
- Ground beef = beef, chicken breast = chicken, etc.

Return ONLY this JSON format:
{
  "can_make": true/false,
  "matches": [
    {"needed": "milk", "have": "2% milk", "confidence": "perfect"},
    {"needed": "onion", "have": "yellow onion", "confidence": "perfect"}
  ],
  "missing": ["ingredient1", "ingredient2"],
  "substitution_notes": "Can use 2% milk instead of whole milk"
}

Be practical - if someone has the core ingredients, they can probably make it.`;

    try {
      const response = await this.makeOpenAIRequest(prompt);
      const result = JSON.parse(response);
      
      // Cache the result
      this.matchCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      // Fallback to basic matching if AI fails
      return this.basicFallbackMatch(recipeIngredients, pantryItems);
    }
  }

  // SIMPLER FUNCTION: Just check individual ingredients
  async checkSingleIngredient(neededIngredient, pantryItems) {
    const pantryList = pantryItems.map(item => item.name).join(', ');
    
    const prompt = `
PANTRY: ${pantryList}
NEEDED: ${neededIngredient}

Can the pantry ingredient(s) substitute for what's needed? Be flexible - different milk types, meat cuts, etc. are usually fine.

Return ONLY JSON:
{
  "match": true/false,
  "pantry_item": "actual item name that matches",
  "confidence": "perfect/good/acceptable",
  "note": "why this works"
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Basic fallback
      const basicMatch = pantryItems.find(item => 
        item.name.toLowerCase().includes(neededIngredient.toLowerCase()) ||
        neededIngredient.toLowerCase().includes(item.name.toLowerCase())
      );
      
      return {
        match: !!basicMatch,
        pantry_item: basicMatch?.name || null,
        confidence: basicMatch ? "basic" : "none",
        note: basicMatch ? "Basic text match" : "No match found"
      };
    }
  }

  // BATCH FUNCTION: Check multiple recipes at once (more efficient)
  async checkMultipleRecipes(recipes, pantryItems) {
    const pantryList = pantryItems.map(item => item.name).join(', ');
    const recipeData = recipes.map(r => `${r.name}: ${r.ingredients.join(', ')}`).join('\n');
    
    const prompt = `
PANTRY: ${pantryList}

RECIPES TO CHECK:
${recipeData}

For each recipe, determine if it can be made with available ingredients. Be flexible with substitutions.

Return ONLY JSON:
{
  "results": [
    {
      "recipe_name": "Recipe Name",
      "can_make": true/false,
      "missing_count": 0,
      "confidence": "high/medium/low",
      "missing_items": ["item1", "item2"]
    }
  ]
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Return basic results if AI fails
      return {
        results: recipes.map(recipe => ({
          recipe_name: recipe.name,
          can_make: false,
          missing_count: recipe.ingredients.length,
          confidence: "unknown",
          missing_items: recipe.ingredients
        }))
      };
    }
  }

  // Fallback function when AI isn't available
  basicFallbackMatch(recipeIngredients, pantryItems) {
    const pantryNames = pantryItems.map(item => item.name.toLowerCase());
    const matches = [];
    const missing = [];

    recipeIngredients.forEach(ingredient => {
      const match = pantryNames.find(pantryItem => 
        pantryItem.includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(pantryItem)
      );
      
      if (match) {
        matches.push({
          needed: ingredient,
          have: match,
          confidence: "basic"
        });
      } else {
        missing.push(ingredient);
      }
    });

    return {
      can_make: missing.length === 0,
      matches,
      missing,
      substitution_notes: "Basic matching used"
    };
  }
}

// Create and export the service
const smartIngredientMatcher = new SmartIngredientMatcher();
export default smartIngredientMatcher; 