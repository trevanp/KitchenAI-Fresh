import React, { createContext, useContext, useState, useEffect } from 'react';
import { convertAnswersToPantryItems } from './services/quizService';
import PantryEssentialsManager from './services/pantryEssentialsService';

const PantryContext = createContext();

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) {
      throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};

export const PantryProvider = ({ children }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [essentialsEnabled, setEssentialsEnabled] = useState(false);
  const [essentialsStats, setEssentialsStats] = useState(null);

  const addPantryItem = (item) => {
    const newItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
      addedAt: new Date().toISOString(),
    };
    setPantryItems(prev => [...prev, newItem]);
  };

  const addPantryItems = (items) => {
    const newItems = items.map(item => ({
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
      addedAt: new Date().toISOString(),
    }));
    setPantryItems(prev => [...prev, ...newItems]);
  };

  const removePantryItem = (itemId) => {
    setPantryItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updatePantryItem = (itemId, updates) => {
    setPantryItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const completeQuiz = (answers, quizType) => {
    // Mark quiz as completed
    setQuizCompleted(true);
    setQuizData({ answers, quizType, completedAt: new Date().toISOString() });
  };

  const addQuizItemsToPantry = (items) => {
    // Add quiz items to pantry and mark quiz as completed
    addPantryItems(items);
    setQuizCompleted(true);
    setQuizData(prev => ({
      ...prev,
      completedAt: new Date().toISOString(),
      itemsAdded: items.length
    }));
  };

  const markQuizAsCompleted = (items) => {
    // Mark quiz as completed without clearing state
    setQuizCompleted(true);
    setQuizData(prev => ({
      ...prev,
      completedAt: new Date().toISOString(),
      itemsAdded: items.length
    }));
  };

  const clearQuizState = () => {
    // Clear quiz state when needed (e.g., when retaking quiz)
    setQuizCompleted(false);
    setQuizData(null);
  };

  const clearAllQuizState = () => {
    // Clear all quiz-related state
    setQuizCompleted(false);
    setQuizData(null);
  };

  const clearQuizProgressOnly = () => {
    // Clear only the quiz progress, but keep completion status
    // This is useful when navigating away from quiz screens
    // but we want to preserve the fact that the quiz was completed
    setQuizData(prev => prev ? { ...prev, inProgress: false } : null);
  };

  // Initialize essentials on mount
  useEffect(() => {
    const initializeEssentials = async () => {
      try {
        const enabled = await PantryEssentialsManager.areEssentialsEnabled();
        setEssentialsEnabled(enabled);
        
        const stats = await PantryEssentialsManager.getEssentialsStats();
        setEssentialsStats(stats);
        
        console.log('📦 Pantry essentials initialized:', { enabled, stats });
      } catch (error) {
        console.error('Failed to initialize pantry essentials:', error);
      }
    };
    
    initializeEssentials();
  }, []);

  // Essentials management functions
  const toggleEssentials = async () => {
    try {
      if (essentialsEnabled) {
        await PantryEssentialsManager.disableEssentials();
        setEssentialsEnabled(false);
        console.log('✅ Pantry essentials disabled');
      } else {
        await PantryEssentialsManager.enableEssentials();
        setEssentialsEnabled(true);
        console.log('✅ Pantry essentials enabled');
      }
      
      // Update stats
      const stats = await PantryEssentialsManager.getEssentialsStats();
      setEssentialsStats(stats);
      
      // Force refresh of pantry items to trigger re-render
      setPantryItems(prev => [...prev]);
      
      console.log('🔄 Pantry items refreshed after essentials toggle');
      
      // Return success message for UI feedback
      return {
        success: true,
        message: essentialsEnabled 
          ? 'Pantry essentials hidden' 
          : 'Pantry essentials added! More recipes available.'
      };
      
    } catch (error) {
      console.error('Failed to toggle essentials:', error);
      return {
        success: false,
        message: 'Failed to update pantry essentials. Please try again.'
      };
    }
  };

  const getAllAvailableIngredients = async () => {
    try {
      return await PantryEssentialsManager.getAllAvailableIngredients(pantryItems);
    } catch (error) {
      console.error('Failed to get all available ingredients:', error);
      return pantryItems;
    }
  };

  const handleDuplicateDetection = async (newItem) => {
    try {
      return await PantryEssentialsManager.handleDuplicateDetection(newItem, pantryItems);
    } catch (error) {
      console.error('Failed to handle duplicate detection:', error);
      return { isDuplicate: false };
    }
  };

  const value = {
    pantryItems,
    addPantryItem,
    addPantryItems,
    removePantryItem,
    updatePantryItem,
    quizCompleted,
    quizData,
    completeQuiz,
    addQuizItemsToPantry,
    markQuizAsCompleted,
    clearQuizState,
    clearAllQuizState,
    clearQuizProgressOnly,
    // Essentials management
    essentialsEnabled,
    essentialsStats,
    toggleEssentials,
    getAllAvailableIngredients,
    handleDuplicateDetection,
  };

  return (
    <PantryContext.Provider value={value}>
      {children}
    </PantryContext.Provider>
  );
}; 