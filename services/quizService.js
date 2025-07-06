// Quiz Service - Handles intelligent branching logic and pantry analysis

// Comprehensive quiz data with branching logic
export const QUIZ_DATA = {
  quick: {
    title: 'Quick Pantry Quiz',
    description: '5-7 minutes • Essential staples',
    estimatedTime: '5-7 minutes',
    questions: [
      // Grains & Starches
      {
        id: 'rice',
        category: 'grains',
        question: 'Do you have rice at home?',
        type: 'existence',
        icon: '🌾',
        followUp: {
          quantity: 'How much rice do you have?',
          quantityOptions: [
            'Almost empty',
            'Less than 1 cup',
            '1-3 cups',
            'More than 3 cups',
            'Large bag/container'
          ],
          variety: 'What type of rice?',
          varietyOptions: [
            'White rice',
            'Brown rice',
            'Jasmine rice',
            'Basmati rice',
            'Wild rice',
            'Other'
          ],
          frequency: 'How often do you cook with rice?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      {
        id: 'pasta',
        category: 'grains',
        question: 'Do you have pasta at home?',
        type: 'existence',
        icon: '🍝',
        followUp: {
          quantity: 'How much pasta do you have?',
          quantityOptions: [
            'Almost empty',
            'Less than 1 pound',
            '1-2 pounds',
            'More than 2 pounds',
            'Large stock'
          ],
          variety: 'What types of pasta?',
          varietyOptions: [
            'Spaghetti',
            'Penne',
            'Fusilli',
            'Linguine',
            'Macaroni',
            'Other'
          ],
          frequency: 'How often do you cook with pasta?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      {
        id: 'flour',
        category: 'baking',
        question: 'Do you have flour at home?',
        type: 'existence',
        icon: '🌾',
        followUp: {
          quantity: 'How much flour do you have?',
          quantityOptions: [
            'Almost empty',
            'Less than 2 cups',
            '2-5 cups',
            'More than 5 cups',
            'Large bag'
          ],
          variety: 'What type of flour?',
          varietyOptions: [
            'All-purpose flour',
            'Whole wheat flour',
            'Bread flour',
            'Cake flour',
            'Almond flour',
            'Other'
          ],
          frequency: 'How often do you bake?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      // Proteins
      {
        id: 'beans',
        category: 'proteins',
        question: 'Do you have dried beans or lentils?',
        type: 'existence',
        icon: '🫘',
        followUp: {
          quantity: 'How much do you have?',
          quantityOptions: [
            'Almost empty',
            'Less than 1 cup',
            '1-3 cups',
            'More than 3 cups',
            'Large stock'
          ],
          variety: 'What types?',
          varietyOptions: [
            'Black beans',
            'Kidney beans',
            'Chickpeas',
            'Lentils',
            'Pinto beans',
            'Other'
          ],
          frequency: 'How often do you cook with beans?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      {
        id: 'nuts',
        category: 'proteins',
        question: 'Do you have nuts or seeds?',
        type: 'existence',
        icon: '🥜',
        followUp: {
          quantity: 'How much do you have?',
          quantityOptions: [
            'Almost empty',
            'Small amount',
            'Moderate amount',
            'Large amount',
            'Bulk stock'
          ],
          variety: 'What types?',
          varietyOptions: [
            'Almonds',
            'Walnuts',
            'Cashews',
            'Chia seeds',
            'Flax seeds',
            'Other'
          ],
          frequency: 'How often do you use nuts/seeds?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      // Pantry Essentials
      {
        id: 'oil',
        category: 'essentials',
        question: 'Do you have cooking oil?',
        type: 'existence',
        icon: '🫒',
        followUp: {
          quantity: 'How much oil do you have?',
          quantityOptions: [
            'Almost empty',
            'Less than 1 cup',
            '1-2 cups',
            'More than 2 cups',
            'Large bottle'
          ],
          variety: 'What types of oil?',
          varietyOptions: [
            'Olive oil',
            'Vegetable oil',
            'Coconut oil',
            'Sesame oil',
            'Avocado oil',
            'Other'
          ],
          frequency: 'How often do you cook with oil?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      {
        id: 'spices_basic',
        category: 'essentials',
        question: 'Do you have basic spices?',
        type: 'existence',
        icon: '🧂',
        followUp: {
          quantity: 'How many spices do you have?',
          quantityOptions: [
            '1-3 spices',
            '4-6 spices',
            '7-10 spices',
            '11-15 spices',
            'More than 15'
          ],
          variety: 'Which basic spices?',
          varietyOptions: [
            'Salt',
            'Black pepper',
            'Garlic powder',
            'Onion powder',
            'Paprika',
            'Cumin',
            'Oregano',
            'Other'
          ],
          frequency: 'How often do you use spices?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      },
      // Condiments
      {
        id: 'condiments',
        category: 'condiments',
        question: 'Do you have condiments?',
        type: 'existence',
        icon: '🥫',
        followUp: {
          quantity: 'How many condiments?',
          quantityOptions: [
            '1-3 condiments',
            '4-6 condiments',
            '7-10 condiments',
            '11-15 condiments',
            'More than 15'
          ],
          variety: 'Which condiments?',
          varietyOptions: [
            'Ketchup',
            'Mustard',
            'Mayonnaise',
            'Soy sauce',
            'Hot sauce',
            'Vinegar',
            'Other'
          ],
          frequency: 'How often do you use condiments?',
          frequencyOptions: [
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Daily'
          ]
        }
      }
    ]
  },
  long: {
    title: 'Comprehensive Pantry Quiz',
    description: '15-20 minutes • Complete inventory',
    estimatedTime: '15-20 minutes',
    questions: [
      // Include all quick quiz questions plus additional ones
      // This would be expanded in the full implementation
    ]
  }
};

// Analyze quiz answers and generate pantry score
export const analyzePantry = (answers, quizType) => {
  let score = 0;
  let totalQuestions = Object.keys(answers).length;
  let categories = {};
  let cookingFrequency = 'low';
  let dietaryPreferences = [];
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    if (answer.hasItem && !answer.skipped) {
      score += 1;
      
      // Bonus for good quantities
      if (answer.quantity && (
        answer.quantity.includes('Large') || 
        answer.quantity.includes('More than') ||
        answer.quantity.includes('Bulk')
      )) {
        score += 0.5;
      }
      
      // Bonus for frequent usage
      if (answer.frequency && (
        answer.frequency === 'Often' || 
        answer.frequency === 'Daily'
      )) {
        score += 0.5;
        cookingFrequency = 'high';
      }
      
      // Track categories
      const question = QUIZ_DATA[quizType].questions.find(q => q.id === questionId);
      if (question) {
        if (!categories[question.category]) {
          categories[question.category] = 0;
        }
        categories[question.category]++;
      }
      
      // Detect dietary preferences
      if (questionId === 'beans' && answer.hasItem) {
        dietaryPreferences.push('plant-based');
      }
      if (questionId === 'nuts' && answer.hasItem) {
        dietaryPreferences.push('healthy-fats');
      }
    }
  });

  const finalScore = Math.min(Math.round((score / totalQuestions) * 100), 100);
  
  return {
    score: finalScore,
    categories,
    cookingFrequency,
    dietaryPreferences: [...new Set(dietaryPreferences)],
    totalItems: Object.values(answers).filter(a => a.hasItem && !a.skipped).length
  };
};

// Generate personalized recommendations
export const generateRecommendations = (answers, analysis) => {
  const recommendations = [];
  const criticalItems = [];
  const highPriorityItems = [];
  const mediumPriorityItems = [];
  
  // Check for missing essentials
  if (!answers.rice?.hasItem) {
    criticalItems.push({
      category: 'Grains',
      item: 'Rice',
      reason: 'Essential for many cuisines and quick meals',
      priority: 'critical',
      alternatives: ['White rice', 'Brown rice', 'Jasmine rice']
    });
  }
  
  if (!answers.pasta?.hasItem) {
    criticalItems.push({
      category: 'Grains',
      item: 'Pasta',
      reason: 'Quick and versatile meal base',
      priority: 'critical',
      alternatives: ['Spaghetti', 'Penne', 'Fusilli']
    });
  }
  
  if (!answers.oil?.hasItem) {
    criticalItems.push({
      category: 'Essentials',
      item: 'Cooking Oil',
      reason: 'Needed for most cooking methods',
      priority: 'critical',
      alternatives: ['Olive oil', 'Vegetable oil', 'Coconut oil']
    });
  }
  
  if (!answers.spices_basic?.hasItem) {
    highPriorityItems.push({
      category: 'Essentials',
      item: 'Basic Spices',
      reason: 'Salt, pepper, and basic seasonings for flavor',
      priority: 'high',
      alternatives: ['Salt', 'Black pepper', 'Garlic powder']
    });
  }
  
  if (!answers.beans?.hasItem) {
    mediumPriorityItems.push({
      category: 'Proteins',
      item: 'Dried Beans/Lentils',
      reason: 'Great plant-based protein source',
      priority: 'medium',
      alternatives: ['Black beans', 'Chickpeas', 'Lentils']
    });
  }
  
  if (!answers.condiments?.hasItem) {
    mediumPriorityItems.push({
      category: 'Condiments',
      item: 'Basic Condiments',
      reason: 'Add flavor and variety to meals',
      priority: 'medium',
      alternatives: ['Ketchup', 'Mustard', 'Soy sauce']
    });
  }
  
  if (!answers.flour?.hasItem && analysis.cookingFrequency === 'high') {
    highPriorityItems.push({
      category: 'Baking',
      item: 'Flour',
      reason: 'Essential for baking and cooking',
      priority: 'high',
      alternatives: ['All-purpose flour', 'Whole wheat flour']
    });
  }
  
  if (!answers.nuts?.hasItem && analysis.dietaryPreferences.includes('healthy-fats')) {
    mediumPriorityItems.push({
      category: 'Proteins',
      item: 'Nuts & Seeds',
      reason: 'Great source of healthy fats and protein',
      priority: 'medium',
      alternatives: ['Almonds', 'Walnuts', 'Chia seeds']
    });
  }

  return [...criticalItems, ...highPriorityItems, ...mediumPriorityItems];
};

// Generate recipe suggestions based on pantry
export const generateRecipeSuggestions = (answers, analysis) => {
  const suggestions = [];
  
  // Rice-based recipes
  if (answers.rice?.hasItem) {
    suggestions.push({
      title: 'Simple Fried Rice',
      difficulty: 'Easy',
      time: '20 min',
      ingredients: ['Rice', 'Eggs', 'Vegetables'],
      hasIngredients: true,
      category: 'Quick Meals',
      description: 'Use leftover rice for a quick, delicious meal'
    });
    
    if (answers.oil?.hasItem) {
      suggestions.push({
        title: 'Garlic Rice',
        difficulty: 'Easy',
        time: '25 min',
        ingredients: ['Rice', 'Garlic', 'Oil', 'Butter'],
        hasIngredients: answers.oil?.hasItem,
        category: 'Side Dishes',
        description: 'Simple and flavorful rice side dish'
      });
    }
  }
  
  // Pasta-based recipes
  if (answers.pasta?.hasItem) {
    suggestions.push({
      title: 'Quick Pasta with Garlic',
      difficulty: 'Easy',
      time: '15 min',
      ingredients: ['Pasta', 'Garlic', 'Olive Oil'],
      hasIngredients: answers.oil?.hasItem,
      category: 'Quick Meals',
      description: 'Simple pasta with garlic and oil'
    });
    
    if (answers.spices_basic?.hasItem) {
      suggestions.push({
        title: 'Pasta with Basic Spices',
        difficulty: 'Easy',
        time: '20 min',
        ingredients: ['Pasta', 'Spices', 'Oil'],
        hasIngredients: answers.oil?.hasItem,
        category: 'Quick Meals',
        description: 'Flavorful pasta using your basic spices'
      });
    }
  }
  
  // Bean-based recipes
  if (answers.beans?.hasItem) {
    suggestions.push({
      title: 'Simple Bean Salad',
      difficulty: 'Easy',
      time: '10 min',
      ingredients: ['Beans', 'Vegetables', 'Oil'],
      hasIngredients: answers.oil?.hasItem,
      category: 'Salads',
      description: 'Quick and nutritious bean salad'
    });
    
    if (answers.spices_basic?.hasItem) {
      suggestions.push({
        title: 'Spiced Beans',
        difficulty: 'Easy',
        time: '30 min',
        ingredients: ['Beans', 'Spices', 'Oil'],
        hasIngredients: answers.oil?.hasItem,
        category: 'Side Dishes',
        description: 'Flavorful beans with your spices'
      });
    }
  }
  
  // Baking recipes
  if (answers.flour?.hasItem) {
    suggestions.push({
      title: 'Basic Pancakes',
      difficulty: 'Easy',
      time: '25 min',
      ingredients: ['Flour', 'Eggs', 'Milk'],
      hasIngredients: false,
      category: 'Breakfast',
      description: 'Classic pancakes for breakfast'
    });
    
    if (answers.spices_basic?.hasItem) {
      suggestions.push({
        title: 'Spiced Muffins',
        difficulty: 'Medium',
        time: '35 min',
        ingredients: ['Flour', 'Spices', 'Eggs', 'Milk'],
        hasIngredients: false,
        category: 'Baking',
        description: 'Delicious muffins with your spices'
      });
    }
  }
  
  // Nut-based recipes
  if (answers.nuts?.hasItem) {
    suggestions.push({
      title: 'Nut Trail Mix',
      difficulty: 'Easy',
      time: '5 min',
      ingredients: ['Nuts', 'Seeds'],
      hasIngredients: true,
      category: 'Snacks',
      description: 'Healthy snack mix with your nuts and seeds'
    });
  }

  return suggestions;
};

// Get score message and color
export const getScoreInfo = (score) => {
  if (score >= 80) {
    return {
      message: 'Excellent! You have a well-stocked pantry.',
      color: '#10B981',
      level: 'expert',
      description: 'You\'re ready to cook almost anything!'
    };
  } else if (score >= 60) {
    return {
      message: 'Good! You have most essentials covered.',
      color: '#10B981',
      level: 'intermediate',
      description: 'A few additions will make you unstoppable!'
    };
  } else if (score >= 40) {
    return {
      message: 'Fair! Consider adding some basics.',
      color: '#F59E0B',
      level: 'beginner',
      description: 'Let\'s build up your pantry essentials.'
    };
  } else {
    return {
      message: 'Basic! Let\'s build up your pantry essentials.',
      color: '#EF4444',
      level: 'starter',
      description: 'We\'ll help you stock up on the basics.'
    };
  }
};

// Convert quiz answers to pantry items
export const convertAnswersToPantryItems = (answers) => {
  const pantryItems = [];
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    if (answer.hasItem && !answer.skipped) {
      const item = {
        name: getItemName(questionId, answer),
        category: getItemCategory(questionId),
        quantity: answer.quantity || '1',
        notes: `Added from quiz - ${answer.frequency || 'Unknown'} usage`,
        daysUntilExpiration: null
      };
      
      pantryItems.push(item);
    }
  });
  
  return pantryItems;
};

const getItemName = (questionId, answer) => {
  const baseNames = {
    rice: 'Rice',
    pasta: 'Pasta',
    flour: 'Flour',
    beans: 'Dried Beans',
    nuts: 'Nuts & Seeds',
    oil: 'Cooking Oil',
    spices_basic: 'Basic Spices',
    condiments: 'Condiments'
  };
  
  let name = baseNames[questionId] || 'Unknown Item';
  
  if (answer.variety) {
    name = answer.variety;
  }
  
  return name;
};

const getItemCategory = (questionId) => {
  const categories = {
    rice: 'Grains & Starches',
    pasta: 'Grains & Starches',
    flour: 'Grains & Starches',
    beans: 'Proteins',
    nuts: 'Proteins',
    oil: 'Pantry Staples',
    spices_basic: 'Condiments & Seasonings',
    condiments: 'Condiments & Seasonings'
  };
  
  return categories[questionId] || 'Other';
}; 