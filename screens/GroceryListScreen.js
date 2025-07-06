import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeOutRight,
  Layout 
} from 'react-native-reanimated';

export default function GroceryListScreen({ onClose }) {
  const [newItem, setNewItem] = useState('');
  const [groceryItems, setGroceryItems] = useState([]);

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
      </View>

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
}); 