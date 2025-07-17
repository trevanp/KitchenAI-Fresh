import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';
import { QUIZ_DATA } from '../services/quizService';
import { usePantry } from '../PantryContext';

export default function PantryQuizScreen({ navigation, route }) {
  const { completeQuiz } = usePantry();
  const { source, returnTo, isRetake } = route.params || {};
  const [quizType, setQuizType] = useState('quick');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [otherInput, setOtherInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const quizData = QUIZ_DATA[quizType];
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  // Filter options based on search query
  const filteredOptions = currentQuestion.options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemToggle = (item) => {
    if (item === 'Other') {
      // Handle "Other" selection
      if (selectedItems.includes('Other')) {
        setSelectedItems(prev => prev.filter(i => i !== 'Other'));
        setOtherInput('');
      } else {
        setSelectedItems(prev => [...prev, 'Other']);
      }
    } else {
      // Handle regular item selection
      if (selectedItems.includes(item)) {
        setSelectedItems(prev => prev.filter(i => i !== item));
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
    }
  };

  const handleSelectAll = () => {
    const allItems = currentQuestion.options.filter(item => item !== 'Other');
    setSelectedItems(allItems);
  };

  const handleClearAll = () => {
    setSelectedItems([]);
    setOtherInput('');
  };

  const handleNext = () => {
    const questionId = currentQuestion.id;
    let finalSelectedItems = [...selectedItems];
    
    // Handle "Other" input
    if (selectedItems.includes('Other') && otherInput.trim()) {
      finalSelectedItems = finalSelectedItems.filter(item => item !== 'Other');
      finalSelectedItems.push(otherInput.trim());
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: { 
        selectedItems: finalSelectedItems,
        skipped: finalSelectedItems.length === 0
      }
    }));
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedItems([]);
      setOtherInput('');
      setSearchQuery('');
    } else {
      finishQuiz();
    }
  };

  const handleSkip = () => {
    const questionId = currentQuestion.id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: { selectedItems: [], skipped: true }
    }));
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedItems([]);
      setOtherInput('');
      setSearchQuery('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    
    // Navigate to confirmation screen with route parameters
    navigation.navigate('QuizConfirmation', { 
      answers, 
      quizType,
      source,
      returnTo,
      isRetake
    });
  };

  const renderCheckboxItem = (item) => {
    const isSelected = selectedItems.includes(item);
    const isOther = item === 'Other';
    
    return (
      <TouchableOpacity
        key={item}
        style={[styles.checkboxItem, isSelected && styles.checkboxItemSelected]}
        onPress={() => handleItemToggle(item)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
          )}
        </View>
        <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderQuestion = () => {
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        {/* Search bar for large lists */}
        {currentQuestion.searchable && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search spices..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        )}
        
        {/* Select All / Clear All buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSelectAll}>
            <Text style={styles.actionButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearAll}>
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Checkbox list */}
        <ScrollView style={styles.checkboxList} showsVerticalScrollIndicator={false}>
          {filteredOptions.map(renderCheckboxItem)}
          
          {/* Other input field */}
          {selectedItems.includes('Other') && (
            <View style={styles.otherInputContainer}>
              <TextInput
                style={styles.otherInput}
                placeholder={currentQuestion.otherPlaceholder}
                value={otherInput}
                onChangeText={setOtherInput}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          )}
        </ScrollView>
        
        {/* Selection count */}
        <Text style={styles.selectionCount}>
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Analyzing your pantry...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{quizData.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} of {quizData.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.content}>
        {renderQuestion()}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, selectedItems.length === 0 && styles.nextButtonDisabled]} 
          onPress={handleNext}
          disabled={selectedItems.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === quizData.questions.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  checkboxList: {
    flex: 1,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  checkboxTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  otherInputContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  otherInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectionCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EF4444',
    flex: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
}); 