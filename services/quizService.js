// Quiz Service - Handles intelligent branching logic and pantry analysis

// Comprehensive quiz data with checkbox-based multi-selection
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
        question: 'What types of rice do you have?',
        type: 'multiSelect',
        icon: '🌾',
        options: [
          'White rice',
          'Brown rice',
          'Jasmine rice',
          'Basmati rice',
          'Arborio rice',
          'Wild rice',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other rice type'
      },
      {
        id: 'pasta',
        category: 'grains',
        question: 'What types of pasta do you have?',
        type: 'multiSelect',
        icon: '🍝',
        options: [
          'Spaghetti',
          'Penne',
          'Fettuccine',
          'Macaroni',
          'Rigatoni',
          'Angel hair',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other pasta type'
      },
      {
        id: 'flour',
        category: 'baking',
        question: 'What types of flour do you have?',
        type: 'multiSelect',
        icon: '🌾',
        options: [
          'All-purpose flour',
          'Whole wheat flour',
          'Bread flour',
          'Self-rising flour',
          'Almond flour',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other flour type'
      },
      // Proteins
      {
        id: 'beans',
        category: 'proteins',
        question: 'What types of beans and lentils do you have?',
        type: 'multiSelect',
        icon: '🫘',
        options: [
          'Black beans',
          'Kidney beans',
          'Chickpeas',
          'Pinto beans',
          'Navy beans',
          'Lentils (red)',
          'Lentils (green)',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other bean/lentil type'
      },
      {
        id: 'nuts',
        category: 'proteins',
        question: 'What types of nuts do you have?',
        type: 'multiSelect',
        icon: '🥜',
        options: [
          'Almonds',
          'Walnuts',
          'Pecans',
          'Cashews',
          'Peanuts',
          'Pine nuts',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other nut type'
      },
      // Pantry Essentials
      {
        id: 'oil',
        category: 'essentials',
        question: 'What types of cooking oil do you have?',
        type: 'multiSelect',
        icon: '🫒',
        options: [
          'Olive oil',
          'Vegetable oil',
          'Canola oil',
          'Coconut oil',
          'Avocado oil',
          'Sesame oil',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other oil type'
      },
      // Spices - Comprehensive checklist
      {
        id: 'spices',
        category: 'essentials',
        question: 'Which spices do you have?',
        type: 'multiSelect',
        icon: '🧂',
        options: [
          'Salt',
          'Black pepper',
          'Garlic powder',
          'Onion powder',
          'Paprika',
          'Cumin',
          'Chili powder',
          'Oregano',
          'Basil',
          'Thyme',
          'Rosemary',
          'Cinnamon',
          'Turmeric',
          'Cayenne pepper',
          'Italian seasoning',
          'Bay leaves',
          'Red pepper flakes',
          'Ginger powder',
          'Nutmeg',
          'Curry powder',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other spice',
        searchable: true
      },
      // Condiments - Comprehensive checklist
      {
        id: 'condiments',
        category: 'condiments',
        question: 'Which condiments do you have?',
        type: 'multiSelect',
        icon: '🥫',
        options: [
          'Soy sauce',
          'Olive oil',
          'Vinegar (white)',
          'Vinegar (apple cider)',
          'Balsamic vinegar',
          'Ketchup',
          'Mustard (yellow)',
          'Mustard (Dijon)',
          'Mayonnaise',
          'Hot sauce',
          'Worcestershire sauce',
          'Honey',
          'Maple syrup',
          'Lemon juice',
          'Lime juice',
          'Tomato paste',
          'Chicken broth',
          'Vegetable broth',
          'Coconut milk',
          'Fish sauce',
          'Other'
        ],
        allowOther: true,
        otherPlaceholder: 'Enter other condiment',
        searchable: true
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
    if (answer.selectedItems && answer.selectedItems.length > 0 && !answer.skipped) {
      // Score based on number of items selected
      score += Math.min(answer.selectedItems.length, 3); // Cap at 3 points per category
      
      // Track categories
      const question = QUIZ_DATA[quizType].questions.find(q => q.id === questionId);
      if (question) {
        if (!categories[question.category]) {
          categories[question.category] = 0;
        }
        categories[question.category] += answer.selectedItems.length;
      }
      
      // Detect dietary preferences
      if (questionId === 'beans' && answer.selectedItems.length > 0) {
        dietaryPreferences.push('plant-based');
      }
      if (questionId === 'nuts' && answer.selectedItems.length > 0) {
        dietaryPreferences.push('healthy-fats');
      }
    }
  });

  const finalScore = Math.min(Math.round((score / (totalQuestions * 3)) * 100), 100);
  
  return {
    score: finalScore,
    categories,
    cookingFrequency,
    dietaryPreferences: [...new Set(dietaryPreferences)],
    totalItems: Object.values(answers).reduce((sum, a) => sum + (a.selectedItems?.length || 0), 0)
  };
};

// Generate personalized recommendations
export const generateRecommendations = (answers, analysis) => {
  const recommendations = [];
  const criticalItems = [];
  const highPriorityItems = [];
  const mediumPriorityItems = [];
  
  // Check for missing essentials
  if (!answers.rice?.selectedItems || answers.rice.selectedItems.length === 0) {
    criticalItems.push({
      category: 'Grains',
      item: 'Rice',
      reason: 'Essential for many cuisines and quick meals',
      priority: 'critical',
      alternatives: ['White rice', 'Brown rice', 'Jasmine rice']
    });
  }
  
  if (!answers.pasta?.selectedItems || answers.pasta.selectedItems.length === 0) {
    criticalItems.push({
      category: 'Grains',
      item: 'Pasta',
      reason: 'Quick and versatile meal base',
      priority: 'critical',
      alternatives: ['Spaghetti', 'Penne', 'Fettuccine']
    });
  }
  
  if (!answers.oil?.selectedItems || answers.oil.selectedItems.length === 0) {
    criticalItems.push({
      category: 'Essentials',
      item: 'Cooking Oil',
      reason: 'Needed for most cooking methods',
      priority: 'critical',
      alternatives: ['Olive oil', 'Vegetable oil', 'Coconut oil']
    });
  }
  
  if (!answers.spices?.selectedItems || answers.spices.selectedItems.length < 3) {
    highPriorityItems.push({
      category: 'Essentials',
      item: 'Basic Spices',
      reason: 'Salt, pepper, and basic seasonings for flavor',
      priority: 'high',
      alternatives: ['Salt', 'Black pepper', 'Garlic powder']
    });
  }
  
  if (!answers.beans?.selectedItems || answers.beans.selectedItems.length === 0) {
    mediumPriorityItems.push({
      category: 'Proteins',
      item: 'Dried Beans/Lentils',
      reason: 'Great plant-based protein source',
      priority: 'medium',
      alternatives: ['Black beans', 'Chickpeas', 'Lentils']
    });
  }
  
  if (!answers.condiments?.selectedItems || answers.condiments.selectedItems.length < 3) {
    mediumPriorityItems.push({
      category: 'Condiments',
      item: 'Basic Condiments',
      reason: 'Add flavor and variety to meals',
      priority: 'medium',
      alternatives: ['Ketchup', 'Mustard', 'Soy sauce']
    });
  }
  
  if (!answers.flour?.selectedItems || answers.flour.selectedItems.length === 0) {
    highPriorityItems.push({
      category: 'Baking',
      item: 'Flour',
      reason: 'Essential for baking and cooking',
      priority: 'high',
      alternatives: ['All-purpose flour', 'Whole wheat flour']
    });
  }
  
  if (!answers.nuts?.selectedItems || answers.nuts.selectedItems.length === 0) {
    mediumPriorityItems.push({
      category: 'Proteins',
      item: 'Nuts & Seeds',
      reason: 'Great source of healthy fats and protein',
      priority: 'medium',
      alternatives: ['Almonds', 'Walnuts', 'Pecans']
    });
  }

  return [...criticalItems, ...highPriorityItems, ...mediumPriorityItems];
};

// Generate recipe suggestions based on pantry
export const generateRecipeSuggestions = (answers, analysis) => {
  const suggestions = [];
  
  // Rice-based recipes
  if (answers.rice?.selectedItems && answers.rice.selectedItems.length > 0) {
    suggestions.push({
      title: 'Simple Fried Rice',
      difficulty: 'Easy',
      time: '20 min',
      ingredients: ['Rice', 'Eggs', 'Vegetables'],
      hasIngredients: true,
      category: 'Quick Meals',
      description: 'Use leftover rice for a quick, delicious meal'
    });
    
    if (answers.oil?.selectedItems && answers.oil.selectedItems.length > 0) {
      suggestions.push({
        title: 'Garlic Rice',
        difficulty: 'Easy',
        time: '25 min',
        ingredients: ['Rice', 'Garlic', 'Oil', 'Butter'],
        hasIngredients: answers.oil.selectedItems.length > 0,
        category: 'Side Dishes',
        description: 'Simple and flavorful rice side dish'
      });
    }
  }
  
  // Pasta-based recipes
  if (answers.pasta?.selectedItems && answers.pasta.selectedItems.length > 0) {
    suggestions.push({
      title: 'Quick Pasta with Garlic',
      difficulty: 'Easy',
      time: '15 min',
      ingredients: ['Pasta', 'Garlic', 'Olive Oil'],
      hasIngredients: answers.oil?.selectedItems && answers.oil.selectedItems.length > 0,
      category: 'Quick Meals',
      description: 'Simple pasta with garlic and oil'
    });
    
    if (answers.spices?.selectedItems && answers.spices.selectedItems.length > 0) {
      suggestions.push({
        title: 'Pasta with Basic Spices',
        difficulty: 'Easy',
        time: '20 min',
        ingredients: ['Pasta', 'Spices', 'Oil'],
        hasIngredients: answers.oil?.selectedItems && answers.oil.selectedItems.length > 0,
        category: 'Quick Meals',
        description: 'Flavorful pasta using your basic spices'
      });
    }
  }
  
  // Bean-based recipes
  if (answers.beans?.selectedItems && answers.beans.selectedItems.length > 0) {
    suggestions.push({
      title: 'Simple Bean Salad',
      difficulty: 'Easy',
      time: '10 min',
      ingredients: ['Beans', 'Vegetables', 'Oil'],
      hasIngredients: answers.oil?.selectedItems && answers.oil.selectedItems.length > 0,
      category: 'Salads',
      description: 'Quick and nutritious bean salad'
    });
    
    if (answers.spices?.selectedItems && answers.spices.selectedItems.length > 0) {
      suggestions.push({
        title: 'Spiced Beans',
        difficulty: 'Easy',
        time: '30 min',
        ingredients: ['Beans', 'Spices', 'Oil'],
        hasIngredients: answers.oil?.selectedItems && answers.oil.selectedItems.length > 0,
        category: 'Side Dishes',
        description: 'Flavorful beans with your spices'
      });
    }
  }
  
  // Baking recipes
  if (answers.flour?.selectedItems && answers.flour.selectedItems.length > 0) {
    suggestions.push({
      title: 'Basic Pancakes',
      difficulty: 'Easy',
      time: '25 min',
      ingredients: ['Flour', 'Eggs', 'Milk'],
      hasIngredients: false,
      category: 'Breakfast',
      description: 'Classic pancakes for breakfast'
    });
    
    if (answers.spices?.selectedItems && answers.spices.selectedItems.length > 0) {
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
  if (answers.nuts?.selectedItems && answers.nuts.selectedItems.length > 0) {
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
    if (answer.selectedItems && answer.selectedItems.length > 0 && !answer.skipped) {
      answer.selectedItems.forEach(item => {
        const pantryItem = {
          name: item,
          category: getItemCategory(questionId),
          quantity: '1',
          notes: `Added from quiz - ${questionId} category`,
          daysUntilExpiration: null
        };
        
        pantryItems.push(pantryItem);
      });
    }
  });
  
  return pantryItems;
};

const getItemCategory = (questionId) => {
  const categories = {
    rice: 'Grains & Breads',
    pasta: 'Grains & Breads',
    flour: 'Baking & Flours',
    beans: 'Protein',
    nuts: 'Protein',
    oil: 'Oils, Vinegars & Fats',
    spices: 'Spices & Seasonings',
    condiments: 'Condiments & Sauces'
  };
  
  return categories[questionId] || 'Other';
}; 