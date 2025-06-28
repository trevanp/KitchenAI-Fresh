import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Header,
  SearchBar,
  FilterButton,
  FilterRow,
  LoadingState,
  EmptyState,
  Button,
  Badge,
  MetaItem,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';

const { width } = Dimensions.get('window');

// Spoonacular API configuration
const SPOONACULAR_API_KEY = '19f66e9e585f4e70b8d7b6e58af8d12b'; // Real API key
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Mock pantry data for testing (matches receipt scanning structure)
const mockPantryItems = [
  { name: 'Whole Milk', quantity: '1 gallon', category: 'Dairy & Eggs' },
  { name: 'Bread', quantity: '1 loaf', category: 'Pantry Staples' },
  { name: 'Bananas', quantity: '1 bunch', category: 'Produce' },
  { name: 'Eggs', quantity: '1 dozen', category: 'Dairy & Eggs' },
  { name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat & Seafood' },
  { name: 'Orange Juice', quantity: '1/2 gallon', category: 'Beverages' },
  { name: 'Crackers', quantity: '1 box', category: 'Snacks' },
  { name: 'Cheese', quantity: '1 block', category: 'Dairy & Eggs' },
  { name: 'Tomatoes', quantity: '4 pieces', category: 'Produce' },
  { name: 'Rice', quantity: '2 cups', category: 'Pantry Staples' },
];

// Mock recipe data for testing (when API key is not available)
const mockRecipes = {
  'Can Make Now': [
    {
      id: 1,
      title: 'Scrambled Eggs with Toast',
      image: 'https://spoonacular.com/recipeImages/1-556x370.jpg',
      usedIngredients: ['Eggs', 'Bread', 'Cheese'],
      missedIngredients: [],
      likes: 1250,
      readyInMinutes: 10,
      servings: 2,
      difficulty: 'Easy',
    },
    {
      id: 2,
      title: 'Banana Smoothie',
      image: 'https://spoonacular.com/recipeImages/2-556x370.jpg',
      usedIngredients: ['Bananas', 'Whole Milk'],
      missedIngredients: [],
      likes: 890,
      readyInMinutes: 5,
      servings: 2,
      difficulty: 'Easy',
    },
    {
      id: 3,
      title: 'Grilled Cheese Sandwich',
      image: 'https://spoonacular.com/recipeImages/3-556x370.jpg',
      usedIngredients: ['Bread', 'Cheese', 'Butter'],
      missedIngredients: [],
      likes: 2100,
      readyInMinutes: 8,
      servings: 2,
      difficulty: 'Easy',
    },
    {
      id: 4,
      title: 'Tomato and Cheese Toast',
      image: 'https://spoonacular.com/recipeImages/4-556x370.jpg',
      usedIngredients: ['Bread', 'Cheese', 'Tomatoes'],
      missedIngredients: [],
      likes: 650,
      readyInMinutes: 7,
      servings: 2,
      difficulty: 'Easy',
    },
  ],
  'Almost There': [
    {
      id: 5,
      title: 'Chicken Fried Rice',
      image: 'https://spoonacular.com/recipeImages/5-556x370.jpg',
      usedIngredients: ['Chicken Breast', 'Rice', 'Eggs'],
      missedIngredients: ['Soy Sauce', 'Vegetables'],
      likes: 1800,
      readyInMinutes: 25,
      servings: 4,
      difficulty: 'Medium',
    },
    {
      id: 6,
      title: 'Banana Bread',
      image: 'https://spoonacular.com/recipeImages/6-556x370.jpg',
      usedIngredients: ['Bananas', 'Bread', 'Eggs'],
      missedIngredients: ['Flour', 'Sugar', 'Butter'],
      likes: 3200,
      readyInMinutes: 60,
      servings: 8,
      difficulty: 'Medium',
    },
    {
      id: 7,
      title: 'Chicken Pasta',
      image: 'https://spoonacular.com/recipeImages/7-556x370.jpg',
      usedIngredients: ['Chicken Breast', 'Cheese', 'Tomatoes'],
      missedIngredients: ['Pasta', 'Olive Oil'],
      likes: 1500,
      readyInMinutes: 30,
      servings: 4,
      difficulty: 'Medium',
    },
    {
      id: 8,
      title: 'Orange Juice Smoothie',
      image: 'https://spoonacular.com/recipeImages/8-556x370.jpg',
      usedIngredients: ['Orange Juice', 'Bananas'],
      missedIngredients: ['Yogurt', 'Honey'],
      likes: 750,
      readyInMinutes: 5,
      servings: 2,
      difficulty: 'Easy',
    },
  ],
};

export default function ExploreScreen() {
  const [recipes, setRecipes] = useState({ 'Can Make Now': [], 'Almost There': [] });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [pantryItems, setPantryItems] = useState(mockPantryItems);

  const filters = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      // Use mock data by default to show UI improvements
      console.log('Using mock recipe data to show UI improvements');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setRecipes(mockRecipes);
      
      // Uncomment the line below to try real API instead
      // await fetchRecipesFromAPI();
    } catch (error) {
      console.error('Error loading recipes:', error);
      console.log('Falling back to mock recipe data');
      // Fallback to mock data on error
      setRecipes(mockRecipes);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipesFromAPI = async () => {
    try {
      console.log('🔍 Starting API call to Spoonacular...');
      // Get ingredient names from pantry
      const ingredients = pantryItems.map(item => item.name).join(',');
      console.log('🔍 Ingredients being searched:', ingredients);
      
      const apiUrl = `${SPOONACULAR_BASE_URL}/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${ingredients}&number=20&ranking=2`;
      console.log('🔍 API URL:', apiUrl);
      
      // Fetch recipes by ingredients
      const response = await fetch(apiUrl);
      
      console.log('🔍 API Response status:', response.status);
      console.log('🔍 API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API Error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 API Response data length:', data.length);
      console.log('🔍 First recipe:', data[0]);
      
      // Process and categorize recipes
      const processedRecipes = processAPIResults(data);
      console.log('🔍 Processed recipes:', processedRecipes);
      setRecipes(processedRecipes);
      
    } catch (error) {
      console.error('🔍 API Error:', error);
      throw error;
    }
  };

  const processAPIResults = (apiData) => {
    const canMakeNow = [];
    const almostThere = [];

    apiData.forEach(recipe => {
      const usedCount = recipe.usedIngredientCount || 0;
      const missedCount = recipe.missedIngredientCount || 0;

      if (missedCount === 0 && usedCount >= 2) {
        canMakeNow.push({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
          missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || [],
          likes: recipe.likes || 0,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 2,
          difficulty: getDifficulty(recipe.readyInMinutes || 30),
        });
      } else if (missedCount <= 2 && usedCount >= 1) {
        almostThere.push({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
          missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || [],
          likes: recipe.likes || 0,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 2,
          difficulty: getDifficulty(recipe.readyInMinutes || 30),
        });
      }
    });

    return { 'Can Make Now': canMakeNow, 'Almost There': almostThere };
  };

  const getDifficulty = (cookTime) => {
    if (cookTime <= 15) return 'Easy';
    if (cookTime <= 45) return 'Medium';
    return 'Hard';
  };

  const toggleSaveRecipe = (recipeId) => {
    const isCurrentlySaved = savedRecipes.some(saved => saved.id === recipeId);
    
    if (isCurrentlySaved) {
      // Remove from saved recipes
      setSavedRecipes(prev => prev.filter(saved => saved.id !== recipeId));
      Alert.alert('Recipe Removed', 'Recipe removed from your cookbook');
    } else {
      // Add to saved recipes
      setSavedRecipes(prev => [...prev, { id: recipeId }]);
      Alert.alert('Recipe Saved!', 'Recipe added to your cookbook');
    }
  };

  const filterRecipes = (recipeList) => {
    if (selectedFilter === 'All') return recipeList;
    
    // Simple keyword-based filtering for mock data
    return recipeList.filter(recipe => {
      const title = recipe.title.toLowerCase();
      switch (selectedFilter) {
        case 'Breakfast':
          return title.includes('breakfast') || title.includes('eggs') || title.includes('smoothie') || title.includes('toast');
        case 'Lunch':
          return title.includes('lunch') || title.includes('sandwich') || title.includes('salad');
        case 'Dinner':
          return title.includes('dinner') || title.includes('chicken') || title.includes('rice') || title.includes('pasta');
        case 'Snacks':
          return title.includes('snack') || title.includes('bread') || title.includes('cracker');
        default:
          return true;
      }
    });
  };

  const searchRecipes = (recipeList) => {
    if (!searchQuery.trim()) return recipeList;
    
    return recipeList.filter(recipe =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.usedIngredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase())) ||
      recipe.missedIngredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const RecipeCard = ({ recipe, category }) => {
    const isSaved = savedRecipes.some(saved => saved.id === recipe.id);
    
    const handleSaveRecipe = () => {
      toggleSaveRecipe(recipe.id);
    };

    return (
      <View style={styles.recipeCard}>
        <View style={styles.recipeImageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveRecipe}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? COLORS.primary : COLORS.white}
            />
          </TouchableOpacity>
          <View style={styles.recipeBadge}>
            <Badge
              label={category === 'Can Make Now' ? 'Ready' : 'Almost'}
              variant={category === 'Can Make Now' ? 'success' : 'warning'}
              size="small"
            />
          </View>
        </View>
        
        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          
          <View style={styles.recipeMeta}>
            <MetaItem icon="time-outline" value={`${recipe.readyInMinutes} min`} />
            <MetaItem icon="star-outline" value={recipe.difficulty} />
          </View>
          
          <View style={styles.ingredientInfo}>
            <Text style={styles.ingredientTitle}>Ingredients:</Text>
            <View style={styles.ingredientList}>
              {recipe.usedIngredients.slice(0, 3).map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.ingredientText}>
                    {typeof ingredient === 'string' ? ingredient : ingredient.name}
                  </Text>
                </View>
              ))}
              {recipe.missedIngredients.length > 0 && (
                <View style={styles.ingredientItem}>
                  <Ionicons name="close-circle" size={16} color={COLORS.error} />
                  <Text style={styles.ingredientText}>
                    +{recipe.missedIngredients.length} more needed
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const RecipeSection = ({ title, recipes, category }) => {
    const filteredRecipes = filterRecipes(searchRecipes(recipes));
    
    if (filteredRecipes.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{filteredRecipes.length} recipes</Text>
        </View>
        <View style={styles.recipeGrid}>
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} category={category} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title="Explore Recipes"
        subtitle="Discover amazing meals from your pantry"
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search recipes or ingredients..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterRow>
          {filters.map(filter => (
            <FilterButton
              key={filter}
              label={filter}
              isActive={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </FilterRow>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState
            message="Finding delicious recipes..."
            submessage="This may take a few seconds"
          />
        ) : (
          <>
            <RecipeSection
              title="✨ Can Make Now"
              recipes={recipes['Can Make Now']}
              category="Can Make Now"
            />
            <RecipeSection
              title="🔧 Almost There"
              recipes={recipes['Almost There']}
              category="Almost There"
            />
            
            {Object.values(recipes).every(recipeList => 
              filterRecipes(searchRecipes(recipeList)).length === 0
            ) && (
              <EmptyState
                icon="restaurant-outline"
                title="No recipes found"
                message="Try adjusting your search or filters"
                action={
                  <Button
                    title="Try Again"
                    onPress={loadRecipes}
                    variant="primary"
                    size="medium"
                  />
                }
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
  },
  sectionCount: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  recipeGrid: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  recipeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
    height: 200,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.overlay,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.sm,
  },
  recipeBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
  },
  recipeContent: {
    padding: SPACING.xl,
  },
  recipeTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  recipeMeta: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  ingredientInfo: {
    gap: SPACING.md,
  },
  ingredientTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ingredientList: {
    gap: SPACING.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ingredientText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
}); 