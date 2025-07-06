import React, { createContext, useContext, useState } from 'react';
import { convertAnswersToPantryItems } from './services/quizService';

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

  const addPantryItem = (item) => {
    const newItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
      addedAt: new Date().toISOString(),
    };
    setPantryItems(prev => [...prev, newItem]);
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
    // Convert quiz answers to pantry items
    const quizItems = convertAnswersToPantryItems(answers);
    
    // Add quiz items to pantry
    quizItems.forEach(item => {
      addPantryItem(item);
    });
    
    // Mark quiz as completed
    setQuizCompleted(true);
    setQuizData({ answers, quizType, completedAt: new Date().toISOString() });
  };

  const value = {
    pantryItems,
    addPantryItem,
    removePantryItem,
    updatePantryItem,
    quizCompleted,
    quizData,
    completeQuiz,
  };

  return (
    <PantryContext.Provider value={value}>
      {children}
    </PantryContext.Provider>
  );
}; 