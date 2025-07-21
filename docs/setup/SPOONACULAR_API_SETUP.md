# Spoonacular API Setup Guide

## 🎯 **Why Spoonacular API?**

Spoonacular API is the **perfect recipe discovery solution** for KitchenAI because:
- ✅ **Ingredient-based recipe search** - Find recipes using what you have
- ✅ **Missing ingredient detection** - Shows what you need to buy
- ✅ **Recipe categorization** - "Can Make Now" vs "Almost There"
- ✅ **Rich recipe data** - Images, instructions, nutrition, ratings
- ✅ **Free tier available** - 150 requests/day for testing

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Spoonacular Account**
1. Go to [Spoonacular API](https://spoonacular.com/food-api)
2. Click **"Get API Key"** or **"Sign Up"**
3. Create a free account
4. Verify your email address

### **Step 2: Get Your API Key**
1. After verification, you'll be redirected to your dashboard
2. Copy your **API Key** (starts with letters/numbers)
3. Note your **daily quota** (150 requests for free tier)

### **Step 3: Add API Key to App**
1. Open your `screens/ExploreScreen.js` file
2. Find this line:
   ```javascript
   const SPOONACULAR_API_KEY = 'paste_your_spoonacular_api_key_here';
   ```
3. Replace with your actual API key:
   ```javascript
   const SPOONACULAR_API_KEY = 'your_actual_api_key_here';
   ```
4. Save the file

### **Step 4: Restart App**
1. Stop your Expo development server (Ctrl+C)
2. Run `npx expo start --clear`
3. Test the recipe discovery functionality

## 💰 **Pricing & Quotas**

### **Free Tier:**
- **150 requests per day** - **FREE**
- Perfect for testing and light usage
- No credit card required

### **Paid Tiers:**
- **$10/month**: 1,500 requests/day
- **$25/month**: 5,000 requests/day
- **$50/month**: 15,000 requests/day
- **Custom**: Higher volumes available

### **Cost Examples:**
- **50 recipe searches per day**: Free tier (150/day)
- **200 recipe searches per day**: $10/month
- **500 recipe searches per day**: $25/month

## 🔍 **API Endpoints Used**

### **findByIngredients** (Main endpoint):
```
GET https://api.spoonacular.com/recipes/findByIngredients
```
- **Purpose**: Find recipes using ingredients you have
- **Parameters**: 
  - `ingredients`: Comma-separated ingredient list
  - `number`: Number of recipes to return (max 100)
  - `ranking`: 1 (minimize missing ingredients) or 2 (maximize used ingredients)

### **complexSearch** (Alternative endpoint):
```
GET https://api.spoonacular.com/recipes/complexSearch
```
- **Purpose**: Advanced recipe search with filters
- **Parameters**: cuisine, diet, intolerances, etc.

## 🧪 **Testing Your Setup**

### **Test API Key:**
1. Add your API key to `ExploreScreen.js`
2. Restart the app
3. Check the API notice at the bottom
4. Should show "Real recipes enabled" instead of demo data

### **Test Recipe Discovery:**
1. Open the Explore tab
2. Wait for recipes to load (2-5 seconds)
3. See real recipes based on your pantry items
4. Different pantry items should show different recipes

### **Test Recipe Categories:**
1. **"Can Make Now"**: Recipes using only your pantry items
2. **"Almost There"**: Recipes missing 1-2 ingredients
3. **Ingredient tags**: Green for items you have, red for items you need

## 🔧 **Troubleshooting**

### **"API key is invalid" error:**
- ✅ Check that API key is correctly copied
- ✅ Ensure account is verified
- ✅ Check API key hasn't expired
- ✅ Verify you're not over daily quota

### **"Quota exceeded" error:**
- ✅ Check your daily usage in Spoonacular dashboard
- ✅ Wait for quota reset (daily at midnight UTC)
- ✅ Upgrade to paid tier if needed
- ✅ App falls back to mock data automatically

### **"No recipes found" error:**
- ✅ Check pantry items are common ingredients
- ✅ Try with more pantry items
- ✅ Ensure ingredients are spelled correctly
- ✅ Check API response in console logs

### **"Network error" error:**
- ✅ Check internet connection
- ✅ Verify API key is valid
- ✅ Check Spoonacular API status
- ✅ App falls back to mock data

## 📊 **Performance Comparison**

| Feature | Mock Data | Spoonacular API |
|---------|-----------|-----------------|
| **Recipe Count** | 6 recipes | 100+ recipes |
| **Real Data** | ❌ | ✅ |
| **Ingredient Matching** | Basic | Advanced |
| **Recipe Images** | Placeholder | Real photos |
| **Recipe Details** | Limited | Complete |
| **Cost** | Free | Free tier available |

## 🎉 **Benefits of Real Recipe Discovery**

### **For Users:**
- **Real recipe suggestions** - no more fake data
- **Ingredient-based matching** - uses what you actually have
- **Missing ingredient detection** - know what to buy
- **Recipe categorization** - "Can Make Now" vs "Almost There"
- **Rich recipe information** - images, ratings, cook time

### **For Development:**
- **Production-ready** solution
- **Scalable** - handles any volume
- **Reliable** - Spoonacular's infrastructure
- **Cost-effective** - free tier available

## 🚀 **Advanced Features**

### **Recipe Filtering:**
- **Meal type**: Breakfast, Lunch, Dinner, Snacks
- **Search**: Recipe names and ingredients
- **Cuisine**: Italian, Mexican, Asian, etc.
- **Diet**: Vegetarian, Vegan, Gluten-free, etc.

### **Recipe Details:**
- **Instructions**: Step-by-step cooking directions
- **Nutrition**: Calories, protein, carbs, fat
- **Ratings**: User reviews and ratings
- **Cook time**: Preparation and cooking time
- **Servings**: Number of people served

### **Integration with Pantry:**
- **Automatic ingredient matching** with receipt scanning
- **Real-time recipe suggestions** as pantry changes
- **Shopping list generation** for missing ingredients
- **Meal planning** based on available ingredients

## 💡 **Pro Tips**

1. **Start with free tier** - 150 requests/day is plenty for testing
2. **Use common ingredients** - API works best with standard grocery items
3. **Monitor usage** - Check your daily quota in dashboard
4. **Cache results** - Store recipes locally to reduce API calls
5. **Handle errors gracefully** - App falls back to mock data on errors

## 🎯 **Success!**

Once you've added your Spoonacular API key, your KitchenAI app will have **real recipe discovery** that finds amazing meals based on your actual pantry ingredients. No more mock data - just genuine recipe suggestions that make cooking easier for busy moms!

## 🔗 **Useful Links**

- [Spoonacular API Documentation](https://spoonacular.com/food-api/docs)
- [API Key Dashboard](https://spoonacular.com/food-api/console)
- [Recipe Search Examples](https://spoonacular.com/food-api/docs#Search-Recipes)
- [Ingredient Search Examples](https://spoonacular.com/food-api/docs#Search-Recipes-by-Ingredients) 