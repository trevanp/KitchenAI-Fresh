import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeOutRight,
  Layout 
} from 'react-native-reanimated';
import openaiService from '../services/openaiService';
import { usePantry } from '../PantryContext';

export default function GroceryListScreen({ onClose }) {
  const [newItem, setNewItem] = useState('');
  const [groceryItems, setGroceryItems] = useState([]);
  
  // AI-powered features
  const [smartList, setSmartList] = useState(null);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Get pantry context
  const { getAllAvailableIngredients } = usePantry();

  const addItem = () => {
    if (newItem.trim()) {
      const item = {
        id: Date.now(),
        name: newItem.trim(),
        category: 'Other',
        checked: false
      };
      setGroceryItems([item, ...groceryItems]);
      setNewItem('');
    }
  };

  const toggleItem = (id) => {
    setGroceryItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeCheckedItems = () => {
    setGroceryItems(items => items.filter(item => !item.checked));
  };

  // AI-powered smart shopping list generation
  const generateSmartList = async () => {
    if (!aiEnabled) return;
    
    setIsGeneratingList(true);
    try {
      const pantryItems = await getAllAvailableIngredients();
      
      // For demo purposes, we'll use some sample recipes
      // In a real app, you'd get selected recipes from user's meal plan
      const sampleRecipes = [
        { name: 'Chicken Stir Fry' },
        { name: 'Pasta Carbonara' },
        { name: 'Greek Salad' }
      ];
      
      const smartShoppingList = await openaiService.generateShoppingList(pantryItems, sampleRecipes);
      setSmartList(smartShoppingList);
      
      console.log('🤖 Smart shopping list generated:', smartShoppingList);
    } catch (error) {
      console.log('🤖 Smart list generation failed:', error.message);
      setAiEnabled(false);
      Alert.alert(
        'AI Feature Unavailable',
        'Smart shopping list generation is currently unavailable. You can still add items manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingList(false);
    }
  };

  // Add AI-suggested items to grocery list
  const addSmartItem = (item) => {
    const newGroceryItem = {
      id: Date.now() + Math.random(),
      name: item.item,
      category: 'AI Suggested',
      checked: false,
      quantity: item.quantity,
      priority: item.priority,
      reason: item.reason
    };
    setGroceryItems(prev => [newGroceryItem, ...prev]);
  };

  const checkedCount = groceryItems.filter(item => item.checked).length;
  const totalCount = groceryItems.length;

  const groupedItems = groceryItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Grocery List</Text>
          <Text style={styles.subtitle}>
            {checkedCount} of {totalCount} items completed
          </Text>
        </View>
      </View>

      {/* Add Item Section */}
      <View style={styles.addSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add new item..."
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={addItem}
            disabled={!newItem.trim()}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={newItem.trim() ? "#fff" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* AI Smart List Button */}
        <TouchableOpacity 
          style={styles.smartListButton}
          onPress={generateSmartList}
          disabled={isGeneratingList || !aiEnabled}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={isGeneratingList ? "#9CA3AF" : "#fff"} 
          />
          <Text style={styles.smartListButtonText}>
            {isGeneratingList ? 'Generating...' : 'Generate Smart List'}
          </Text>
          {isGeneratingList && (
            <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* AI Smart List Section */}
      {smartList && smartList.shopping_list && smartList.shopping_list.length > 0 && (
        <Animated.View 
          style={styles.smartListSection}
          entering={FadeInDown.duration(300)}
        >
          <View style={styles.smartListHeader}>
            <Ionicons name="star" size={20} color="#10B981" />
            <Text style={styles.smartListTitle}>AI Smart Suggestions</Text>
            {smartList.estimated_cost && (
              <Text style={styles.estimatedCost}>Est. {smartList.estimated_cost}</Text>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.smartListScroll}
          >
            {smartList.shopping_list.map((item, index) => (
              <View key={index} style={styles.smartItemCard}>
                <View style={styles.smartItemHeader}>
                  <Text style={styles.smartItemName}>{item.item}</Text>
                  <View style={[
                    styles.priorityBadge,
                    item.priority === 'high' && styles.priorityHigh
                  ]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                </View>
                <Text style={styles.smartItemQuantity}>{item.quantity}</Text>
                <Text style={styles.smartItemReason}>{item.reason}</Text>
                <TouchableOpacity 
                  style={styles.addSmartItemButton}
                  onPress={() => addSmartItem(item)}
                >
                  <Ionicons name="add-circle" size={20} color="#10B981" />
                  <Text style={styles.addSmartItemText}>Add to List</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }
            ]}
            layout={Layout.springify()}
          />
        </View>
        <Text style={styles.progressText}>
          {totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}% complete
        </Text>
      </View>

      {/* Items List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {groceryItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="list-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>Your grocery list is empty</Text>
            <Text style={styles.emptyStateText}>
              Add items to your grocery list to keep track of what you need to buy!
            </Text>
          </View>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Animated.View 
              key={category} 
              style={styles.categorySection}
              entering={FadeInDown.duration(300)}
            >
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.categoryItems}>
                {items.map((item) => (
                  <Animated.View
                    key={item.id}
                    style={styles.itemContainer}
                    layout={Layout.springify()}
                    exiting={FadeOutRight.duration(200)}
                  >
                    <TouchableOpacity 
                      style={styles.item}
                      onPress={() => toggleItem(item.id)}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[
                          styles.checkbox, 
                          item.checked && styles.checkboxChecked
                        ]}>
                          {item.checked && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Text style={[
                          styles.itemText,
                          item.checked && styles.itemTextChecked
                        ]}>
                          {item.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {checkedCount > 0 && (
        <Animated.View 
          style={styles.bottomActions}
          entering={FadeInDown.duration(300)}
        >
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removeCheckedItems}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.removeButtonText}>
              Remove {checkedCount} completed item{checkedCount > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    marginVertical: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  categoryItems: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  itemTextChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // AI Smart List Styles
  smartListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  smartListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  smartListSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  smartListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  smartListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  estimatedCost: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  smartListScroll: {
    paddingRight: 20,
  },
  smartItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityHigh: {
    backgroundColor: '#EF4444',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  smartItemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  smartItemReason: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 16,
  },
  addSmartItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  addSmartItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
}); 