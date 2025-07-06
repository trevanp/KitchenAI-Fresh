import React, { useState, useEffect } from 'react';
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
  getScoreInfo 
} from '../services/quizService';

export default function QuizResultsScreen({ navigation, route }) {
  const { answers, quizType } = route.params;
  const [pantryScore, setPantryScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [scoreInfo, setScoreInfo] = useState({});

  useEffect(() => {
    analyzePantry();
  }, []);

  const analyzePantry = () => {
    // Use the quiz service to analyze pantry
    const analysis = analyzePantry(answers, quizType);
    setPantryScore(analysis.score);
    
    // Get score information
    const scoreData = getScoreInfo(analysis.score);
    setScoreInfo(scoreData);

    // Generate recommendations
    const recs = generateRecommendations(answers, analysis);
    setRecommendations(recs);
    
    // Generate recipe suggestions
    const suggestions = generateRecipeSuggestions(answers, analysis);
    setRecipeSuggestions(suggestions);
  };





  const addToPantry = (item) => {
    Alert.alert(
      'Add to Pantry',
      `Would you like to add ${item} to your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => {
            // Here you would integrate with your pantry system
            Alert.alert('Success', `${item} has been added to your pantry!`);
          }
        }
      ]
    );
  };

  const startCooking = (recipe) => {
    Alert.alert(
      'Start Cooking',
      `Would you like to view the recipe for ${recipe.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Recipe', 
          onPress: () => {
            // Navigate to recipe detail or search
            navigation.navigate('Explore');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pantry Analysis</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="trophy" size={32} color={scoreInfo.color || COLORS.primary} />
            <Text style={styles.scoreTitle}>Your Pantry Score</Text>
          </View>
          <Text style={[styles.scoreNumber, { color: scoreInfo.color || COLORS.primary }]}>
            {pantryScore}/100
          </Text>
          <Text style={styles.scoreMessage}>{scoreInfo.message || 'Analyzing your pantry...'}</Text>
          {scoreInfo.description && (
            <Text style={styles.scoreDescription}>{scoreInfo.description}</Text>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Additions</Text>
          <Text style={styles.sectionSubtitle}>
            These items will help you cook more recipes
          </Text>
          
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationInfo}>
                  <Text style={styles.recommendationItem}>{rec.item}</Text>
                  <Text style={styles.recommendationCategory}>{rec.category}</Text>
                </View>
                <View style={[
                  styles.priorityBadge, 
                  { backgroundColor: rec.priority === 'critical' ? '#EF4444' : 
                                   rec.priority === 'high' ? '#F59E0B' : '#10B981' }
                ]}>
                  <Text style={styles.priorityText}>
                    {rec.priority === 'critical' ? 'Critical' : 
                     rec.priority === 'high' ? 'High' : 'Medium'}
                  </Text>
                </View>
              </View>
              <Text style={styles.recommendationReason}>{rec.reason}</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => addToPantry(rec.item)}
              >
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add to Pantry</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Recipe Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Suggestions</Text>
          <Text style={styles.sectionSubtitle}>
            Based on what you have in your pantry
          </Text>
          
          {recipeSuggestions.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeDifficulty}>{recipe.difficulty}</Text>
                  <Text style={styles.recipeTime}>{recipe.time}</Text>
                </View>
              </View>
              <View style={styles.recipeIngredients}>
                <Text style={styles.ingredientsLabel}>Ingredients:</Text>
                <Text style={styles.ingredientsList}>
                  {recipe.ingredients.join(', ')}
                </Text>
              </View>
              <View style={styles.recipeActions}>
                <View style={styles.ingredientsStatus}>
                  <Ionicons 
                    name={recipe.hasIngredients ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={recipe.hasIngredients ? "#10B981" : "#F59E0B"} 
                  />
                  <Text style={[
                    styles.ingredientsStatusText,
                    { color: recipe.hasIngredients ? "#10B981" : "#F59E0B" }
                  ]}>
                    {recipe.hasIngredients ? "You have the ingredients!" : "Missing some ingredients"}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.cookButton}
                  onPress={() => startCooking(recipe)}
                >
                  <Ionicons name="restaurant" size={16} color={COLORS.white} />
                  <Text style={styles.cookButtonText}>Start Cooking</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Ionicons name="search" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Explore Recipes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Pantry')}
          >
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>View My Pantry</Text>
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
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scoreDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationItem: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  recommendationCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  recommendationReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  recipeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeHeader: {
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeDifficulty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeIngredients: {
    marginBottom: 12,
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
  recipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ingredientsStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
}); 