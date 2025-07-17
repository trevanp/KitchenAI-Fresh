// File: services/openaiService.js
// This is your complete OpenAI integration - just add your API key!

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here'; // Use environment variable

class OpenAIKitchenService {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
  }

  async makeOpenAIRequest(prompt, maxTokens = 500) {
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
          temperature: 0.3
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI request failed:', error);
      throw error;
    }
  }

  // FEATURE 1: What Can I Cook?
  async analyzeRecipeMatches(pantryItems, availableRecipes) {
    const pantryList = pantryItems.map(item => `${item.name}: ${item.quantity || 'some'}`).join(', ');
    const recipeList = availableRecipes.slice(0, 20).map(recipe => recipe.name).join(', '); // Limit to 20 recipes to save tokens
    
    const prompt = `
You are a kitchen assistant. I have these ingredients in my pantry:
${pantryList}

Here are some recipes I'm considering:
${recipeList}

Please analyze and return ONLY a JSON response with this exact structure:
{
  "perfect_matches": [
    {
      "recipe_name": "Recipe Name",
      "confidence": 95,
      "reason": "You have all ingredients needed"
    }
  ],
  "almost_ready": [
    {
      "recipe_name": "Recipe Name", 
      "missing_ingredients": ["ingredient1", "ingredient2"],
      "confidence": 80,
      "reason": "Just need 2 more ingredients"
    }
  ],
  "smart_suggestions": [
    {
      "ingredient": "chicken breast",
      "unlocks_recipes": 5,
      "priority": "high"
    }
  ]
}

Return only valid JSON, no other text.`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 800);
      return JSON.parse(response);
    } catch (error) {
      // Fallback response if OpenAI fails
      return {
        perfect_matches: [],
        almost_ready: [],
        smart_suggestions: []
      };
    }
  }

  // FEATURE 2: Smart Shopping List
  async generateShoppingList(pantryItems, selectedRecipes) {
    const pantryList = pantryItems.map(item => item.name).join(', ');
    const recipeList = selectedRecipes.map(recipe => recipe.name).join(', ');
    
    const prompt = `
I have these ingredients: ${pantryList}
I want to make these recipes: ${recipeList}

Create a smart shopping list. Return ONLY JSON with this structure:
{
  "shopping_list": [
    {
      "item": "ingredient name",
      "quantity": "2 lbs",
      "priority": "high",
      "reason": "Needed for 3 recipes"
    }
  ],
  "optional_items": [
    {
      "item": "ingredient name",
      "benefit": "Would unlock 2 more recipe options"
    }
  ],
  "estimated_cost": "$25-35"
}

Keep quantities realistic for a family of 4. Return only JSON.`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 600);
      return JSON.parse(response);
    } catch (error) {
      return {
        shopping_list: [],
        optional_items: [],
        estimated_cost: "Unable to calculate"
      };
    }
  }

  // FEATURE 3: Pantry Insights
  async getPantryInsights(pantryItems) {
    const pantryList = pantryItems.map(item => 
      `${item.name}: ${item.quantity || 'some'}${item.expiry_date ? ` (expires: ${item.expiry_date})` : ''}`
    ).join(', ');
    
    const prompt = `
Analyze this pantry inventory: ${pantryList}

Give me helpful insights about what I can cook and what I should prioritize. Return ONLY JSON:
{
  "insights": [
    {
      "type": "opportunity",
      "message": "You have ingredients for 8 different pasta dishes!",
      "icon": "🍝"
    },
    {
      "type": "warning", 
      "message": "Your milk expires in 2 days - here are 3 recipes that use it",
      "icon": "⚠️"
    },
    {
      "type": "suggestion",
      "message": "Buy chicken and unlock 5 more meal options",
      "icon": "💡"
    }
  ],
  "quick_stats": {
    "total_possible_meals": 15,
    "expiring_soon": 2,
    "most_versatile_ingredient": "eggs"
  }
}

Focus on actionable, helpful insights. Return only JSON.`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 400);
      return JSON.parse(response);
    } catch (error) {
      return {
        insights: [{
          type: "info",
          message: "Unable to analyze pantry at this time",
          icon: "ℹ️"
        }],
        quick_stats: {
          total_possible_meals: 0,
          expiring_soon: 0,
          most_versatile_ingredient: "unknown"
        }
      };
    }
  }

  // BONUS: Recipe Substitutions
  async suggestSubstitutions(recipeName, missingIngredients, pantryItems) {
    const pantryList = pantryItems.map(item => item.name).join(', ');
    
    const prompt = `
Recipe: ${recipeName}
Missing ingredients: ${missingIngredients.join(', ')}
Available ingredients: ${pantryList}

Suggest substitutions from available ingredients. Return ONLY JSON:
{
  "substitutions": [
    {
      "missing": "heavy cream",
      "substitute": "milk + butter",
      "ratio": "1 cup cream = 3/4 cup milk + 1/4 cup butter",
      "confidence": "high"
    }
  ],
  "notes": "These substitutions will work well for this recipe"
}`;

    try {
      const response = await this.makeOpenAIRequest(prompt, 300);
      return JSON.parse(response);
    } catch (error) {
      return {
        substitutions: [],
        notes: "Unable to suggest substitutions at this time"
      };
    }
  }
}

// Create and export the service
const openAIKitchenService = new OpenAIKitchenService();
export default openAIKitchenService; 