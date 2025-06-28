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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractTextFromImage, mockExtractTextFromImage, getOcrStatus } from '../ocrService';
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

// Sample data for demonstration
const sampleItems = [
  { id: '1', name: 'Bananas', category: 'Produce', quantity: '6 pieces', expirationDate: '2024-01-15', notes: 'Yellow, ripe' },
  { id: '2', name: 'Milk', category: 'Dairy & Eggs', quantity: '1 gallon', expirationDate: '2024-01-20', notes: '2%' },
  { id: '3', name: 'Chicken Breast', category: 'Meat & Seafood', quantity: '2 lbs', expirationDate: '2024-01-18', notes: 'Boneless, skinless' },
  { id: '4', name: 'Rice', category: 'Pantry Staples', quantity: '5 lbs', expirationDate: null, notes: 'White rice' },
  { id: '5', name: 'Frozen Peas', category: 'Frozen', quantity: '1 bag', expirationDate: '2024-06-15', notes: '16 oz' },
  { id: '6', name: 'Orange Juice', category: 'Beverages', quantity: '1/2 gallon', expirationDate: '2024-01-25', notes: 'No pulp' },
  { id: '7', name: 'Crackers', category: 'Snacks', quantity: '2 boxes', expirationDate: '2024-03-15', notes: 'Saltine' },
  { id: '8', name: 'Apples', category: 'Produce', quantity: '8 pieces', expirationDate: '2024-01-30', notes: 'Gala' },
];

// Mock receipt scan results
const mockReceiptItems = [
  { id: 'r1', name: 'Whole Milk', category: 'Dairy & Eggs', quantity: '1 gallon', checked: true },
  { id: 'r2', name: 'Bread', category: 'Pantry Staples', quantity: '1 loaf', checked: true },
  { id: 'r3', name: 'Bananas', category: 'Produce', quantity: '1 bunch', checked: true },
  { id: 'r4', name: 'Eggs', category: 'Dairy & Eggs', quantity: '1 dozen', checked: true },
  { id: 'r5', name: 'Chicken Breast', category: 'Meat & Seafood', quantity: '2 lbs', checked: true },
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
  'Dairy & Eggs',
  'Meat & Seafood',
  'Pantry Staples',
  'Frozen',
  'Beverages',
  'Snacks',
  'Other'
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PantryScreen() {
  const [items, setItems] = useState(sampleItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  
  // Unified modal state management
  const [currentModal, setCurrentModal] = useState(null); // 'smartInput', 'receiptOptions', 'receiptScan', 'imagePreview', 'processing', 'results', 'manualForm', 'barcodeScan'
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Produce',
    quantity: '',
    expirationDate: '',
    notes: ''
  });

  // Debug logging
  useEffect(() => {
    console.log('Modal state changed:', { currentModal, selectedImage, imageLoading, receiptProcessing });
  }, [currentModal, selectedImage, imageLoading, receiptProcessing]);

  // Debug ImagePicker object
  useEffect(() => {
    console.log('ImagePicker object keys:', Object.keys(ImagePicker));
    console.log('ImagePicker.MediaTypeOptions:', ImagePicker.MediaTypeOptions);
    console.log('ImagePicker.MediaType:', ImagePicker.MediaType);
  }, []);

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
    resetForm();
  };

  const openSmartInputModal = () => {
    console.log('Opening smart input modal');
    setCurrentModal('smartInput');
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
      
      let result;
      
      if (source === 'camera') {
        // Request camera permissions
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera access to take receipt photos.');
          setImageLoading(false);
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        // Request photo library permissions
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus !== 'granted') {
          Alert.alert('Permission needed', 'Please grant photo library access to select receipt images.');
          setImageLoading(false);
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        setSelectedImage(imageUri);
        
        // Optimize the image before showing preview
        const optimizedUri = await optimizeImage(imageUri);
        console.log('Image optimization complete, showing preview');
        
        setCurrentModal('imagePreview');
      } else {
        console.log('Image selection cancelled');
        // Return to receipt options if cancelled
        setCurrentModal('receiptOptions');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setImageError('Failed to select image. Please try again.');
      Alert.alert('Error', 'Failed to select image. Please try again.');
      // Return to receipt options on error
      setCurrentModal('receiptOptions');
    } finally {
      setImageLoading(false);
    }
  };

  const takeReceiptPhoto = () => {
    selectImage('camera');
  };

  const pickImageFromLibrary = () => {
    selectImage('library');
  };

  const processReceipt = async () => {
    console.log('Processing receipt with enhanced OCR');
    setCurrentModal('processing');
    setReceiptProcessing(true);
    
    try {
      // Use optimized image if available, otherwise use original
      const imageToProcess = optimizedImage || selectedImage;
      
      if (!imageToProcess) {
        throw new Error('No image available for processing');
      }
      
      // Get OCR status for user feedback
      const ocrStatus = getOcrStatus();
      console.log('OCR Status:', ocrStatus);
      
      // Use the enhanced OCR service (handles API key validation and fallbacks)
      const ocrResult = await extractTextFromImage(imageToProcess);
      
      console.log('OCR result:', ocrResult);
      
      if (ocrResult.success && ocrResult.items && ocrResult.items.length > 0) {
        // Convert OCR items to receipt items format with confidence indicators
        const receiptItemsFormatted = ocrResult.items.map((item, index) => ({
          id: `ocr_${index}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          confidence: item.confidence || 'high',
          checked: true // Default to checked for convenience
        }));
        
        setReceiptItems(receiptItemsFormatted);
        setCurrentModal('results');
      } else {
        // Show helpful error message with retry options
        Alert.alert(
          'No Items Found', 
          ocrResult.message || 'We couldn\'t detect any grocery items in your receipt. This might happen if:\n\n• The image is blurry or unclear\n• The receipt text is too small\n• The lighting is poor\n\nTry taking a clearer photo or selecting a different image.',
          [
            { 
              text: 'Try Again', 
              onPress: () => setCurrentModal('receiptOptions') 
            },
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => setCurrentModal('receiptOptions') 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      
      // Show user-friendly error message with retry options
      Alert.alert(
        'Processing Error', 
        'We\'re having trouble processing your receipt right now. This could be due to:\n\n• Poor internet connection\n• Server temporarily unavailable\n• Image format issues\n\nWould you like to try again?',
        [
          { 
            text: 'Try Again', 
            onPress: () => setCurrentModal('receiptOptions') 
          },
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setCurrentModal('receiptOptions') 
          }
        ]
      );
    } finally {
      setReceiptProcessing(false);
    }
  };

  const retakePhoto = () => {
    console.log('Retaking photo');
    setSelectedImage(null);
    setCurrentModal('receiptOptions');
  };

  const scanBarcode = () => {
    setBarcodeProcessing(true);
    // Simulate barcode detection
    setTimeout(() => {
      setBarcodeProcessing(false);
      setBarcodeProduct(mockBarcodeProduct);
      setBarcodeQuantity(mockBarcodeProduct.defaultQuantity);
    }, 2000);
  };

  const addBarcodeItem = () => {
    if (!barcodeProduct || !barcodeQuantity.trim()) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: barcodeProduct.name,
      category: barcodeProduct.category,
      quantity: barcodeQuantity,
      expirationDate: '',
      notes: 'Scanned via barcode'
    };

    setItems([...items, newItem]);
    closeAllModals();
    Alert.alert('Success', 'Item added to pantry!');
  };

  const addReceiptItems = () => {
    const selectedItems = receiptItems.filter(item => item.checked);
    
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please select at least one item to add to your pantry.');
      return;
    }

    const newItems = selectedItems.map(item => ({
      id: Date.now().toString() + Math.random(),
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expirationDate: '',
      notes: 'Added from receipt scan'
    }));

    setItems([...items, ...newItems]);
    closeAllModals();
    Alert.alert('Success', `${selectedItems.length} items added to pantry!`);
  };

  const toggleReceiptItem = (itemId) => {
    setReceiptItems(receiptItems.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
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
    if (!formData.name.trim() || !formData.quantity.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingItem) {
      // Update existing item
      setItems(items.map(item => 
        item.id === editingItem.id ? { ...item, ...formData } : item
      ));
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        ...formData
      };
      setItems([...items, newItem]);
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
          onPress: () => setItems(items.filter(item => item.id !== itemId))
        }
      ]
    );
  };

  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (days) => {
    if (days === null) return '#6C757D';
    if (days < 0) return '#DC3545'; // Expired
    if (days <= 3) return '#FD7E14'; // Expiring soon
    if (days <= 7) return '#FFC107'; // Warning
    return '#28A745'; // Good
  };

  // Filter and group items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const renderItem = ({ item }) => {
    const daysUntilExpiration = getDaysUntilExpiration(item.expirationDate);
    const expirationColor = getExpirationColor(daysUntilExpiration);
    
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
          {item.expirationDate && (
            <View style={styles.expirationContainer}>
              <Ionicons 
                name="time-outline" 
                size={12} 
                color={expirationColor} 
              />
              <Text style={[styles.expirationText, { color: expirationColor }]}>
                {daysUntilExpiration < 0 
                  ? 'Expired' 
                  : daysUntilExpiration === 0 
                    ? 'Expires today' 
                    : `Expires in ${daysUntilExpiration} days`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color="#6C757D" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => deleteItem(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#DC3545" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategorySection = ({ item: category }) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      <FlatList
        data={groupedItems[category]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );

  const renderReceiptItem = ({ item }) => (
    <View style={styles.receiptItemCard}>
      <TouchableOpacity 
        style={styles.receiptItemCheckbox}
        onPress={() => toggleReceiptItem(item.id)}
      >
        <Ionicons 
          name={item.checked ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={item.checked ? '#DC3545' : '#6C757D'} 
        />
      </TouchableOpacity>
      <View style={styles.receiptItemInfo}>
        <View style={styles.receiptItemHeader}>
          <Text style={styles.receiptItemName}>{item.name}</Text>
          {item.confidence && (
            <View style={[
              styles.confidenceBadge,
              item.confidence === 'high' ? styles.confidenceHigh : styles.confidenceMedium
            ]}>
              <Ionicons 
                name={item.confidence === 'high' ? 'checkmark-circle' : 'help-circle'} 
                size={12} 
                color="white" 
              />
              <Text style={styles.confidenceText}>
                {item.confidence === 'high' ? 'High' : 'Medium'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.receiptItemQuantity}>{item.quantity}</Text>
        <Text style={styles.receiptItemCategory}>{item.category}</Text>
        {item.price && (
          <Text style={styles.receiptItemPrice}>${item.price.toFixed(2)}</Text>
        )}
      </View>
    </View>
  );

  const renderPlaceholderCamera = (type) => {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.placeholderCamera}>
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={64} color="#6C757D" />
          </View>
          <Text style={styles.placeholderCameraText}>
            {type === 'receipt' ? 'Receipt Scanner' : 'Barcode Scanner'}
          </Text>
          <Text style={styles.placeholderCameraSubtext}>
            {type === 'receipt' 
              ? 'Position your receipt within the frame for best results' 
              : 'Point your camera at the barcode to scan'}
          </Text>
        </View>
        <View style={styles.cameraFooter}>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={type === 'receipt' ? takeReceiptPhoto : scanBarcode}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera" size={32} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Debug logging for imagePreview modal
  useEffect(() => {
    if (currentModal === 'imagePreview') {
      console.log('ImagePreview modal should be visible now');
      console.log('Selected image URI:', selectedImage);
    }
  }, [currentModal, selectedImage]);

  // Image optimization function
  const optimizeImage = async (imageUri) => {
    try {
      console.log('Starting image optimization for:', imageUri);
      setImageOptimizing(true);
      setImageError(null);

      // Get image info to check size
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // no operations yet
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Original image size:', imageInfo.width, 'x', imageInfo.height);

      // Optimize image: resize if too large and compress
      const optimizedResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: Math.min(imageInfo.width, 1200), // max width 1200px
              height: Math.min(imageInfo.height, 1600), // max height 1600px
            }
          }
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log('Optimized image size:', optimizedResult.width, 'x', optimizedResult.height);
      console.log('Optimized image URI:', optimizedResult.uri);

      setOptimizedImage(optimizedResult.uri);
      return optimizedResult.uri;
    } catch (error) {
      console.error('Image optimization error:', error);
      setImageError('Failed to optimize image. Using original.');
      // Fallback to original image
      setOptimizedImage(imageUri);
      return imageUri;
    } finally {
      setImageOptimizing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title="My Pantry"
        subtitle="Manage your kitchen inventory"
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCurrentModal('smartInput')}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search pantry items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Category Filters */}
      <View style={styles.filterContainer}>
        <FilterRow>
          {categories.map(category => (
            <FilterButton
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </FilterRow>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {Object.keys(groupedItems).length === 0 ? (
          <EmptyState
            icon="basket-outline"
            title={searchQuery || selectedCategory !== 'All' ? 'No items found' : 'Your pantry is empty'}
            message={searchQuery || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first item to get started'}
            action={
              <Button
                title="Add First Item"
                onPress={() => setCurrentModal('smartInput')}
                variant="primary"
                size="medium"
              />
            }
          />
        ) : (
          <FlatList
            data={Object.keys(groupedItems)}
            renderItem={renderCategorySection}
            keyExtractor={(category) => category}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Smart Input Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={currentModal === 'smartInput'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smartInputModal}>
            <View style={styles.smartInputHeader}>
              <Text style={styles.smartInputTitle}>Add Items to Pantry</Text>
              <TouchableOpacity onPress={closeAllModals}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.smartInputOptions}>
              <TouchableOpacity style={styles.smartInputOption} onPress={openReceiptOptions}>
                <View style={styles.optionIcon}>
                  <Ionicons name="receipt" size={32} color="#DC3545" />
                </View>
                <Text style={styles.optionTitle}>Scan Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.smartInputOption} onPress={openBarcodeScan}>
                <View style={styles.optionIcon}>
                  <Ionicons name="barcode" size={32} color="#DC3545" />
                </View>
                <Text style={styles.optionTitle}>Scan Barcode</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.smartInputOption} onPress={openManualForm}>
                <View style={styles.optionIcon}>
                  <Ionicons name="create" size={32} color="#DC3545" />
                </View>
                <Text style={styles.optionTitle}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={currentModal === 'receiptOptions'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smartInputModal}>
            <View style={styles.smartInputHeader}>
              <Text style={styles.smartInputTitle}>Scan Receipt</Text>
              <TouchableOpacity onPress={closeAllModals}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.smartInputOptions}>
              <TouchableOpacity 
                style={[styles.smartInputOption, imageLoading && styles.smartInputOptionDisabled]} 
                onPress={takeReceiptPhoto}
                disabled={imageLoading}
              >
                <View style={styles.optionIcon}>
                  {imageLoading ? (
                    <ActivityIndicator size="small" color="#DC3545" />
                  ) : (
                    <Ionicons name="camera" size={32} color="#DC3545" />
                  )}
                </View>
                <Text style={styles.optionTitle}>
                  {imageLoading ? 'Loading...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.smartInputOption, imageLoading && styles.smartInputOptionDisabled]} 
                onPress={pickImageFromLibrary}
                disabled={imageLoading}
              >
                <View style={styles.optionIcon}>
                  {imageLoading ? (
                    <ActivityIndicator size="small" color="#DC3545" />
                  ) : (
                    <Ionicons name="images" size={32} color="#DC3545" />
                  )}
                </View>
                <Text style={styles.optionTitle}>
                  {imageLoading ? 'Loading...' : 'Choose from Library'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Entry Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={currentModal === 'manualForm'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={closeAllModals}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="e.g., Bananas, Milk, Chicken"
                  placeholderTextColor="#ADB5BD"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryDropdown}>
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category && styles.categoryOptionActive
                      ]}
                      onPress={() => setFormData({...formData, category})}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        formData.category === category && styles.categoryOptionTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({...formData, quantity: text})}
                  placeholder="e.g., 6 pieces, 1 gallon, 2 lbs"
                  placeholderTextColor="#ADB5BD"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Expiration Date (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.expirationDate}
                  onChangeText={(text) => setFormData({...formData, expirationDate: text})}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#ADB5BD"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({...formData, notes: text})}
                  placeholder="e.g., Organic, Boneless, etc."
                  placeholderTextColor="#ADB5BD"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAllModals}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={currentModal === 'imagePreview'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviewHeader}>
              <Text style={styles.imagePreviewTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={closeAllModals}>
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            {/* Image Display Area */}
            <View style={styles.imageDisplayContainer}>
              {imageOptimizing ? (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="large" color="#DC3545" />
                  <Text style={styles.imageLoadingText}>Optimizing image...</Text>
                  <Text style={styles.imageLoadingSubtext}>This may take a few seconds</Text>
                </View>
              ) : imageError ? (
                <View style={styles.imageErrorContainer}>
                  <Ionicons name="warning-outline" size={48} color="#DC3545" />
                  <Text style={styles.imageErrorText}>{imageError}</Text>
                  <Text style={styles.imageErrorSubtext}>The image will still be processed</Text>
                </View>
              ) : optimizedImage ? (
                <Image 
                  source={{ uri: optimizedImage }} 
                  style={styles.optimizedPreviewImage}
                  onError={(error) => {
                    console.log('Optimized image error:', error);
                    setImageError('Failed to load optimized image');
                  }}
                  onLoad={() => console.log('Optimized image loaded successfully')}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="large" color="#DC3545" />
                  <Text style={styles.imageLoadingText}>Loading image...</Text>
                </View>
              )}
            </View>

            {/* Image Info */}
            {optimizedImage && !imageOptimizing && (
              <View style={styles.imageInfoContainer}>
                <Text style={styles.imageInfoText}>
                  ✓ Image optimized for processing
                </Text>
                <Text style={styles.imageInfoSubtext}>
                  Ready for OCR text extraction
                </Text>
                {/* OCR Status Indicator */}
                <View style={styles.ocrStatusContainer}>
                  <Ionicons 
                    name={getOcrStatus().type === 'google' ? 'checkmark-circle' : 'information-circle'} 
                    size={16} 
                    color={getOcrStatus().type === 'google' ? '#28A745' : '#FFC107'} 
                  />
                  <Text style={styles.ocrStatusText}>
                    {getOcrStatus().message}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.imagePreviewActions}>
              <TouchableOpacity 
                style={[styles.imagePreviewButton, styles.secondaryButton]}
                onPress={() => {
                  console.log('Choose Different pressed');
                  retakePhoto();
                }}
                disabled={imageOptimizing}
              >
                <Ionicons name="refresh" size={20} color="#343A40" />
                <Text style={styles.secondaryButtonText}>Choose Different</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.imagePreviewButton, 
                  styles.primaryButton,
                  (!optimizedImage || imageOptimizing) && styles.disabledButton
                ]}
                onPress={() => {
                  console.log('Process Receipt pressed');
                  processReceipt();
                }}
                disabled={!optimizedImage || imageOptimizing}
              >
                <Ionicons name="scan" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Process Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={currentModal === 'processing'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#DC3545" />
            <Text style={styles.processingText}>Reading receipt text...</Text>
            <Text style={styles.processingSubtext}>
              {getOcrStatus().type === 'google' 
                ? 'Using Google Vision API for best accuracy' 
                : 'Using mock OCR (add API key for real OCR)'}
            </Text>
            <Text style={styles.processingSubtext}>This may take 10-30 seconds</Text>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={currentModal === 'results'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Items Found!</Text>
              <Text style={styles.resultsSubtext}>
                We found {receiptItems.length} items on your receipt. 
                Review and select the ones you want to add to your pantry.
              </Text>
            </View>
            
            {/* Summary Stats */}
            <View style={styles.resultsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{receiptItems.length}</Text>
                <Text style={styles.summaryLabel}>Total Items</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {receiptItems.filter(item => item.checked).length}
                </Text>
                <Text style={styles.summaryLabel}>Selected</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  ${receiptItems
                    .filter(item => item.checked && item.price)
                    .reduce((sum, item) => sum + item.price, 0)
                    .toFixed(2)}
                </Text>
                <Text style={styles.summaryLabel}>Total Value</Text>
              </View>
            </View>
            
            <FlatList
              data={receiptItems}
              renderItem={renderReceiptItem}
              keyExtractor={(item) => item.id}
              style={styles.receiptItemsList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeAllModals}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  receiptItems.filter(item => item.checked).length === 0 && styles.disabledButton
                ]} 
                onPress={addReceiptItems}
                disabled={receiptItems.filter(item => item.checked).length === 0}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  Add Selected ({receiptItems.filter(item => item.checked).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={currentModal === 'barcodeScan'}
        onRequestClose={closeAllModals}
      >
        <View style={styles.fullScreenModal}>
          {!barcodeProduct ? (
            <>
              {renderPlaceholderCamera('barcode')}
              {barcodeProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#DC3545" />
                  <Text style={styles.processingText}>Detecting barcode...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.productContainer}>
              <View style={styles.productHeader}>
                <Text style={styles.productTitle}>{barcodeProduct.name}</Text>
                <Text style={styles.productCategory}>{barcodeProduct.category}</Text>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  value={barcodeQuantity}
                  onChangeText={setBarcodeQuantity}
                  placeholder="Enter quantity"
                  placeholderTextColor="#ADB5BD"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeAllModals}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={addBarcodeItem}>
                  <Text style={styles.saveButtonText}>Add to Pantry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  header: {
    backgroundColor: '#DC3545',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#F8F9FA',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#343A40',
  },
  categoryFilter: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabActive: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 12,
    color: '#ADB5BD',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.xl,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
  },
  formContainer: {
    padding: SPACING.xl,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  categoryDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  categoryOptionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  categoryOptionTextActive: {
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  smartInputModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  smartInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  smartInputTitle: {
    ...TYPOGRAPHY.h2,
  },
  smartInputOptions: {
    gap: SPACING.lg,
  },
  smartInputOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smartInputOptionDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  optionTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderCameraText: {
    fontSize: 20,
    color: '#343A40',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderCameraSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cameraFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  processingText: {
    fontSize: 16,
    color: '#343A40',
    marginTop: 16,
    textAlign: 'center',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  resultsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 8,
  },
  resultsSubtext: {
    fontSize: 14,
    color: '#6C757D',
  },
  receiptItemsList: {
    flex: 1,
    padding: 20,
  },
  receiptItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  receiptItemCheckbox: {
    marginRight: 16,
  },
  receiptItemInfo: {
    flex: 1,
  },
  receiptItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 4,
  },
  receiptItemQuantity: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  receiptItemCategory: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  receiptItemPrice: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  productContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  productHeader: {
    marginBottom: 24,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 14,
    color: '#6C757D',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  imagePreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
  },
  imageDisplayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingText: {
    fontSize: 16,
    color: '#343A40',
    marginTop: 16,
    textAlign: 'center',
  },
  imageLoadingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  imageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: 16,
    color: '#DC3545',
    marginTop: 16,
    textAlign: 'center',
  },
  imageErrorSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  imageInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfoText: {
    fontSize: 16,
    color: '#343A40',
    marginTop: 16,
    textAlign: 'center',
  },
  imageInfoSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  imagePreviewButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#DC3545',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confidenceBadge: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#DC3545',
    marginLeft: SPACING.md,
  },
  confidenceHigh: {
    backgroundColor: '#DC3545',
  },
  confidenceMedium: {
    backgroundColor: '#FFC107',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: SPACING.md,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  ocrStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  ocrStatusText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: SPACING.sm,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemsContainer: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartInputModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  smartInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  smartInputTitle: {
    ...TYPOGRAPHY.h2,
  },
  smartInputOptions: {
    gap: SPACING.lg,
  },
  smartInputOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smartInputOptionDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  optionTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.xl,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
  },
  formContainer: {
    padding: SPACING.xl,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  categoryDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  categoryOptionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  categoryOptionTextActive: {
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  categorySection: {
    marginBottom: SPACING.xxl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  categoryCount: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemName: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.md,
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemQuantity: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemExpiration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  expirationWarning: {
    color: COLORS.error,
    fontWeight: '600',
  },
  expirationSoon: {
    color: COLORS.warning,
    fontWeight: '600',
  },
  expirationGood: {
    color: COLORS.success,
    fontWeight: '600',
  },
  placeholderCamera: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  cameraIcon: {
    marginBottom: SPACING.md,
  },
  cameraText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  processingContainer: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  processingText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  processingSubtext: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  resultsContainer: {
    maxHeight: 400,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  resultsTitle: {
    ...TYPOGRAPHY.h3,
  },
  resultsCount: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  resultsList: {
    maxHeight: 300,
  },
  receiptItemCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptItemCheckbox: {
    marginRight: SPACING.md,
  },
  receiptItemInfo: {
    flex: 1,
  },
  receiptItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptItemName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  receiptItemCategory: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  barcodeProductCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  barcodeProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  barcodeProductIcon: {
    marginRight: SPACING.md,
  },
  barcodeProductName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  barcodeProductCategory: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  barcodeQuantityInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
}); 