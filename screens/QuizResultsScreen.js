import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';
import { 
  analyzePantry, 
  generateRecommendations, 
  generateRecipeSuggestions, 
  getScoreInfo,
  convertAnswersToPantryItems 
} from '../services/quizService';
import { usePantry } from '../PantryContext';

export default function QuizResultsScreen({ navigation, route }) {
  const { answers, quizType } = route.params;
  const { addPantryItems } = usePantry();
  
  const analysis = analyzePantry(answers, quizType);
  const recommendations = generateRecommendations(answers, analysis);
  const recipeSuggestions = generateRecipeSuggestions(answers, analysis);
  const scoreInfo = getScoreInfo(analysis.score);
  const pantryItems = convertAnswersToPantryItems(answers);

  const handleAddToPantry = () => {
    // Navigate back to confirmation screen to add items
    navigation.navigate('QuizConfirmation', { answers, quizType });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Produce': '🥬',
      'Protein': '🥩',
      'Dairy': '🥛',
      'Grains & Breads': '🍞',
      'Canned & Jarred Goods': '🥫',
      'Baking & Flours': '🧁',
      'Spices & Seasonings': '🧂',
      'Oils, Vinegars & Fats': '🫒',
      'Condiments & Sauces': '🍯',
      'Frozen': '🧊',
      'Snacks & Treats': '🍿',
      'Drinks & Beverages': '🥤',
      'Grains': '🌾',
      'Proteins': '🥜',
      'Essentials': '🧂',
      'Condiments': '🥫',
      'Baking': '🍞',
      'Pantry Staples': '📦'
    };
    return icons[category] || '📦';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#10B981'
    };
    return colors[priority] || COLORS.textSecondary;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{analysis.score}</Text>
            <Text style={styles.scoreLabel}>Pantry Score</Text>
          </View>
          <Text style={styles.scoreMessage}>{scoreInfo.message}</Text>
          <Text style={styles.scoreDescription}>{scoreInfo.description}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Pantry Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{analysis.totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Object.keys(analysis.categories).length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recommendations.length}</Text>
              <Text style={styles.statLabel}>Suggestions</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {Object.entries(analysis.categories).map(([category, count]) => (
            <View key={category} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryCount}>{count} items</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations Section */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommended Additions</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(rec.priority) }]} />
                <Text style={styles.recommendationTitle}>{rec.item}</Text>
                <Text style={[styles.priorityText, { color: getPriorityColor(rec.priority) }]}>
                  {rec.priority.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recommendationReason}>{rec.reason}</Text>
              <View style={styles.alternativesContainer}>
                <Text style={styles.alternativesLabel}>Suggestions:</Text>
                <View style={styles.alternativesList}>
                  {rec.alternatives.map((alt, altIndex) => (
                    <Text key={altIndex} style={styles.alternativeItem}>• {alt}</Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recipe Suggestions */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>Recipe Suggestions</Text>
          {recipeSuggestions.map((recipe, index) => (
            <View key={index} style={styles.recipeItem}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeDifficulty}>{recipe.difficulty}</Text>
                  <Text style={styles.recipeTime}>{recipe.time}</Text>
                </View>
              </View>
              <Text style={styles.recipeDescription}>{recipe.description}</Text>
              <View style={styles.recipeIngredients}>
                <Text style={styles.ingredientsLabel}>Ingredients:</Text>
                <Text style={styles.ingredientsList}>{recipe.ingredients.join(', ')}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleAddToPantry}
          >
            <Ionicons name="list" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>
              Review & Add Items
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Explore', { screen: 'ExploreMain' })}
          >
            <Ionicons name="restaurant" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Find Recipes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  scoreMessage: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryItem: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  recommendationsSection: {
    marginBottom: 32,
  },
  recommendationItem: {
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  alternativesContainer: {
    marginTop: 8,
  },
  alternativesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  alternativesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  alternativeItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 16,
  },
  recipesSection: {
    marginBottom: 32,
  },
  recipeItem: {
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  recipeDifficulty: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  recipeIngredients: {
    marginTop: 8,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ingredientsList: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionSection: {
    paddingVertical: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
}); 