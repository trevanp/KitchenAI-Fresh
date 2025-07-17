import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';
import { convertAnswersToPantryItems } from '../services/quizService';
import { usePantry } from '../PantryContext';

export default function QuizConfirmationScreen({ navigation, route }) {
  const { answers, quizType, source, returnTo, isRetake } = route.params;
  const { addQuizItemsToPantry, pantryItems, markQuizAsCompleted, clearQuizProgressOnly } = usePantry();
  
  // Debug navigation structure
  useEffect(() => {
    console.log('🔍 QuizConfirmationScreen - Navigation debug:');
    console.log('Navigation object:', navigation);
    console.log('Route params:', route?.params);
    console.log('Navigation state:', navigation?.getState?.());
  }, [navigation, route]);
  const [organizedItems, setOrganizedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const categories = [
    'Produce',
    'Protein',
    'Dairy',
    'Grains & Breads',
    'Canned & Jarred Goods',
    'Baking & Flours',
    'Spices & Seasonings',
    'Oils, Vinegars & Fats',
    'Condiments & Sauces',
    'Frozen',
    'Snacks & Treats',
    'Drinks & Beverages',
    'Other'
  ];

  useEffect(() => {
    organizeQuizResults();
  }, []);

  const organizeQuizResults = () => {
    const organized = {};
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (answer.selectedItems && answer.selectedItems.length > 0 && !answer.skipped) {
        const category = getCategoryFromQuestionId(questionId);
        if (!organized[category]) {
          organized[category] = [];
        }
        organized[category].push(...answer.selectedItems);
      }
    });
    
    setOrganizedItems(organized);
  };

  const getCategoryFromQuestionId = (questionId) => {
    const categoryMap = {
      rice: 'Grains & Breads',
      pasta: 'Grains & Breads',
      flour: 'Baking & Flours',
      beans: 'Protein',
      nuts: 'Protein',
      oil: 'Oils, Vinegars & Fats',
      spices: 'Spices & Seasonings',
      condiments: 'Condiments & Sauces'
    };
    return categoryMap[questionId] || 'Other';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Produce': '🥬',
      'Protein': '🥩',
      'Dairy': '🥛',
      'Grains & Breads': '🍞',
      'Canned & Jarred Goods': '🥫',
      'Baking & Flours': '🧁',
      'Spices & Seasonings': '🧂',
      'Oils, Vinegars & Fats': '🫒',
      'Condiments & Sauces': '🍯',
      'Frozen': '🧊',
      'Snacks & Treats': '🍿',
      'Drinks & Beverages': '🥤',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  const handleEditItem = (category, itemIndex, itemName) => {
    setEditingItem({ category, itemIndex, itemName });
    setEditName(itemName);
    setEditCategory(category);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Item name cannot be empty');
      return;
    }

    setOrganizedItems(prev => {
      const updated = { ...prev };
      const { category, itemIndex } = editingItem;
      
      // Remove from old category
      updated[category] = updated[category].filter((_, index) => index !== itemIndex);
      if (updated[category].length === 0) {
        delete updated[category];
      }
      
      // Add to new category
      if (!updated[editCategory]) {
        updated[editCategory] = [];
      }
      updated[editCategory].push(editName.trim());
      
      return updated;
    });

    setEditModalVisible(false);
    setEditingItem(null);
    setEditName('');
    setEditCategory('');
  };

  const handleRemoveItem = (category, itemIndex) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setOrganizedItems(prev => {
              const updated = { ...prev };
              updated[category] = updated[category].filter((_, index) => index !== itemIndex);
              if (updated[category].length === 0) {
                delete updated[category];
              }
              return updated;
            });
          }
        }
      ]
    );
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemCategory) {
      Alert.alert('Error', 'Please enter both item name and category');
      return;
    }

    setOrganizedItems(prev => {
      const updated = { ...prev };
      if (!updated[newItemCategory]) {
        updated[newItemCategory] = [];
      }
      updated[newItemCategory].push(newItemName.trim());
      return updated;
    });

    setAddItemModalVisible(false);
    setNewItemName('');
    setNewItemCategory('');
  };

  const handleAddToPantry = async () => {
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Organized items:', organizedItems);
    setLoading(true);
    setSubmissionStatus('Preparing items...');
    
    let pantrySuccess = false;
    let itemsAdded = 0;
    
    try {
      // STEP 1: Convert organized items to pantry format
      setSubmissionStatus('Converting items to pantry format...');
      console.log('Step 1: Converting items to pantry format...');
      const pantryItemsToAdd = [];
      
      Object.entries(organizedItems).forEach(([category, items]) => {
        items.forEach(itemName => {
          pantryItemsToAdd.push({
            name: itemName,
            category: category,
            quantity: '1',
            notes: `Added from pantry quiz`,
            daysUntilExpiration: null
          });
        });
      });
      console.log('✅ Converted', pantryItemsToAdd.length, 'items to pantry format');

      // STEP 2: Enhanced duplicate detection
      setSubmissionStatus('Checking for duplicates...');
      console.log('Step 2: Checking for duplicates...');
      const duplicates = [];
      const uniqueItems = [];
      
      pantryItemsToAdd.forEach(newItem => {
        const existing = pantryItems.find(item => 
          item.name.toLowerCase() === newItem.name.toLowerCase()
        );
        if (existing) {
          duplicates.push({ new: newItem, existing });
        } else {
          uniqueItems.push(newItem);
        }
      });
      console.log('✅ Found', uniqueItems.length, 'unique items and', duplicates.length, 'duplicates');

      // STEP 3: Handle duplicates and add items
      if (duplicates.length > 0) {
        // Handle duplicates with auto-merge for exact matches
        const exactMatches = duplicates.filter(d => 
          d.existing.name.toLowerCase() === d.new.name.toLowerCase()
        );
        
        if (exactMatches.length > 0) {
          // Auto-merge exact matches
          exactMatches.forEach(match => {
            const mergedQuantity = parseInt(match.existing.quantity || 1) + parseInt(match.new.quantity || 1);
            // Note: We need to update the existing item in the pantry context
            // This would require adding an update function to the context
          });
          
          const mergedCount = exactMatches.length;
          const newCount = uniqueItems.length;
          
          console.log('✅ Auto-merging', mergedCount, 'exact matches and adding', newCount, 'new items');
          addQuizItemsToPantry(uniqueItems);
          itemsAdded = uniqueItems.length;
          pantrySuccess = true;
          
        } else {
          // Show confirmation for potential duplicates
          const duplicateNames = duplicates.map(d => d.new.name).join(', ');
          Alert.alert(
            'Similar Items Found',
            `The following items may already exist in your pantry: ${duplicateNames}\n\nWould you like to add them anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Add Anyway',
                onPress: async () => {
                  console.log('✅ User chose to add duplicates');
                  setLoading(true);
                  setSubmissionStatus('Adding items to pantry...');
                  
                  try {
                    addQuizItemsToPantry(pantryItemsToAdd);
                    itemsAdded = pantryItemsToAdd.length;
                    pantrySuccess = true;
                    
                    setSubmissionStatus('Updating quiz status...');
                    markQuizAsCompleted(pantryItemsToAdd);
                    clearQuizProgressOnly();
                    
                    setSubmissionStatus('Redirecting to pantry...');
                    showSuccessMessage(itemsAdded);
                  } catch (error) {
                    console.error('❌ Failed to add duplicates:', error);
                    setLoading(false);
                    setSubmissionStatus(null);
                    Alert.alert('Error', 'Failed to add items to pantry. Please try again.');
                  }
                }
              }
            ]
          );
          setLoading(false);
          return; // Exit early, will continue in onPress callback
        }
      } else {
        console.log('✅ No duplicates found, adding all items');
        addQuizItemsToPantry(uniqueItems);
        itemsAdded = uniqueItems.length;
        pantrySuccess = true;
      }
      
      console.log('✅ Pantry items added successfully:', itemsAdded, 'items');
      setSubmissionStatus('Items added successfully!');
      
    } catch (error) {
      console.error('❌ Failed to add items to pantry:', error);
      setLoading(false);
      setSubmissionStatus(null);
      Alert.alert('Error', 'Failed to add items to pantry. Please try again.');
      return; // Don't continue if pantry addition failed
    }
    
    // STEP 4: Handle success (separate from API calls)
    if (pantrySuccess) {
      try {
        setSubmissionStatus('Updating quiz status...');
        console.log('Step 4: Marking quiz as completed...');
        // Only use pantryItemsToAdd as fallback, never reference uniqueItems here
        const itemsToMark = pantryItemsToAdd;
        markQuizAsCompleted(itemsToMark);
        clearQuizProgressOnly();
        console.log('✅ Quiz state updated successfully');
        setSubmissionStatus('Redirecting to pantry...');
        console.log('Step 5: Navigating to pantry...');
        showSuccessMessage(itemsAdded);
      } catch (cleanupError) {
        console.error('⚠️ Cleanup/navigation failed (but pantry succeeded):', cleanupError);
        setSubmissionStatus(null);
        Alert.alert(
          'Success!',
          `Added ${itemsAdded || 0} items to your pantry! Please check your pantry.`,
          [{ text: 'OK' }]
        );
      }
    }
    
    setLoading(false);
    setSubmissionStatus(null);
    console.log('=== QUIZ SUBMISSION COMPLETE ===');
  };

  const showSuccessMessage = (itemsAdded) => {
    const totalItems = itemsAdded || Object.values(organizedItems).reduce((sum, items) => sum + items.length, 0);
    
    console.log('🎯 Quiz completion - navigating to Pantry tab with', totalItems, 'items');
    
    // Mark quiz as completed and clear progress only (preserve completion status)
    console.log('✅ Marking quiz as completed with', totalItems, 'items');
    markQuizAsCompleted([]); // Pass empty array since items are already added
    clearQuizProgressOnly();
    console.log('🧹 Cleared quiz progress, preserved completion status');
    
    // Check if navigation is available
    if (!navigation) {
      console.error('❌ Navigation is undefined!');
      return;
    }
    
    try {
      // Navigate to the Pantry tab with success parameters
      console.log('🔄 Attempting navigation to Pantry with success parameters...');
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Pantry',
            params: {
              showSuccessMessage: true,
              message: `Added ${totalItems} items from quiz!`,
              highlightNewItems: true,
              newItemsCount: totalItems
            }
          }
        ]
      });
      console.log('✅ Successfully navigated to Pantry tab and closed quiz window');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Fallback: try to navigate to the Pantry tab without parameters
      console.log('🔄 Attempting fallback navigation to Pantry tab');
      try {
        navigation.navigate('Pantry');
        console.log('✅ Fallback navigation successful');
      } catch (fallbackError) {
        console.error('❌ Fallback navigation also failed:', fallbackError);
        // Final fallback: just go back
        try {
          navigation.goBack();
          console.log('✅ Go back navigation successful');
        } catch (finalError) {
          console.error('❌ All navigation attempts failed:', finalError);
          // Show alert as last resort
          Alert.alert(
            'Success!',
            `Added ${totalItems} items to your pantry! Please check your pantry tab.`,
            [{ text: 'OK' }]
          );
        }
      }
    }
  };

  const getTotalItems = () => {
    return Object.values(organizedItems).reduce((sum, items) => sum + items.length, 0);
  };

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Item</Text>
          
          <Text style={styles.modalLabel}>Item Name:</Text>
          <TextInput
            style={styles.modalInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter item name"
            placeholderTextColor={COLORS.textSecondary}
          />
          
          <Text style={styles.modalLabel}>Category:</Text>
          <ScrollView style={styles.categoryPicker} showsVerticalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  editCategory === category && styles.categoryOptionSelected
                ]}
                onPress={() => setEditCategory(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  editCategory === category && styles.categoryOptionTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalButtonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddItemModal = () => (
    <Modal
      visible={addItemModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setAddItemModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Item</Text>
          
          <Text style={styles.modalLabel}>Item Name:</Text>
          <TextInput
            style={styles.modalInput}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Enter item name"
            placeholderTextColor={COLORS.textSecondary}
          />
          
          <Text style={styles.modalLabel}>Category:</Text>
          <ScrollView style={styles.categoryPicker} showsVerticalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  newItemCategory === category && styles.categoryOptionSelected
                ]}
                onPress={() => setNewItemCategory(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  newItemCategory === category && styles.categoryOptionTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setAddItemModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={handleAddItem}
            >
              <Text style={styles.modalButtonTextPrimary}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressCircle}>
            <Ionicons name="checkmark" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.progressTitle}>Quiz Complete!</Text>
          <Text style={styles.progressSubtitle}>
            Review your pantry items before adding them
          </Text>
        </View>

        {/* Items by Category */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Your Pantry Items</Text>
          
          {Object.keys(organizedItems).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No items selected</Text>
              <Text style={styles.emptyStateSubtext}>
                Go back and select some items, or add them manually below
              </Text>
            </View>
          ) : (
            Object.entries(organizedItems).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>({items.length} items)</Text>
                </View>
                
                {items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditItem(category, index, item)}
                      >
                        <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => handleRemoveItem(category, index)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Add Item Button */}
        <TouchableOpacity
          style={styles.addItemButton}
          onPress={() => setAddItemModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addItemButtonText}>Add More Items</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submission Status */}
      {submissionStatus && (
        <View style={styles.submissionStatus}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.submissionStatusText}>{submissionStatus}</Text>
        </View>
      )}

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            // Clear quiz progress only (preserve completion status if quiz was completed)
            clearQuizProgressOnly();
            
            // Navigate back
            navigation.goBack();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addToPantryButton, getTotalItems() === 0 && styles.addToPantryButtonDisabled]}
          onPress={handleAddToPantry}
          disabled={getTotalItems() === 0 || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.addToPantryButtonText}>
                {submissionStatus || 'Adding Items...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.addToPantryButtonText}>
                Add {getTotalItems()} Items to Pantry
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderEditModal()}
      {renderAddItemModal()}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  itemsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  categorySection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: '#EF4444',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  submissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  submissionStatusText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addToPantryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  addToPantryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addToPantryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPicker: {
    maxHeight: 200,
    marginBottom: 20,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  categoryOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
}); 