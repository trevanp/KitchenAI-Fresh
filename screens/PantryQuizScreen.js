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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';
import { QUIZ_DATA } from '../services/quizService';
import { usePantry } from '../PantryContext';

export default function PantryQuizScreen({ navigation }) {
  const { completeQuiz } = usePantry();
  const [quizType, setQuizType] = useState('quick');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState('main'); // main, quantity, variety, frequency
  const [loading, setLoading] = useState(false);
  
  const quizData = QUIZ_DATA[quizType];
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  const handleAnswer = (answer) => {
    const questionId = currentQuestion.id;
    
    if (currentStep === 'main') {
      if (answer === 'yes' && currentQuestion.followUp) {
        setCurrentStep('quantity');
        setAnswers(prev => ({
          ...prev,
          [questionId]: { hasItem: true }
        }));
      } else {
        setAnswers(prev => ({
          ...prev,
          [questionId]: { hasItem: answer === 'yes' }
        }));
        nextQuestion();
      }
    } else if (currentStep === 'quantity') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], quantity: answer }
      }));
      setCurrentStep('variety');
    } else if (currentStep === 'variety') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], variety: answer }
      }));
      setCurrentStep('frequency');
    } else if (currentStep === 'frequency') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], frequency: answer }
      }));
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentStep('main');
    } else {
      finishQuiz();
    }
  };

  const skipQuestion = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { skipped: true }
    }));
    nextQuestion();
  };

  const finishQuiz = async () => {
    setLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save quiz results to context
    completeQuiz(answers, quizType);
    
    setLoading(false);
    
    Alert.alert(
      'Quiz Completed!',
      'Your pantry has been analyzed. We\'ll use this information to provide better recipe suggestions.',
      [
        {
          text: 'View Results',
          onPress: () => navigation.navigate('QuizResults', { answers, quizType })
        },
        {
          text: 'Continue',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const renderQuestion = () => {
    if (currentStep === 'main') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.answerButtons}>
            <TouchableOpacity 
              style={[styles.answerButton, styles.yesButton]} 
              onPress={() => handleAnswer('yes')}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
              <Text style={styles.answerButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.answerButton, styles.noButton]} 
              onPress={() => handleAnswer('no')}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
              <Text style={styles.answerButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (currentStep === 'quantity') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.followUp.quantity}</Text>
          <View style={styles.optionsList}>
            {currentQuestion.followUp.quantityOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else if (currentStep === 'variety') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.followUp.variety}</Text>
          <View style={styles.optionsList}>
            {currentQuestion.followUp.varietyOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else if (currentStep === 'frequency') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.followUp.frequency}</Text>
          <View style={styles.optionsList}>
            {currentQuestion.followUp.frequencyOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion()}
        
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={skipQuestion}>
          <Text style={styles.skipButtonText}>Skip this question</Text>
        </TouchableOpacity>
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
    paddingVertical: 32,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  answerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  yesButton: {
    backgroundColor: '#10B981',
  },
  noButton: {
    backgroundColor: '#EF4444',
  },
  answerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  optionsList: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
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