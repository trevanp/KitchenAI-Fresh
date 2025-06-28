import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Header,
  SearchBar,
  FilterButton,
  FilterRow,
  Button,
  Card,
  LoadingState,
  EmptyState,
  Badge,
  MetaItem,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';

// Mock saved recipes data
const mockSavedRecipes = [
  {
    id: 1,
    title: 'Creamy Mushroom Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
    readyInMinutes: 25,
    difficulty: 'Easy',
    servings: 4,
    likes: 128,
    category: 'Pasta',
    ingredients: ['mushrooms', 'pasta', 'cream', 'garlic', 'parmesan'],
    instructions: 'Cook pasta, sauté mushrooms, combine with cream sauce...',
    savedAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'Grilled Chicken Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    readyInMinutes: 20,
    difficulty: 'Easy',
    servings: 2,
    likes: 89,
    category: 'Salad',
    ingredients: ['chicken breast', 'mixed greens', 'tomatoes', 'cucumber', 'olive oil'],
    instructions: 'Grill chicken, chop vegetables, assemble salad...',
    savedAt: '2024-01-14',
  },
  {
    id: 3,
    title: 'Chocolate Chip Cookies',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
    readyInMinutes: 35,
    difficulty: 'Medium',
    servings: 24,
    likes: 256,
    category: 'Dessert',
    ingredients: ['flour', 'butter', 'sugar', 'chocolate chips', 'eggs'],
    instructions: 'Cream butter and sugar, add eggs, mix in flour and chips...',
    savedAt: '2024-01-13',
  },
  {
    id: 4,
    title: 'Beef Stir Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    readyInMinutes: 30,
    difficulty: 'Medium',
    servings: 4,
    likes: 167,
    category: 'Asian',
    ingredients: ['beef', 'broccoli', 'soy sauce', 'ginger', 'garlic'],
    instructions: 'Slice beef, stir fry with vegetables and sauce...',
    savedAt: '2024-01-12',
  },
  {
    id: 5,
    title: 'Vegetable Soup',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    readyInMinutes: 45,
    difficulty: 'Easy',
    servings: 6,
    likes: 94,
    category: 'Soup',
    ingredients: ['carrots', 'celery', 'onion', 'tomatoes', 'vegetable broth'],
    instructions: 'Sauté vegetables, add broth, simmer until tender...',
    savedAt: '2024-01-11',
  },
];

const categories = ['All', 'Pasta', 'Salad', 'Dessert', 'Asian', 'Soup', 'Breakfast', 'Dinner'];
const sortOptions = ['Recently Added', 'Alphabetical', 'Cooking Time', 'Difficulty'];

export default function CookbookScreen() {
  const [savedRecipes, setSavedRecipes] = useState(mockSavedRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recently Added');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Filter and sort recipes
  const filteredAndSortedRecipes = savedRecipes
    .filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.ingredients.some(ingredient => 
                             ingredient.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case 'Alphabetical':
          return a.title.localeCompare(b.title);
        case 'Cooking Time':
          return a.readyInMinutes - b.readyInMinutes;
        case 'Difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'Recently Added':
        default:
          return new Date(b.savedAt) - new Date(a.savedAt);
      }
    });

  const handleUnsaveRecipe = (recipeId) => {
    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe from your cookbook?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
            Alert.alert('Recipe Removed', 'Recipe has been removed from your cookbook');
          }
        }
      ]
    );
  };

  const handleViewRecipe = (recipe) => {
    Alert.alert(
      'View Recipe',
      `Would you like to view the full recipe for "${recipe.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View', onPress: () => {
          // In a real app, this would navigate to a detailed recipe view
          Alert.alert('Recipe Details', `Full recipe details for ${recipe.title} would be shown here.`);
        }}
      ]
    );
  };

  const renderRecipeCard = ({ item: recipe }) => (
    <Card style={styles.recipeCard}>
      <View style={styles.recipeImageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsaveRecipe(recipe.id)}
        >
          <Ionicons name="heart-dislike" size={20} color={COLORS.error} />
        </TouchableOpacity>
        <View style={styles.recipeBadge}>
          <Badge
            label={recipe.category}
            variant="default"
            size="small"
          />
        </View>
      </View>
      
      <View style={styles.recipeContent}>
        <TouchableOpacity onPress={() => handleViewRecipe(recipe)}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.recipeMeta}>
          <MetaItem icon="time-outline" value={`${recipe.readyInMinutes} min`} />
          <MetaItem icon="star-outline" value={recipe.difficulty} />
          <MetaItem icon="people-outline" value={`${recipe.servings} servings`} />
        </View>
        
        <View style={styles.recipeFooter}>
          <View style={styles.recipeStats}>
            <Ionicons name="heart" size={16} color={COLORS.primary} />
            <Text style={styles.recipeLikes}>{recipe.likes}</Text>
          </View>
          <Text style={styles.recipeDate}>
            Saved {new Date(recipe.savedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title="My Cookbook"
        subtitle={`${savedRecipes.length} saved recipes`}
        rightAction={
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="funnel-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search your saved recipes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Sort Options */}
      {showSortOptions && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <FilterRow>
            {sortOptions.map(option => (
              <FilterButton
                key={option}
                label={option}
                isActive={selectedSort === option}
                onPress={() => {
                  setSelectedSort(option);
                  setShowSortOptions(false);
                }}
              />
            ))}
          </FilterRow>
        </View>
      )}

      {/* Category Filters */}
      <View style={styles.filterContainer}>
        <FilterRow>
          {categories.map(category => (
            <FilterButton
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </FilterRow>
      </View>

      {/* Recipes List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {savedRecipes.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Your cookbook is empty"
            message="Save recipes from the Explore tab to build your personal collection"
            action={
              <Button
                title="Explore Recipes"
                onPress={() => {
                  // In a real app, this would navigate to Explore tab
                  Alert.alert('Navigation', 'This would navigate to the Explore tab');
                }}
                variant="primary"
                size="medium"
              />
            }
          />
        ) : filteredAndSortedRecipes.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No recipes found"
            message="Try adjusting your search or filters"
            action={
              <Button
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedSort('Recently Added');
                }}
                variant="outline"
                size="medium"
              />
            }
          />
        ) : (
          <View style={styles.recipesGrid}>
            {filteredAndSortedRecipes.map(recipe => (
              <View key={recipe.id} style={styles.recipeWrapper}>
                {renderRecipeCard({ item: recipe })}
              </View>
            ))}
          </View>
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
  sortButton: {
    padding: SPACING.sm,
  },
  sortContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortLabel: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
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
  recipesGrid: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  recipeWrapper: {
    marginBottom: SPACING.lg,
  },
  recipeCard: {
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
  unsaveButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.sm,
    ...SHADOWS.small,
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
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recipeLikes: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  recipeDate: {
    ...TYPOGRAPHY.bodyXSmall,
    color: COLORS.textMuted,
  },
}); 