# OpenAI API Setup Guide for KitchenAI

## 🚀 Quick Setup

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy your API key (it starts with `sk-`)

### 2. Add Your API Key
Open `services/openaiService.js` and replace:
```javascript
const OPENAI_API_KEY = 'your-openai-api-key-here';
```
with:
```javascript
const OPENAI_API_KEY = 'sk-your-actual-api-key-here';
```

### 3. Test the Integration
The service is ready to use! Here's how to test it:

```javascript
import openaiService from './services/openaiService';

// Test pantry insights
const testPantry = [
  { name: 'eggs', quantity: '6' },
  { name: 'milk', quantity: '1 gallon', expiry_date: '2024-01-15' },
  { name: 'bread', quantity: '1 loaf' }
];

const insights = await openaiService.getPantryInsights(testPantry);
console.log(insights);
```

## 🎯 Features Available

### 1. **What Can I Cook?** (`analyzeRecipeMatches`)
- Analyzes your pantry against available recipes
- Returns perfect matches, almost-ready recipes, and smart ingredient suggestions
- Perfect for the recipe explore page

### 2. **Smart Shopping List** (`generateShoppingList`)
- Creates intelligent shopping lists based on selected recipes
- Includes quantities, priorities, and cost estimates
- Great for the grocery list screen

### 3. **Pantry Insights** (`getPantryInsights`)
- Provides actionable insights about your pantry
- Warns about expiring items
- Suggests meal opportunities
- Ideal for the pantry screen

### 4. **Recipe Substitutions** (`suggestSubstitutions`)
- Suggests ingredient substitutions from what you have
- Helps when you're missing ingredients
- Perfect for recipe detail pages

## 💡 Usage Examples

### In ExploreScreen.js
```javascript
import openaiService from '../services/openaiService';

// Add to your component
const [recipeMatches, setRecipeMatches] = useState(null);

useEffect(() => {
  async function loadAIMatches() {
    try {
      const matches = await openaiService.analyzeRecipeMatches(pantryItems, recipes);
      setRecipeMatches(matches);
    } catch (error) {
      console.log('AI features unavailable');
    }
  }
  loadAIMatches();
}, [pantryItems, recipes]);
```

### In GroceryListScreen.js
```javascript
const generateSmartList = async () => {
  try {
    const smartList = await openaiService.generateShoppingList(pantryItems, selectedRecipes);
    setShoppingList(smartList);
  } catch (error) {
    console.log('Smart list generation failed');
  }
};
```

### In PantryScreen.js
```javascript
const loadInsights = async () => {
  try {
    const insights = await openaiService.getPantryInsights(pantryItems);
    setPantryInsights(insights);
  } catch (error) {
    console.log('Insights unavailable');
  }
};
```

## 🔧 Configuration Options

### Model Selection
You can change the AI model in `makeOpenAIRequest()`:
- `gpt-3.5-turbo` (current) - Fast, cost-effective
- `gpt-4` - More accurate, higher cost
- `gpt-4-turbo` - Best balance of speed and accuracy

### Token Limits
Adjust `maxTokens` for different features:
- Recipe matching: 800 tokens
- Shopping list: 600 tokens  
- Pantry insights: 400 tokens
- Substitutions: 300 tokens

### Temperature
Current setting: `0.3` (more focused responses)
- Lower (0.1-0.3): More consistent, focused
- Higher (0.7-0.9): More creative, varied

## 💰 Cost Management

### Estimated Costs (GPT-3.5-turbo)
- Recipe matching: ~$0.01-0.02 per request
- Shopping list: ~$0.01 per request
- Pantry insights: ~$0.005 per request
- Substitutions: ~$0.005 per request

### Cost Optimization Tips
1. **Cache results** - Don't re-analyze the same pantry
2. **Limit recipe lists** - Only send top 20 recipes to save tokens
3. **Batch requests** - Combine multiple analyses when possible
4. **Use fallbacks** - Graceful degradation when API fails

## 🛡️ Security Best Practices

### Environment Variables (Recommended)
Instead of hardcoding your API key, use environment variables:

1. Create a `.env` file in your project root:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

2. Update `services/openaiService.js`:
```javascript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-fallback-key';
```

3. Add `.env` to your `.gitignore`:
```
.env
```

### API Key Security
- Never commit API keys to version control
- Use environment variables in production
- Rotate keys regularly
- Monitor usage in OpenAI dashboard

## 🚨 Error Handling

The service includes built-in error handling:
- Graceful fallbacks when API fails
- Console logging for debugging
- Empty but valid responses to prevent app crashes

## 📱 Integration Checklist

- [ ] Get OpenAI API key
- [ ] Add key to `openaiService.js`
- [ ] Test basic functionality
- [ ] Integrate into ExploreScreen
- [ ] Integrate into GroceryListScreen  
- [ ] Integrate into PantryScreen
- [ ] Add error handling in components
- [ ] Test with real pantry data
- [ ] Monitor API usage and costs

## 🎉 You're Ready!

Your KitchenAI app now has powerful AI features that will help users:
- Find recipes they can actually make
- Create smart shopping lists
- Get insights about their pantry
- Find ingredient substitutions

The AI will make your app much more intelligent and user-friendly! 