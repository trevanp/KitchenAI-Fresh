import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { usePantry } from '../PantryContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { extractTextFromImage } from '../ocrService';
import {
  Header,
  SearchBar,
  Button,
  Card,
  EmptyState,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';

// Simple food categories with icons
const FOOD_CATEGORIES = {
  'Produce': { icon: '🥬', color: '#22C55E' },
  'Dairy': { icon: '🥛', color: '#3B82F6' },
  'Meat & Seafood': { icon: '🥩', color: '#EF4444' },
  'Pantry Staples': { icon: '🌾', color: '#F59E0B' },
  'Snacks': { icon: '🍪', color: '#8B5CF6' },
  'Beverages': { icon: '🥤', color: '#06B6D4' },
  'Other': { icon: '📦', color: '#6B7280' },
};

export default function PantryScreen({ navigation }) {
  const { pantryItems, addPantryItem, removePantryItem, quizCompleted } = usePantry();
  const [search, setSearch] = useState('');
  const [currentModal, setCurrentModal] = useState(null); // 'add', 'manual', 'receipt', 'receiptResults'
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  // Receipt OCR state
  const [selectedImage, setSelectedImage] = useState(null);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [imageError, setImageError] = useState(null);

  // Filter items based on search
  const filteredItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetStates = () => {
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemCategory('Other');
    setSelectedImage(null);
    setReceiptItems([]);
    setImageError(null);
    setReceiptProcessing(false);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity.trim() || '1',
      addedAt: new Date().toISOString(),
    };

    addPantryItem(newItem);
    resetStates();
    setCurrentModal(null);
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from your pantry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removePantryItem(itemId) },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setCurrentModal('receipt');
      }
    } catch (error) {
      setImageError('Failed to take photo. Please try again.');
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setCurrentModal('receipt');
      }
    } catch (error) {
      setImageError('Failed to select image. Please try again.');
    }
  };

  const processReceipt = async () => {
    if (!selectedImage) return;

    try {
      setReceiptProcessing(true);
      setImageError(null);

      const ocrResult = await extractTextFromImage(selectedImage);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.message || 'Failed to process receipt');
      }

      const items = ocrResult.items.map((item, index) => ({
        id: `receipt_${Date.now()}_${index}`,
        name: item.name,
        category: item.category,
        quantity: item.quantity || '1',
        checked: true,
      }));

      setReceiptItems(items);
      setCurrentModal('receiptResults');
    } catch (error) {
      setImageError(error.message || 'Failed to process receipt');
    } finally {
      setReceiptProcessing(false);
    }
  };

  const addReceiptItems = () => {
    const checkedItems = receiptItems.filter(item => item.checked && item.name.trim());
    
    if (checkedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to your pantry.');
      return;
    }

    checkedItems.forEach(item => {
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: item.name.trim(),
        category: item.category,
        quantity: item.quantity || '1',
        addedAt: new Date().toISOString(),
        notes: 'Added from receipt scan',
      };
      addPantryItem(newItem);
    });

    Alert.alert('Success', `Added ${checkedItems.length} items to your pantry!`);
    resetStates();
    setCurrentModal(null);
  };

  const toggleReceiptItem = (itemId) => {
    setReceiptItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleTakePantryQuiz = () => {
    setCurrentModal(null);
    
    if (quizCompleted) {
      Alert.alert(
        'Retake Pantry Quiz?',
        'You\'ve already completed the pantry quiz. Taking it again will add new items to your existing pantry.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retake Quiz',
            style: 'default',
            onPress: () => navigation.navigate('PantryQuiz', { 
              source: 'pantry_retake',
              isRetake: true
            })
          }
        ]
      );
    } else {
      navigation.navigate('PantryQuiz', { 
        source: 'pantry'
      });
    }
  };

  const renderPantryItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.categoryIcon}>
            {FOOD_CATEGORIES[item.category]?.icon || '📦'}
          </Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          {item.quantity && (
            <Text style={styles.itemQuantity}>{item.quantity}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Pantry" />
      
      <View style={styles.content}>
        <SearchBar
          placeholder="Search your pantry..."
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pantryItems.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setCurrentModal('add')}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Items</Text>
          </TouchableOpacity>
        </View>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title={search ? 'No items found' : 'Your pantry is empty'}
            subtitle={search ? 'Try a different search term' : 'Add your first item to get started!'}
          />
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderPantryItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Add Method Selection Modal */}
      <Modal visible={currentModal === 'add'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Items to Pantry</Text>
            
            <TouchableOpacity 
              style={styles.addMethodButton}
              onPress={() => setCurrentModal('manual')}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addMethodText}>Add Manually</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.addMethodButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addMethodText}>Take Receipt Photo</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.addMethodButton}
              onPress={handleSelectFromLibrary}
            >
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addMethodText}>Choose from Photos</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.addMethodButton}
              onPress={handleTakePantryQuiz}
            >
              <Ionicons name="clipboard-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addMethodText}>Take Pantry Quiz</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Button
              title="Cancel"
              onPress={() => {
                resetStates();
                setCurrentModal(null);
              }}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>

      {/* Manual Add Item Modal */}
      <Modal visible={currentModal === 'manual'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {Object.keys(FOOD_CATEGORIES).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newItemCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setNewItemCategory(category)}
                >
                  <Text style={styles.categoryIcon}>{FOOD_CATEGORIES[category].icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    newItemCategory === category && styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.textInput}
              placeholder="Quantity (optional)"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  resetStates();
                  setCurrentModal(null);
                }}
                style={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title="Add Item"
                onPress={handleAddItem}
                style={[styles.modalButton, styles.addModalButton]}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Processing Modal */}
      <Modal visible={currentModal === 'receipt'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Process Receipt</Text>
            
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.receiptImage} />
              </View>
            )}

            {imageError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                <Text style={styles.errorText}>{imageError}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  resetStates();
                  setCurrentModal(null);
                }}
                style={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title={receiptProcessing ? "Processing..." : "Process Receipt"}
                onPress={processReceipt}
                disabled={receiptProcessing}
                style={[styles.modalButton, styles.processButton]}
              />
            </View>

            {receiptProcessing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Scanning receipt...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Receipt Results Modal */}
      <Modal visible={currentModal === 'receiptResults'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Found {receiptItems.length} Items</Text>
            
            <FlatList
              data={receiptItems}
              keyExtractor={item => item.id}
              style={styles.receiptItemsList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.receiptItem}
                  onPress={() => toggleReceiptItem(item.id)}
                >
                  <Ionicons 
                    name={item.checked ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={item.checked ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <View style={styles.receiptItemInfo}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.receiptItemQuantity}>{item.quantity}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  resetStates();
                  setCurrentModal(null);
                }}
                style={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title={`Add ${receiptItems.filter(item => item.checked).length} Items`}
                onPress={addReceiptItems}
                style={[styles.modalButton, styles.addModalButton]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  statCard: {
    backgroundColor: 'white',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  itemCard: {
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addMethodText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginLeft: SPACING.md,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryScroll: {
    marginBottom: SPACING.md,
  },
  categoryButton: {
    alignItems: 'center',
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  addModalButton: {
    marginLeft: SPACING.sm,
  },
  processButton: {
    backgroundColor: COLORS.success,
    marginLeft: SPACING.sm,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  receiptImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    resizeMode: 'cover',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
  },
  receiptItemsList: {
    maxHeight: 300,
    marginVertical: SPACING.md,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptItemInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  receiptItemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  receiptItemCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  receiptItemQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
}); 