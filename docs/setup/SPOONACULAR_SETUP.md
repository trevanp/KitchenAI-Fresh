# Spoonacular API Setup Guide

This guide will help you set up the Spoonacular API for ingredient-based recipe search in the Kitchen AI app.

## 1. Get Your API Key

1. Visit [Spoonacular Food API](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Navigate to your profile and copy your API key
4. Note: Free tier allows 150 requests per day

## 2. Configure Environment Variables

1. Create a `.env` file in the root directory of your project
2. Add your API key:

```env
SPOONACULAR_API_KEY=your_actual_api_key_here
```

3. Replace `your_actual_api_key_here` with your real Spoonacular API key

## 3. API Features Implemented

### Ingredient-Based Recipe Search
- **Endpoint**: `https://api.spoonacular.com/recipes/findByIngredients`
- **Parameters**:
  - `ingredients`: Comma-separated list of ingredients
  - `number`: Number of recipes to return (default: 20)
  - `ranking`: Recipe ranking (1 = maximize used ingredients, 2 = minimize missing ingredients)
  - `ignorePantry`: Whether to ignore pantry items (default: false)

### Recipe Categories
- **Cook Now**: Recipes where you have all required ingredients
- **Almost There**: Recipes missing 1 or more ingredients

### Data Mapping
The API response is transformed to match the app's recipe format:
- Recipe ID, title, and image
- Used and missed ingredient counts
- Missing ingredients list
- Computed properties for UI display

## 4. Error Handling

The app includes comprehensive error handling:
- API key validation
- Network error handling
- User-friendly error messages
- Loading states during API calls

## 5. Testing the Integration

1. Start the app with `npm start` or `expo start`
2. Navigate to the Explore screen
3. Select ingredients using the ingredient selector
4. Watch as recipes are automatically searched and categorized
5. Check the console for API request logs

## 6. API Limits and Considerations

- **Free Tier**: 150 requests per day
- **Rate Limiting**: Implemented in the service
- **Image URLs**: Spoonacular provides recipe images
- **Recipe Details**: Full recipe information available via separate endpoint

## 7. Troubleshooting

### Common Issues:

1. **"API Key Required" Error**
   - Ensure `.env` file exists in project root
   - Verify API key is correctly set
   - Restart the development server after adding `.env`

2. **"Failed to search for recipes" Error**
   - Check internet connection
   - Verify API key is valid
   - Check Spoonacular service status

3. **No recipes found**
   - Try different ingredient combinations
   - Check if ingredients are spelled correctly
   - Some ingredients may not have many recipes

## 8. Future Enhancements

- Recipe detail pages
- Save recipes to cookbook
- Nutritional information
- Recipe instructions
- Cooking time and difficulty
- Dietary restrictions filtering

## 9. API Documentation

For more information, visit:
- [Spoonacular API Documentation](https://spoonacular.com/food-api/docs)
- [Recipe Search Endpoints](https://spoonacular.com/food-api/docs#Search-Recipes)
- [Recipe Information Endpoints](https://spoonacular.com/food-api/docs#Get-Recipe-Information) 