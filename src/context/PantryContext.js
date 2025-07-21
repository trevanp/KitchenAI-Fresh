import React, { createContext, useContext, useState } from 'react';

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

  const addPantryItem = (item) => {
    const newItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString(),
    };
    setPantryItems(prev => [...prev, newItem]);
  };

  const addPantryItems = (items) => {
    const newItems = items.map(item => ({
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  const markQuizAsCompleted = () => {
    setQuizCompleted(true);
  };

  const clearQuizState = () => {
    setQuizCompleted(false);
  };

  const value = {
    pantryItems,
    addPantryItem,
    addPantryItems,
    removePantryItem,
    updatePantryItem,
    quizCompleted,
    markQuizAsCompleted,
    clearQuizState,
  };

  return (
    <PantryContext.Provider value={value}>
      {children}
    </PantryContext.Provider>
  );
}; 