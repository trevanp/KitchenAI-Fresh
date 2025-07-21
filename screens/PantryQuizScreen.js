import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePantry } from '../PantryContext';
import {
  Header,
  Button,
  Card,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';

// Simplified quiz questions focusing on common pantry items
const QUIZ_QUESTIONS = [
  {
    id: 'proteins',
    title: 'Proteins',
    icon: '🥩',
    items: [
      { name: 'Chicken Breast', category: 'Meat & Seafood' },
      { name: 'Ground Beef', category: 'Meat & Seafood' },
      { name: 'Salmon', category: 'Meat & Seafood' },
      { name: 'Eggs', category: 'Dairy' },
      { name: 'Tofu', category: 'Meat & Seafood' },
      { name: 'Beans', category: 'Pantry Staples' },
    ]
  },
  {
    id: 'produce',
    title: 'Fresh Produce',
    icon: '🥬',
    items: [
      { name: 'Onions', category: 'Produce' },
      { name: 'Garlic', category: 'Produce' },
      { name: 'Tomatoes', category: 'Produce' },
      { name: 'Lettuce', category: 'Produce' },
      { name: 'Carrots', category: 'Produce' },
      { name: 'Bell Peppers', category: 'Produce' },
    ]
  },
  {
    id: 'dairy',
    title: 'Dairy Products',
    icon: '🥛',
    items: [
      { name: 'Milk', category: 'Dairy' },
      { name: 'Cheese', category: 'Dairy' },
      { name: 'Butter', category: 'Dairy' },
      { name: 'Yogurt', category: 'Dairy' },
      { name: 'Cream Cheese', category: 'Dairy' },
    ]
  },
  {
    id: 'pantry',
    title: 'Pantry Staples',
    icon: '🌾',
    items: [
      { name: 'Rice', category: 'Pantry Staples' },
      { name: 'Pasta', category: 'Pantry Staples' },
      { name: 'Bread', category: 'Pantry Staples' },
      { name: 'Flour', category: 'Pantry Staples' },
      { name: 'Salt', category: 'Pantry Staples' },
      { name: 'Black Pepper', category: 'Pantry Staples' },
      { name: 'Olive Oil', category: 'Pantry Staples' },
      { name: 'Sugar', category: 'Pantry Staples' },
    ]
  }
];

export default function PantryQuizScreen({ navigation, route }) {
  const { addPantryItem, markQuizAsCompleted } = usePantry();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allSelectedItems, setAllSelectedItems] = useState([]);

  const isRetake = route?.params?.isRetake || false;

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      if (prev.find(i => i.name === item.name)) {
        return prev.filter(i => i.name !== item.name);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleNext = () => {
    // Add current selections to all selected items
    setAllSelectedItems(prev => [...prev, ...selectedItems]);
    setSelectedItems([]);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedItems([]);
    }
  };

  const completeQuiz = () => {
    const finalItems = [...allSelectedItems, ...selectedItems];
    
    if (finalItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to your pantry.');
      return;
    }

    // Add items to pantry
    finalItems.forEach(item => {
      const pantryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: item.name,
        category: item.category,
        quantity: '1',
        addedAt: new Date().toISOString(),
        notes: 'Added from pantry quiz',
      };
      addPantryItem(pantryItem);
    });

    // Mark quiz as completed
    markQuizAsCompleted();

    Alert.alert(
      'Quiz Complete!',
      `Added ${finalItems.length} items to your pantry.`,
      [
        {
          text: 'View Pantry',
          onPress: () => {
            navigation.navigate('Pantry', {
              showSuccessMessage: true,
              message: `Added ${finalItems.length} items from quiz!`
            });
          }
        }
      ]
    );
  };

  const currentQuestionData = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRetake ? 'Retake Quiz' : 'Pantry Quiz'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionIcon}>{currentQuestionData.icon}</Text>
          <Text style={styles.questionTitle}>{currentQuestionData.title}</Text>
          <Text style={styles.questionSubtitle}>
            Select the items you currently have in your pantry
          </Text>
        </View>

        <View style={styles.itemsGrid}>
          {currentQuestionData.items.map((item, index) => {
            const isSelected = selectedItems.find(i => i.name === item.name);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => handleItemToggle(item)}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={COLORS.primary} 
                    style={styles.itemCheckmark}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          {currentQuestion > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              style={[styles.navButton, styles.backNavButton]}
            />
          )}
          <Button
            title={currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Complete Quiz' : 'Next'}
            onPress={handleNext}
            style={[styles.navButton, styles.nextNavButton]}
          />
        </View>
        
        {selectedItems.length > 0 && (
          <Text style={styles.selectionCount}>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'white',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  questionIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  questionTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  questionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  itemCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  itemCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  navButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  backNavButton: {
    backgroundColor: COLORS.background,
  },
  nextNavButton: {
    // Uses default primary color
  },
  selectionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 