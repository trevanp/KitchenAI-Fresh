import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { usePantry } from '../PantryContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractTextFromImage, getOcrStatus, testApiKey } from '../ocrService';
import { GOOGLE_VISION_API_KEY } from '@env';
import {
  Header,
  SearchBar,
  FilterButton,
  FilterRow,
  Button,
  Card,
  LoadingState,
  EmptyState,
  Badge,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';
import { processReceiptImage } from '../ocrService';
import GroceryListScreen from './GroceryListScreen';

// No dummy data - only user-added items will appear here
const sampleItems = [];

// Food group configuration with icons and colors
const FOOD_GROUPS = {
  'Produce': { icon: '🥕', color: '#22C55E', backgroundColor: '#F0FDF4' },
  'Proteins': { icon: '🥩', color: '#F87171', backgroundColor: '#FEF2F2' },
  'Dairy & Eggs': { icon: '🥛', color: '#60A5FA', backgroundColor: '#EFF6FF' },
  'Grains & Starches': { icon: '🌾', color: '#8B5CF6', backgroundColor: '#F5F3FF' },
  'Pantry Staples': { icon: '🥫', color: '#F59E0B', backgroundColor: '#FFFBEB' },
  'Condiments & Seasonings': { icon: '🧄', color: '#EC4899', backgroundColor: '#FDF2F8' },
};

// Mock receipt scan results
const mockReceiptItems = [
  { id: 'r1', name: 'Whole Milk', category: 'Dairy & Eggs', quantity: '1 gallon', checked: true },
  { id: 'r2', name: 'Bread', category: 'Grains & Starches', quantity: '1 loaf', checked: true },
  { id: 'r3', name: 'Bananas', category: 'Produce', quantity: '1 bunch', checked: true },
  { id: 'r4', name: 'Eggs', category: 'Dairy & Eggs', quantity: '1 dozen', checked: true },
  { id: 'r5', name: 'Chicken Breast', category: 'Proteins', quantity: '2 lbs', checked: true },
];

// Mock barcode product data
const mockBarcodeProduct = {
  name: 'Whole Milk',
  category: 'Dairy & Eggs',
  image: null, // Would be product image URL
  defaultQuantity: '1 gallon'
};

const categories = [
  'All',
  'Produce',
  'Proteins',
  'Dairy & Eggs',
  'Grains & Starches',
  'Pantry Staples',
  'Condiments & Seasonings',
  'Other'
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function getExpirationColor(days) {
  if (days === null) return '#6B7280'; // gray for no expiration
  if (days <= 3) return '#EF4444'; // red for urgent
  if (days <= 7) return '#F59E0B'; // yellow/orange for warning
  return '#10B981'; // green for good
}

function getExpirationStatus(days) {
  if (days === null) return 'No Expiration';
  if (days <= 3) return 'Expires Soon';
  if (days <= 7) return 'Use Soon';
  return 'Fresh';
}

export default function PantryScreen() {
  const { pantryItems, addPantryItem, removePantryItem, updatePantryItem } = usePantry();
  const items = pantryItems; // Use pantry items from context
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showStats, setShowStats] = useState(true);
  
  // Unified modal state management
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [optimizedImage, setOptimizedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageOptimizing, setImageOptimizing] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [barcodeProcessing, setBarcodeProcessing] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Full-screen image viewer state
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const [fullScreenImageUri, setFullScreenImageUri] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Produce',
    quantity: '',
    expirationDate: '',
    notes: ''
  });

  const [groceryListVisible, setGroceryListVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);

  // Calculate pantry statistics
  const calculateStats = () => {
    const urgentItems = items.filter(item => item.daysUntilExpiration !== null && item.daysUntilExpiration <= 3);
    const freshItems = items.filter(item => item.daysUntilExpiration === null || item.daysUntilExpiration > 7);
    const lowQuantityItems = items.filter(item => {
      const qty = parseInt(item.quantity);
      return !isNaN(qty) && qty <= 2;
    });

    return {
      urgent: urgentItems.length,
      fresh: freshItems.length,
      lowQuantity: lowQuantityItems.length
    };
  };

  const stats = calculateStats();

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Sort items within each category by expiration urgency
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => {
      if (a.daysUntilExpiration === null && b.daysUntilExpiration === null) return 0;
      if (a.daysUntilExpiration === null) return 1;
      if (b.daysUntilExpiration === null) return -1;
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });
  });

  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Produce',
      quantity: '',
      expirationDate: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const closeAllModals = () => {
    setCurrentModal(null);
    setSelectedImage(null);
    setOptimizedImage(null);
    setImageLoading(false);
    setImageOptimizing(false);
    setImageError(null);
    setReceiptProcessing(false);
    setReceiptItems([]);
    setBarcodeProcessing(false);
    setBarcodeProduct(null);
    setBarcodeQuantity('');
    setFullScreenImageVisible(false);
    setFullScreenImageUri(null);
    resetForm();
  };

  const openSmartInputModal = () => {
    console.log('Opening smart input modal');
    setAddItemModalVisible(true);
  };

  const handleScanReceipt = () => {
    setAddItemModalVisible(false);
    setCurrentModal('receiptScan');
    // Reset any previous state
    setSelectedImage(null);
    setOptimizedImage(null);
    setImageError(null);
    setReceiptItems([]);
  };

  const handleScanBarcode = () => {
    setAddItemModalVisible(false);
    setCurrentModal('barcodeScan');
    // Reset any previous state
    setBarcodeProduct(null);
    setBarcodeQuantity('');
  };

  const handleEnterManually = () => {
    setAddItemModalVisible(false);
    setManualEntryVisible(true);
    resetForm();
  };

  const suggestCategory = (itemName) => {
    const name = itemName.toLowerCase();
    
    // Produce
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('tomato') || name.includes('lettuce') || name.includes('carrot') ||
        name.includes('onion') || name.includes('garlic') || name.includes('potato') ||
        name.includes('broccoli') || name.includes('spinach') || name.includes('cucumber')) {
      return 'Produce';
    }
    
    // Proteins
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('salmon') || name.includes('tofu') ||
        name.includes('egg') || name.includes('turkey') || name.includes('lamb')) {
      return 'Proteins';
    }
    
    // Dairy & Eggs
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
        name.includes('butter') || name.includes('cream') || name.includes('egg')) {
      return 'Dairy & Eggs';
    }
    
    // Grains & Starches
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
        name.includes('flour') || name.includes('oat') || name.includes('quinoa')) {
      return 'Grains & Starches';
    }
    
    // Pantry Staples
    if (name.includes('oil') || name.includes('sugar') || name.includes('salt') ||
        name.includes('can') || name.includes('bean') || name.includes('sauce')) {
      return 'Pantry Staples';
    }
    
    // Condiments & Seasonings
    if (name.includes('spice') || name.includes('herb') || name.includes('vinegar') ||
        name.includes('mustard') || name.includes('ketchup') || name.includes('mayo')) {
      return 'Condiments & Seasonings';
    }
    
    return 'Produce'; // Default
  };

  const handleItemNameChange = (text) => {
    setFormData(prev => ({
      ...prev,
      name: text
    }));
    
    // Auto-suggest category if name is long enough
    if (text.length > 2) {
      const suggestedCategory = suggestCategory(text);
      setFormData(prev => ({
        ...prev,
        category: suggestedCategory
      }));
    }
  };

  const setQuickExpiration = (days) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    setFormData(prev => ({
      ...prev,
      expirationDate: expirationDate.toISOString().split('T')[0]
    }));
  };

  const handleSaveManualItem = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const newItem = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: formData.quantity.trim(),
      expirationDate: formData.expirationDate || null,
      notes: formData.notes.trim(),
      daysUntilExpiration: formData.expirationDate ? 
        Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    addPantryItem(newItem);
    setManualEntryVisible(false);
    resetForm();
    Alert.alert('Success', `${newItem.name} added to pantry!`);
  };

  const openManualForm = () => {
    console.log('Opening manual form');
    closeAllModals();
    resetForm();
    setCurrentModal('manualForm');
  };

  const openReceiptOptions = () => {
    console.log('Opening receipt options');
    setCurrentModal('receiptOptions');
  };

  const openBarcodeScan = () => {
    console.log('Opening barcode scan');
    closeAllModals();
    setCurrentModal('barcodeScan');
  };

  // Unified image selection function
  const selectImage = async (source) => {
    try {
      console.log('Selecting image from:', source);
      setImageLoading(true);
      setImageError(null);

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        setSelectedImage(imageUri);
        setCurrentModal('receiptScan');
      }
    } catch (error) {
      console.error('Image selection error:', error);
      setImageError('Failed to select image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const takeReceiptPhoto = () => selectImage('camera');
  const pickImageFromLibrary = () => selectImage('library');

  const processReceipt = async () => {
    try {
      console.log('🔍 RECEIPT DEBUG - Starting receipt processing...');
      setReceiptProcessing(true);
      setImageError(null);

      const imageToProcess = optimizedImage || selectedImage;
      if (!imageToProcess) {
        throw new Error('No image to process');
      }

      console.log('📸 RECEIPT DEBUG - Processing image:', imageToProcess);
      console.log('🔄 RECEIPT DEBUG - Image source:', {
        hasOptimizedImage: !!optimizedImage,
        hasSelectedImage: !!selectedImage,
        usingOptimized: !!optimizedImage
      });

      // Test API key first
      console.log('🧪 RECEIPT DEBUG - Testing API key before processing...');
      const apiTest = await testApiKey();
      console.log('🔑 RECEIPT DEBUG - API test result:', apiTest);

      // Use real Google Vision API OCR
      console.log('🌐 RECEIPT DEBUG - Calling extractTextFromImage...');
      const ocrResult = await extractTextFromImage(imageToProcess);
      
      console.log('📡 RECEIPT DEBUG - OCR result received:', {
        success: ocrResult.success,
        message: ocrResult.message,
        itemsCount: ocrResult.items ? ocrResult.items.length : 0,
        hasDebugInfo: !!ocrResult.debugInfo,
        debugInfo: ocrResult.debugInfo
      });
      
      // Store debug information
      setDebugInfo({
        apiTest: apiTest,
        ocrResult: ocrResult,
        timestamp: new Date().toISOString(),
        imageUri: imageToProcess
      });
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.message || 'Failed to extract text from receipt');
      }

      console.log('✅ RECEIPT DEBUG - OCR successful, extracted items:', ocrResult.items);

      // Convert OCR items to receipt items format with enhanced structure
      const receiptItems = ocrResult.items.map((item, index) => ({
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        name: item.name,
        category: item.category,
        quantity: item.quantity || '1',
        checked: true,
        confidence: item.confidence || 0.8,
        isEditing: false,
        isManual: false
      }));

      console.log('📋 RECEIPT DEBUG - Processed receipt items:', receiptItems);

      if (receiptItems.length === 0) {
        setImageError('No grocery items found in the receipt. Please try a clearer image or add items manually.');
        return;
      }

      setReceiptItems(receiptItems);
      setCurrentModal('results');
      
    } catch (error) {
      console.error('💥 RECEIPT DEBUG - Receipt processing error:', error);
      console.error('💥 RECEIPT DEBUG - Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setImageError(error.message || 'Failed to process receipt. Please try again.');
    } finally {
      setReceiptProcessing(false);
    }
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setOptimizedImage(null);
    setCurrentModal('receiptScan');
  };

  const scanBarcode = () => {
    // Mock barcode scanning
    setBarcodeProduct(mockBarcodeProduct);
    setBarcodeQuantity(mockBarcodeProduct.defaultQuantity);
    setCurrentModal('barcodeResults');
  };

  const addBarcodeItem = () => {
    if (barcodeProduct && barcodeQuantity) {
      const newItem = {
        name: barcodeProduct.name,
        category: barcodeProduct.category,
        quantity: barcodeQuantity,
        expirationDate: null,
        notes: '',
        daysUntilExpiration: null
      };
      addPantryItem(newItem);
      closeAllModals();
    }
  };

  const addReceiptItems = () => {
    const checkedItems = receiptItems.filter(item => item.checked && item.name.trim());
    
    if (checkedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item with a valid name to add to your pantry.');
      return;
    }

    // Validate items before adding
    const invalidItems = checkedItems.filter(item => !item.name.trim());
    if (invalidItems.length > 0) {
      Alert.alert('Invalid Items', 'Some items have empty names. Please edit or remove them before adding to pantry.');
      return;
    }

    // Add items with smart expiration dates
    let addedCount = 0;
    checkedItems.forEach(item => {
      if (item.name.trim()) {
        const expirationDate = getSmartExpirationDate(item.category);
        const daysUntilExpiration = expirationDate ? 
          Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

        const newItem = {
          name: item.name.trim(),
          category: item.category,
          quantity: item.quantity || '1',
          expirationDate: expirationDate,
          notes: item.isManual ? 'Added manually from receipt scan' : 'Added from receipt scan',
          daysUntilExpiration: daysUntilExpiration
        };
        addPantryItem(newItem);
        addedCount++;
      }
    });

    // Show success message
    Alert.alert(
      'Items Added Successfully!',
      `Added ${addedCount} item${addedCount > 1 ? 's' : ''} to your pantry from the receipt scan.`,
      [
        {
          text: 'OK',
          onPress: () => {
            closeAllModals();
            // Navigate to Explore to see new recipes
            // This will trigger the pantry-explore connection
          }
        }
      ]
    );
  };

  // Smart expiration date assignment based on food category
  const getSmartExpirationDate = (category) => {
    const today = new Date();
    
    switch (category) {
      case 'Produce':
        return new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 7 days
      case 'Dairy & Eggs':
        return new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 14 days
      case 'Proteins':
        return new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 5 days
      case 'Pantry Staples':
        return new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 90 days
      case 'Beverages':
        return new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days
      case 'Snacks':
        return new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 60 days
      case 'Frozen':
        return new Date(today.getTime() + (180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 180 days
      default:
        return new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days
    }
  };

  const toggleReceiptItem = (itemId) => {
    setReceiptItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const editReceiptItem = (item) => {
    // Set the form data to edit the receipt item
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expirationDate: '',
      notes: ''
    });
    setEditingItem(item);
    setCurrentModal('manualForm');
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expirationDate: item.expirationDate || '',
      notes: item.notes || ''
    });
    setCurrentModal('manualForm');
  };

  const saveItem = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const updatedItem = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: formData.quantity.trim(),
      expirationDate: formData.expirationDate || null,
      notes: formData.notes.trim(),
      daysUntilExpiration: formData.expirationDate ? 
        Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    if (editingItem) {
      updatePantryItem(editingItem.id, updatedItem);
    } else {
      addPantryItem(updatedItem);
    }

    closeAllModals();
  };

  const deleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removePantryItem(itemId)
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const daysUntilExpiration = item.daysUntilExpiration;
    const expirationColor = getExpirationColor(daysUntilExpiration);
    const expirationStatus = getExpirationStatus(daysUntilExpiration);
    const isUrgent = daysUntilExpiration !== null && daysUntilExpiration <= 2;
    const foodGroup = FOOD_GROUPS[item.category] || { icon: '📦', color: '#6B7280', backgroundColor: '#F9FAFB' };

    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.itemIcon, { backgroundColor: foodGroup.backgroundColor }]}>
            <Text style={styles.itemIconText}>{foodGroup.icon}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          {isUrgent && (
            <Text style={styles.urgentWarning}>⚠️</Text>
          )}
          <View style={[styles.expBadge, { backgroundColor: expirationColor }]}>
            <Text style={styles.expBadgeText}>{expirationStatus}</Text>
          </View>
          {item.expirationDate && (
            <Text style={styles.expDateText}>
              {new Date(item.expirationDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (category) => {
    const items = groupedItems[category] || [];
    const isExpanded = expandedSections[category] !== false; // Default to expanded
    const foodGroup = FOOD_GROUPS[category] || { icon: '📦', color: '#6B7280', backgroundColor: '#F9FAFB' };

    if (items.length === 0) {
      return (
        <View key={category} style={styles.categorySection}>
                  <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleSection(category)}
        >
            <View style={styles.categoryHeaderContent}>
              <Text style={styles.categoryIcon}>{foodGroup.icon}</Text>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>0 items</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={foodGroup.color} 
            />
          </TouchableOpacity>
          {isExpanded && (
            <View style={styles.emptyCategory}>
              <Text style={styles.emptyCategoryText}>
                No {category.toLowerCase()} yet - scan your next grocery receipt!
              </Text>
              <TouchableOpacity style={styles.quickAddButton} onPress={openSmartInputModal}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.quickAddText}>Quick Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleSection(category)}
        >
          <View style={styles.categoryHeaderContent}>
            <Text style={styles.categoryIcon}>{foodGroup.icon}</Text>
            <Text style={styles.categoryTitle}>{category}</Text>
            <Text style={styles.categoryCount}>{items.length} items</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={foodGroup.color} 
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.categoryItems}>
            {items.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.header}>My Pantry</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pantry items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>



        {/* Grocery List Button */}
        <TouchableOpacity 
          style={styles.groceryBtn}
          onPress={() => setGroceryListVisible(true)}
        >
          <Ionicons name="list" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.groceryBtnText}>Grocery List</Text>
        </TouchableOpacity>

        {/* Category Sections */}
        {Object.keys(groupedItems).length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="basket-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>Your pantry is empty</Text>
            <Text style={styles.emptyStateText}>
              Add items to your pantry to get recipe suggestions and track your ingredients!
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={openSmartInputModal}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyStateButtonText}>Add Your First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(groupedItems).map(category => renderCategorySection(category))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openSmartInputModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Grocery List Modal */}
      <Modal
        visible={groceryListVisible}
        animationType="slide"
        onRequestClose={() => setGroceryListVisible(false)}
      >
        <GroceryListScreen onClose={() => setGroceryListVisible(false)} />
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={addItemModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddItemModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pantry Items</Text>
              <TouchableOpacity 
                onPress={() => setAddItemModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.modalOptions}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleScanReceipt}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Scan Receipt</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleScanBarcode}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="scan-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Scan Barcode</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleEnterManually}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Enter Manually</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Manual Entry Form Modal */}
      <Modal
        visible={manualEntryVisible}
        animationType="slide"
        onRequestClose={() => setManualEntryVisible(false)}
      >
        <SafeAreaView style={styles.manualEntryContainer}>
          {/* Header */}
          <View style={styles.manualEntryHeader}>
            <TouchableOpacity 
              onPress={() => setManualEntryVisible(false)}
              style={styles.manualEntryBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.manualEntryTitle}>Add Item to Pantry</Text>
            <View style={styles.manualEntrySpacer} />
          </View>

          <ScrollView style={styles.manualEntryScroll} showsVerticalScrollIndicator={false}>
            {/* Item Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Item Details</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={handleItemNameChange}
                  placeholder="e.g., Chicken Breast, Apples, Milk"
                  autoCapitalize="words"
                  autoFocus={true}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                  placeholder="e.g., 2 lbs, 1 dozen, 500g"
                  keyboardType="default"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryPickerContainer}>
                  {Object.keys(FOOD_GROUPS).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category && styles.categoryOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <Text style={styles.categoryIcon}>{FOOD_GROUPS[category].icon}</Text>
                      <Text style={[
                        styles.categoryOptionText,
                        formData.category === category && styles.categoryOptionTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Expiration Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Expiration</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.expirationDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, expirationDate: text }))}
                  placeholder="YYYY-MM-DD (optional)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.quickExpirationContainer}>
                <Text style={styles.quickExpirationLabel}>Quick Select:</Text>
                <View style={styles.quickExpirationButtons}>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(3)}
                  >
                    <Text style={styles.quickExpirationButtonText}>3 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(7)}
                  >
                    <Text style={styles.quickExpirationButtonText}>1 week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(30)}
                  >
                    <Text style={styles.quickExpirationButtonText}>1 month</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Optional Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Optional Details</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Brand, storage location, special instructions..."
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.manualEntryFooter}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveManualItem}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Add to Pantry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Enhanced OCR Results Confirmation Modal */}
      <Modal
        visible={currentModal === 'results'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.ocrResultsContainer}>
          {/* Header */}
          <View style={styles.ocrResultsHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.ocrResultsCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.ocrResultsTitleContainer}>
              <Text style={styles.ocrResultsTitle}>Review Receipt Items</Text>
              <Text style={styles.ocrResultsSubtitle}>Edit or remove items before adding to pantry</Text>
            </View>
            <View style={styles.ocrResultsSpacer} />
          </View>

          <ScrollView style={styles.ocrResultsScroll} showsVerticalScrollIndicator={false}>
            {/* Success Summary */}
            <View style={styles.ocrSuccessSummary}>
              <View style={styles.ocrSuccessIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text style={styles.ocrSuccessTitle}>Receipt Processed Successfully!</Text>
              <Text style={styles.ocrSuccessText}>
                Found {receiptItems.length} potential items. Review and edit as needed.
              </Text>
            </View>

            {/* Add Manual Item Button */}
            <TouchableOpacity 
              style={styles.addManualItemButton}
              onPress={() => {
                const newItem = {
                  id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: '',
                  category: 'Produce',
                  quantity: '1',
                  checked: true,
                  isEditing: true,
                  isManual: true
                };
                setReceiptItems(prev => [...prev, newItem]);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addManualItemButtonText}>Add Missing Item</Text>
            </TouchableOpacity>

            {/* Items List */}
            <View style={styles.ocrItemsContainer}>
              {receiptItems.map((item, index) => (
                <View key={item.id} style={styles.ocrItemCard}>
                  {/* Item Selection and Main Info */}
                  <View style={styles.ocrItemHeader}>
                    <TouchableOpacity 
                      style={styles.ocrItemCheckbox}
                      onPress={() => toggleReceiptItem(item.id)}
                    >
                      <Ionicons 
                        name={item.checked ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={item.checked ? COLORS.primary : COLORS.textSecondary} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.ocrItemMainInfo}>
                      {/* Editable Item Name */}
                      {item.isEditing ? (
                        <TextInput
                          style={styles.ocrItemNameInput}
                          value={item.name}
                          onChangeText={(text) => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, name: text } : i
                            ));
                          }}
                          placeholder="Enter item name"
                          placeholderTextColor={COLORS.textSecondary}
                          autoFocus={true}
                          onBlur={() => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, isEditing: false } : i
                            ));
                          }}
                        />
                      ) : (
                        <TouchableOpacity 
                          style={styles.ocrItemNameContainer}
                          onPress={() => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, isEditing: true } : i
                            ));
                          }}
                        >
                          <Text style={styles.ocrItemName}>{item.name || 'Tap to edit'}</Text>
                          <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      )}
                      
                      {/* Category Selector */}
                      <View style={styles.ocrItemCategoryContainer}>
                        <TouchableOpacity 
                          style={styles.ocrItemCategoryButton}
                          onPress={() => {
                            // Show category picker
                            const categoryOptions = Object.keys(FOOD_GROUPS);
                            Alert.alert(
                              'Select Category',
                              'Choose a category for this item:',
                              categoryOptions.map(cat => ({
                                text: cat,
                                onPress: () => {
                                  setReceiptItems(prev => prev.map(i => 
                                    i.id === item.id ? { ...i, category: cat } : i
                                  ));
                                }
                              })).concat([{ text: 'Cancel', style: 'cancel' }])
                            );
                          }}
                        >
                          <Text style={styles.ocrItemCategoryText}>{item.category}</Text>
                          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity 
                      style={styles.ocrItemDeleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Remove Item',
                          'Are you sure you want to remove this item?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Remove', 
                              style: 'destructive',
                              onPress: () => {
                                setReceiptItems(prev => prev.filter(i => i.id !== item.id));
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Item Details */}
                  <View style={styles.ocrItemDetails}>
                    <View style={styles.ocrItemDetailRow}>
                      <Text style={styles.ocrItemDetailLabel}>Quantity:</Text>
                      <TextInput
                        style={styles.ocrItemQuantityInput}
                        value={item.quantity}
                        onChangeText={(text) => {
                          setReceiptItems(prev => prev.map(i => 
                            i.id === item.id ? { ...i, quantity: text } : i
                          ));
                        }}
                        placeholder="1"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {item.confidence && (
                      <View style={styles.ocrItemDetailRow}>
                        <Text style={styles.ocrItemDetailLabel}>Confidence:</Text>
                        <Text style={styles.ocrItemConfidence}>
                          {Math.round(item.confidence * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* No Items Found */}
            {receiptItems.length === 0 && (
              <View style={styles.ocrNoItemsContainer}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.ocrNoItemsTitle}>No Items Found</Text>
                <Text style={styles.ocrNoItemsText}>
                  We couldn't detect any grocery items in your receipt. Try taking a clearer photo or add items manually.
                </Text>
              </View>
            )}

            {/* Debug Information for OCR Results */}
            <View style={styles.debugSection}>
              <TouchableOpacity 
                style={styles.debugHeader}
                onPress={() => {
                  // Show debug info
                  Alert.alert(
                    'OCR Debug Info',
                    `Items Found: ${receiptItems.length}\nProcessing: ${receiptProcessing ? 'Yes' : 'No'}\nAPI Key: ${GOOGLE_VISION_API_KEY ? 'Configured' : 'Missing'}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="bug-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.debugHeaderText}>OCR Debug Info</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.debugContent}>
                <Text style={styles.debugLabel}>Items Detected:</Text>
                <Text style={styles.debugValue}>{receiptItems.length}</Text>
                
                <Text style={styles.debugLabel}>API Key Status:</Text>
                <Text style={styles.debugValue}>
                  {GOOGLE_VISION_API_KEY ? 
                    `Configured (${GOOGLE_VISION_API_KEY.length} chars)` : 
                    'Not configured'
                  }
                </Text>
                
                {debugInfo && (
                  <>
                    <Text style={styles.debugLabel}>API Test Result:</Text>
                    <Text style={styles.debugValue}>
                      {debugInfo.apiTest?.valid ? '✅ Valid' : '❌ Invalid'} - {debugInfo.apiTest?.message}
                    </Text>
                    
                    <Text style={styles.debugLabel}>OCR Success:</Text>
                    <Text style={styles.debugValue}>
                      {debugInfo.ocrResult?.success ? '✅ Yes' : '❌ No'}
                    </Text>
                    
                    <Text style={styles.debugLabel}>OCR Message:</Text>
                    <Text style={styles.debugValue} numberOfLines={2}>
                      {debugInfo.ocrResult?.message || 'No message'}
                    </Text>
                    
                    {debugInfo.ocrResult?.debugInfo?.rawText && (
                      <>
                        <Text style={styles.debugLabel}>Raw OCR Text:</Text>
                        <Text style={styles.debugValue} numberOfLines={3}>
                          {debugInfo.ocrResult.debugInfo.rawText.substring(0, 200)}...
                        </Text>
                      </>
                    )}
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.testApiButton}
                  onPress={async () => {
                    try {
                      const result = await testApiKey();
                      Alert.alert(
                        'API Test Results',
                        `Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\nMessage: ${result.message}\n\nType: ${result.type}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Test Failed', error.message);
                    }
                  }}
                >
                  <Text style={styles.testApiButtonText}>Test API Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.ocrResultsFooter}>
            <TouchableOpacity 
              style={styles.ocrRetakeButton}
              onPress={retakePhoto}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.ocrRetakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.ocrAddItemsButton,
                receiptItems.filter(item => item.checked).length === 0 && styles.ocrAddItemsButtonDisabled
              ]}
              onPress={addReceiptItems}
              disabled={receiptItems.filter(item => item.checked).length === 0}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.ocrAddItemsButtonText}>
                Add {receiptItems.filter(item => item.checked).length} Items to Pantry
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Receipt Scan Modal */}
      <Modal
        visible={currentModal === 'receiptScan'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.receiptScanContainer}>
          {/* Header */}
          <View style={styles.receiptScanHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.receiptScanBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.receiptScanTitle}>Scan Receipt</Text>
            <View style={styles.receiptScanSpacer} />
          </View>

          <ScrollView style={styles.receiptScanScroll} showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.receiptScanInstructions}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.primary} />
              <Text style={styles.receiptScanInstructionsTitle}>Take a Clear Photo</Text>
              <Text style={styles.receiptScanInstructionsText}>
                Position your receipt on a flat surface with good lighting. Make sure all text is clearly visible.
              </Text>
            </View>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.imagePreviewActions}>
                  <TouchableOpacity 
                    style={styles.retakeButton}
                    onPress={retakePhoto}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.white} />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.viewFullSizeButton}
                    onPress={() => {
                      setFullScreenImageUri(selectedImage);
                      setFullScreenImageVisible(true);
                    }}
                  >
                    <Ionicons name="expand-outline" size={20} color={COLORS.white} />
                    <Text style={styles.viewFullSizeButtonText}>Full Size</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.receiptScanActions}>
              <TouchableOpacity 
                style={styles.receiptScanButton}
                onPress={takeReceiptPhoto}
              >
                <Ionicons name="camera" size={24} color={COLORS.white} />
                <Text style={styles.receiptScanButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.receiptScanButtonSecondary}
                onPress={pickImageFromLibrary}
              >
                <Ionicons name="images" size={24} color={COLORS.primary} />
                <Text style={styles.receiptScanButtonSecondaryText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>

            {/* Processing Button */}
            {selectedImage && (
              <TouchableOpacity 
                style={styles.processReceiptButton}
                onPress={() => {
                  console.log('🔘 RECEIPT DEBUG - Process Receipt button pressed');
                  console.log('🔘 RECEIPT DEBUG - Selected image:', selectedImage);
                  console.log('🔘 RECEIPT DEBUG - Processing state:', receiptProcessing);
                  processReceipt();
                }}
                disabled={receiptProcessing}
              >
                {receiptProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="scan" size={20} color={COLORS.white} />
                )}
                <Text style={styles.processReceiptButtonText}>
                  {receiptProcessing ? 'Processing...' : 'Process Receipt'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Error Message */}
            {imageError && (
              <View style={styles.receiptScanError}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.receiptScanErrorText}>{imageError}</Text>
              </View>
            )}

            {/* Debug Information */}
            <View style={styles.debugSection}>
              <TouchableOpacity 
                style={styles.debugHeader}
                onPress={() => {
                  // Test API key and show results
                  testApiKey().then(result => {
                    Alert.alert(
                      'API Test Results',
                      `Status: ${result.valid ? 'Valid' : 'Invalid'}\nMessage: ${result.message}\nType: ${result.type}`,
                      [{ text: 'OK' }]
                    );
                  });
                }}
              >
                <Ionicons name="bug-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.debugHeaderText}>Debug Info</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.debugContent}>
                <Text style={styles.debugLabel}>API Key Status:</Text>
                <Text style={styles.debugValue}>
                  {GOOGLE_VISION_API_KEY ? 
                    `Configured (${GOOGLE_VISION_API_KEY.length} chars)` : 
                    'Not configured'
                  }
                </Text>
                
                <Text style={styles.debugLabel}>Image Selected:</Text>
                <Text style={styles.debugValue}>
                  {selectedImage ? 'Yes' : 'No'}
                </Text>
                
                {selectedImage && (
                  <>
                    <Text style={styles.debugLabel}>Image URI:</Text>
                    <Text style={styles.debugValue} numberOfLines={2}>
                      {selectedImage}
                    </Text>
                  </>
                )}
                
                <Text style={styles.debugLabel}>Processing Status:</Text>
                <Text style={styles.debugValue}>
                  {receiptProcessing ? 'Processing...' : 'Ready'}
                </Text>
                
                <TouchableOpacity 
                  style={styles.testApiButton}
                  onPress={async () => {
                    try {
                      const result = await testApiKey();
                      Alert.alert(
                        'API Test Results',
                        `Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\nMessage: ${result.message}\n\nType: ${result.type}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Test Failed', error.message);
                    }
                  }}
                >
                  <Text style={styles.testApiButtonText}>Test API Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={fullScreenImageVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFullScreenImageVisible(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <View style={styles.fullScreenImageHeader}>
            <TouchableOpacity 
              style={styles.fullScreenImageCloseButton}
              onPress={() => setFullScreenImageVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.fullScreenImageTitle}>Receipt Image</Text>
            <View style={styles.fullScreenImageSpacer} />
          </View>
          
          <ScrollView 
            style={styles.fullScreenImageScroll}
            contentContainerStyle={styles.fullScreenImageScrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={3.0}
            minimumZoomScale={1.0}
          >
            {fullScreenImageUri && (
              <Image 
                source={{ uri: fullScreenImageUri }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Barcode Scan Modal */}
      <Modal
        visible={currentModal === 'barcodeScan'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.barcodeScanContainer}>
          {/* Header */}
          <View style={styles.barcodeScanHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.barcodeScanBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.barcodeScanTitle}>Scan Barcode</Text>
            <View style={styles.barcodeScanSpacer} />
          </View>

          <ScrollView style={styles.barcodeScanScroll} showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.barcodeScanInstructions}>
              <Ionicons name="scan-outline" size={64} color={COLORS.primary} />
              <Text style={styles.barcodeScanInstructionsTitle}>Scan Product Barcode</Text>
              <Text style={styles.barcodeScanInstructionsText}>
                Point your camera at the product barcode to automatically add it to your pantry.
              </Text>
            </View>

            {/* Barcode Results */}
            {barcodeProduct && (
              <View style={styles.barcodeResultsContainer}>
                <View style={styles.barcodeProductCard}>
                  <Text style={styles.barcodeProductName}>{barcodeProduct.name}</Text>
                  <Text style={styles.barcodeProductCategory}>{barcodeProduct.category}</Text>
                  
                  <View style={styles.barcodeQuantityContainer}>
                    <Text style={styles.barcodeQuantityLabel}>Quantity:</Text>
                    <TextInput
                      style={styles.barcodeQuantityInput}
                      value={barcodeQuantity}
                      onChangeText={setBarcodeQuantity}
                      placeholder="e.g., 1, 2 lbs, 500g"
                      keyboardType="default"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.barcodeScanActions}>
              <TouchableOpacity 
                style={styles.barcodeScanButton}
                onPress={scanBarcode}
              >
                <Ionicons name="scan" size={24} color={COLORS.white} />
                <Text style={styles.barcodeScanButtonText}>Scan Barcode</Text>
              </TouchableOpacity>

              {barcodeProduct && (
                <TouchableOpacity 
                  style={styles.addBarcodeItemButton}
                  onPress={addBarcodeItem}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={styles.addBarcodeItemButtonText}>Add to Pantry</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {imageError && (
              <View style={styles.barcodeScanError}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.barcodeScanErrorText}>{imageError}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  header: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    marginTop: 32, 
    marginBottom: 24, 
    marginLeft: 24 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0,
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  groceryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 16,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: 16,
    marginBottom: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryItems: {
    padding: 16,
    paddingTop: 8,
  },
  emptyCategory: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    margin: 16,
    borderRadius: 12,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickAddText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 16,
    marginBottom: 8,
    ...SHADOWS.medium,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F8F9FA',
  },
  itemIconText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  urgentWarning: {
    fontSize: 16,
    marginBottom: 4,
  },
  expBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  expBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  expDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 10,
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Enhanced OCR Results Modal styles
  ocrResultsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  ocrResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ocrResultsCloseButton: {
    padding: 8,
  },
  ocrResultsTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  ocrResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ocrResultsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ocrResultsSpacer: {
    width: 40,
  },
  ocrResultsScroll: {
    flex: 1,
  },
  ocrSuccessSummary: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
    margin: 16,
    borderRadius: 16,
  },
  ocrSuccessIcon: {
    marginBottom: 12,
  },
  ocrSuccessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  ocrSuccessText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addManualItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  addManualItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  ocrItemsContainer: {
    padding: 16,
  },
  ocrItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  ocrItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ocrItemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  ocrItemMainInfo: {
    flex: 1,
  },
  ocrItemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ocrItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  ocrItemNameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  ocrItemCategoryContainer: {
    marginBottom: 4,
  },
  ocrItemCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  ocrItemCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  ocrItemDeleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  ocrItemDetails: {
    marginLeft: 36,
  },
  ocrItemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ocrItemDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 80,
  },
  ocrItemQuantityInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    minWidth: 60,
  },
  ocrItemConfidence: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  ocrNoItemsContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
  },
  ocrNoItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  ocrNoItemsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ocrResultsFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  ocrRetakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  ocrRetakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  ocrAddItemsButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ocrAddItemsButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  ocrAddItemsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  // Debug section styles
  debugSection: {
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  debugHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  debugContent: {
    padding: 12,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  testApiButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testApiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Receipt Scan Modal styles
  receiptScanContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  receiptScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptScanBackButton: {
    padding: 8,
  },
  receiptScanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  receiptScanSpacer: {
    width: 40,
  },
  receiptScanScroll: {
    flex: 1,
  },
  receiptScanInstructions: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
  },
  receiptScanInstructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  receiptScanInstructionsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  imagePreviewContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrapper: {
    width: '100%',
    minHeight: 200,
    maxHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    minHeight: 200,
    maxHeight: 400,
  },
  imagePreviewActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullSizeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewFullSizeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  receiptScanActions: {
    padding: 16,
    gap: 12,
  },
  receiptScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  receiptScanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  receiptScanButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  receiptScanButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    margin: 16,
  },
  processReceiptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  receiptScanError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  receiptScanErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Barcode Scan Modal styles
  barcodeScanContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  barcodeScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  barcodeScanBackButton: {
    padding: 8,
  },
  barcodeScanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  barcodeScanSpacer: {
    width: 40,
  },
  barcodeScanScroll: {
    flex: 1,
  },
  barcodeScanInstructions: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
  },
  barcodeScanInstructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  barcodeScanInstructionsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  barcodeResultsContainer: {
    padding: 16,
  },
  barcodeProductCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  barcodeProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  barcodeProductCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  barcodeQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeQuantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  barcodeQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  barcodeScanActions: {
    padding: 16,
    gap: 12,
  },
  barcodeScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  barcodeScanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addBarcodeItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addBarcodeItemButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  barcodeScanError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  barcodeScanErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 32,
    width: '85%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // Manual Entry Form styles
  manualEntryContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  manualEntryBackButton: {
    padding: 4,
  },
  manualEntryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  manualEntrySpacer: {
    width: 32,
  },
  manualEntryScroll: {
    flex: 1,
  },
  manualEntryFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  formTextArea: {
    height: 80,
    paddingTop: 14,
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  categoryOptionTextSelected: {
    color: COLORS.primaryDark,
  },
  quickExpirationContainer: {
    marginTop: 12,
  },
  quickExpirationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quickExpirationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickExpirationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickExpirationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Full-Screen Image Viewer styles
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenImageCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullScreenImageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  fullScreenImageSpacer: {
    width: 40,
  },
  fullScreenImageScroll: {
    flex: 1,
  },
  fullScreenImageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
}); 